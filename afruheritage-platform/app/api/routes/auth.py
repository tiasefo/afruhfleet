from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from sqlalchemy.orm import Session
import uuid
from jose import jwt
from app.api.deps import get_current_user, get_current_user_no_tenant_check
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.core.structured_logging import security_logger
from app.db.session import get_db
from app.middleware.rate_limit import rate_limit
from app.models.user import User, UserRole
from app.schemas.auth import BootstrapAdminRequest, LoginRequest, PasswordResetConfirmRequest, RegisterRequest, TokenResponse
from app.services.signup_onboarding_service import ensure_user_tenant_context
from app.services.billing_service import normalize_plan_code
from app.services.notification_service import NotificationService

router = APIRouter(prefix='/auth', tags=['auth'])

COOKIE_MAX_AGE = 7 * 24 * 60 * 60  # 7 days in seconds


def _set_auth_cookie(response: Response, token: str) -> None:
    """Set HttpOnly auth cookie so frontend JS never touches the JWT."""
    is_production = settings.app_env == 'production'
    response.set_cookie(
        key='access_token',
        value=token,
        httponly=True,
        secure=is_production,
        samesite='lax',
        path='/',
        max_age=COOKIE_MAX_AGE,
    )


def _clear_auth_cookie(response: Response) -> None:
    """Clear the HttpOnly auth cookie."""
    response.delete_cookie(key='access_token', path='/')

@router.post('/bootstrap', response_model=TokenResponse)
def bootstrap_admin(payload: BootstrapAdminRequest, response: Response, db: Session=Depends(get_db)) -> TokenResponse:
    if not settings.enable_bootstrap_admin:
        raise HTTPException(status_code=403, detail='Bootstrap admin route disabled')
    existing_admin = db.scalar(select(User).where(User.is_superuser.is_(True)))
    if existing_admin:
        raise HTTPException(status_code=409, detail='Bootstrap admin already exists')
    user = User(email=payload.email.lower(), full_name=payload.full_name, hashed_password=get_password_hash(payload.password), is_superuser=True, is_tenant_admin=False, is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id), tenant_id=str(user.tenant_id) if user.tenant_id else None)
    _set_auth_cookie(response, token)
    return TokenResponse(access_token=token, tenant_id=str(user.tenant_id) if user.tenant_id else None)

@router.post('/register', response_model=TokenResponse)
def register(payload: RegisterRequest, response: Response, db: Session=Depends(get_db)) -> TokenResponse:
    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=409, detail='An account with this email already exists')
    user = User(email=payload.email.lower(), full_name=payload.full_name, hashed_password=get_password_hash(payload.password), is_superuser=False, is_tenant_admin=True, is_active=True)
    db.add(user)
    db.flush()
    ensure_user_tenant_context(
        db,
        user,
        company_name=payload.company_name,
        plan_code=normalize_plan_code(payload.plan_code).value,
    )
    db.flush()
    db.refresh(user)
    # Fetch the tenant's slug to build the portal URL
    subdomain: str | None = None
    portal_url: str | None = None
    if user.tenant_id:
        from app.models.tenant import Tenant
        tenant = db.scalar(select(Tenant).where(Tenant.id == user.tenant_id))
        if tenant and tenant.slug:
            subdomain = tenant.slug
            portal_url = f"https://{tenant.slug}.afruheritage.com"
    # Create JWT before committing — if this fails, user+tenant roll back together
    token = create_access_token(str(user.id), tenant_id=str(user.tenant_id) if user.tenant_id else None)
    # Commit the entire registration transaction atomically (user + tenant + roles)
    db.commit()
    _set_auth_cookie(response, token)

    # Send welcome email to the newly registered user
    try:
        notification_service = NotificationService()
        welcome_html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 16px;">Welcome to Afruheritage!</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Hi {payload.full_name}, your freight forwarding platform <strong>{payload.company_name}</strong> has been created successfully!
            </p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; color: #64748b;"><strong>Your Portal:</strong> {portal_url or 'https://afruheritage.com'}</p>
                <p style="margin: 8px 0 0; color: #64748b;"><strong>Login Email:</strong> {payload.email}</p>
            </div>
            <div style="margin: 32px 0;">
                <a href="{portal_url or 'https://afruheritage.com'}/login"
                   style="background: #0ea5e9; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    Login to Your Portal
                </a>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">
                If you did not create this account, please contact support immediately.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
            <p style="color: #cbd5e1; font-size: 12px;">Afruheritage — The African TransUnion Freight Forwarding Platform</p>
        </div>
        """
        notification_service.send_generic_email(
            to=payload.email.lower(),
            subject=f"Welcome to Afruheritage — {payload.company_name} is Ready!",
            html_body=welcome_html,
            plain_body=f"Welcome to Afruheritage!\n\nHi {payload.full_name}, your freight forwarding platform {payload.company_name} has been created successfully.\n\nYour Portal: {portal_url or 'https://afruheritage.com'}\nLogin Email: {payload.email}\n\nLogin at: {portal_url or 'https://afruheritage.com'}/login",
        )
    except Exception as e:
        import logging
        logging.getLogger("afruheritage.auth").error(f"Failed to send registration welcome email: {e}")
    return TokenResponse(
        access_token=token,
        tenant_id=str(user.tenant_id) if user.tenant_id else None,
        subdomain=subdomain,
        portal_url=portal_url,
        requires_subscription=True if user.tenant_id else False,
    )

@router.post('/login', response_model=TokenResponse)
@rate_limit(category='public', rule='login')
def login(request: Request, payload: LoginRequest, response: Response, db: Session=Depends(get_db)) -> TokenResponse:
    login_email = payload.email.lower()
    user = db.scalar(select(User).where(User.email == login_email))
    ip_address = request.client.host if request.client else 'unknown'
    user_agent = request.headers.get('User-Agent', '')
    if not user or not verify_password(payload.password, user.hashed_password):
        security_logger.log_login_attempt(email=login_email, success=False, ip_address=ip_address, user_agent=user_agent, failure_reason='Invalid credentials')
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Incorrect email or password')

    if user.must_reset_password:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Password setup required. Use the reset link sent to your email.')

    if not user.is_superuser and not user.tenant_id:
        ensure_user_tenant_context(db, user)

    # Business owners must resolve to a tenant before they can receive a token.
    if not user.is_superuser and user.role == UserRole.company_admin and not user.tenant_id:
        security_logger.log_login_attempt(email=user.email, success=False, ip_address=ip_address, user_agent=user_agent, failure_reason='Business account missing tenant')
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Business account not fully onboarded. Please complete registration.')

    security_logger.log_login_attempt(email=user.email, success=True, ip_address=ip_address, user_agent=user_agent)

    # Determine if subscription/plan selection is still required
    requires_sub = False
    subdomain = None
    portal_url = None
    if user.tenant_id and not user.is_superuser:
        from app.models.tenant import Tenant, LaunchStatus
        tenant = db.scalar(select(Tenant).where(Tenant.id == user.tenant_id))
        if tenant:
            if tenant.launch_status in (LaunchStatus.draft, LaunchStatus.pending_verification):
                requires_sub = True
            if tenant.slug:
                subdomain = tenant.slug
                portal_url = f"https://{tenant.slug}.afruheritage.com"

    token = create_access_token(str(user.id), tenant_id=str(user.tenant_id) if user.tenant_id else None)
    _set_auth_cookie(response, token)
    return TokenResponse(
        access_token=token,
        tenant_id=str(user.tenant_id) if user.tenant_id else None,
        subdomain=subdomain,
        portal_url=portal_url,
        requires_subscription=requires_sub,
    )

@router.get('/me')
def me(current_user: User=Depends(get_current_user_no_tenant_check)) -> dict[str, str | bool | None]:
    return {
        'id': str(current_user.id),
        'email': current_user.email,
        'full_name': current_user.full_name,
        'role': current_user.role.value if current_user.role else 'personal_shipper',
        'is_tenant_admin': current_user.is_tenant_admin,
        'is_superuser': current_user.is_superuser,
        'onboarding_complete': current_user.onboarding_complete,
        'tenant_id': str(getattr(current_user, 'tenant_id', None)) if getattr(current_user, 'tenant_id', None) else None,
    }


@router.get('/session')
def session(request: Request, db: Session = Depends(get_db)) -> dict:
    """Lightweight session discovery — always returns 200.
    Returns {authenticated: true, user: {...}} when a valid cookie exists,
    or {authenticated: false, user: null} when unauthenticated.
    This avoids browser console 401 errors on public pages."""
    cookie_token = request.cookies.get('access_token')
    if not cookie_token:
        return {'authenticated': False, 'user': None}
    try:
        payload = jwt.decode(cookie_token, settings.secret_key, algorithms=['HS256'])
        sub = payload.get('sub')
        if not sub:
            return {'authenticated': False, 'user': None}
        user = db.get(User, uuid.UUID(str(sub)))
        if not user or not user.is_active:
            return {'authenticated': False, 'user': None}
        return {
            'authenticated': True,
            'user': {
                'id': str(user.id),
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role.value if user.role else 'personal_shipper',
                'is_tenant_admin': user.is_tenant_admin,
                'is_superuser': user.is_superuser,
                'onboarding_complete': user.onboarding_complete,
                'tenant_id': str(user.tenant_id) if user.tenant_id else None,
            },
        }
    except Exception:
        return {'authenticated': False, 'user': None}


class CompleteOnboardingRequest(BaseModel):
    role: str  # personal_shipper | delivery_driver | company_admin
    full_name: str | None = None


@router.post('/complete-onboarding')
def complete_onboarding(
    payload: CompleteOnboardingRequest,
    current_user: User = Depends(get_current_user_no_tenant_check),
    db: Session = Depends(get_db),
) -> dict[str, str | bool | None]:
    from app.models.user import UserRole
    role_map = {
        'personal_shipper': UserRole.personal_shipper,
        'delivery_driver': UserRole.delivery_driver,
        'company_admin': UserRole.company_admin,
    }
    if payload.role not in role_map:
        raise HTTPException(status_code=400, detail=f'Invalid role: {payload.role}')
    current_user.role = role_map[payload.role]
    if payload.full_name:
        current_user.full_name = payload.full_name
    current_user.onboarding_complete = True
    if current_user.role == UserRole.company_admin:
        current_user.is_tenant_admin = True
        ensure_user_tenant_context(db, current_user)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return {
        'status': 'ok',
        'role': current_user.role.value,
        'onboarding_complete': True,
    }


class ForgotPasswordRequest(BaseModel):
    email: str


@router.post('/forgot-password')
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)) -> dict[str, str]:
    """Request a password reset email."""
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user:
        # Don't reveal if email exists for security
        return {'status': 'ok', 'message': 'If an account with this email exists, a reset link has been sent.'}

    # Generate reset token
    import secrets
    token = secrets.token_urlsafe(32)
    user.password_reset_token = token
    user.password_reset_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    user.must_reset_password = True
    db.add(user)
    db.commit()

    # Send reset email
    try:
        from app.services.notification_service import get_notification_service
        notification_service = get_notification_service()
        base_url = settings.base_url.rstrip("/")
        reset_url = f"{base_url}/login?reset_token={token}"
        notification_service.send_password_reset_email(to=user.email, reset_url=reset_url)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send password reset email: {e}")
        # Don't fail the request - token is still set

    return {'status': 'ok', 'message': 'If an account with this email exists, a reset link has been sent.'}


@router.post('/password-reset/confirm')
def confirm_password_reset(payload: PasswordResetConfirmRequest, db: Session = Depends(get_db)) -> dict[str, str]:
    user = db.scalar(select(User).where(User.password_reset_token == payload.token))
    if not user:
        raise HTTPException(status_code=404, detail='Invalid reset token')

    now = datetime.now(timezone.utc)
    expires_at = user.password_reset_expires_at
    if not expires_at:
        raise HTTPException(status_code=400, detail='Reset token expired')
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now:
        raise HTTPException(status_code=400, detail='Reset token expired')

    user.hashed_password = get_password_hash(payload.new_password)
    user.password_reset_token = None
    user.password_reset_expires_at = None
    user.must_reset_password = False
    user.is_active = True
    db.add(user)
    db.commit()

    return {'status': 'ok', 'message': 'Password updated successfully. You can now sign in.'}


@router.post('/logout')
def logout(response: Response) -> dict[str, str]:
    """Clear the HttpOnly auth cookie."""
    _clear_auth_cookie(response)
    return {'status': 'ok', 'message': 'Logged out successfully'}