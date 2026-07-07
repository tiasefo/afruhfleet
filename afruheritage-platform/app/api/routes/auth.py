from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_current_user_no_tenant_check
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.core.structured_logging import security_logger
from app.db.session import get_db
from app.middleware.rate_limit import rate_limit
from app.models.user import User
from app.schemas.auth import BootstrapAdminRequest, LoginRequest, PasswordResetConfirmRequest, RegisterRequest, TokenResponse
from app.services.signup_onboarding_service import ensure_user_tenant_context
from app.services.billing_service import normalize_plan_code
router = APIRouter(prefix='/auth', tags=['auth'])

@router.post('/bootstrap', response_model=TokenResponse)
def bootstrap_admin(payload: BootstrapAdminRequest, db: Session=Depends(get_db)) -> TokenResponse:
    if not settings.enable_bootstrap_admin:
        raise HTTPException(status_code=403, detail='Bootstrap admin route disabled')
    existing_admin = db.scalar(select(User).where(User.is_superuser.is_(True)))
    if existing_admin:
        raise HTTPException(status_code=409, detail='Bootstrap admin already exists')
    user = User(email=payload.email.lower(), full_name=payload.full_name, hashed_password=get_password_hash(payload.password), is_superuser=True, is_tenant_admin=False, is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(str(user.id)), tenant_id=str(user.tenant_id) if user.tenant_id else None)

@router.post('/register', response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session=Depends(get_db)) -> TokenResponse:
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
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        tenant_id=str(user.tenant_id) if user.tenant_id else None,
        subdomain=subdomain,
        portal_url=portal_url,
        requires_subscription=True if user.tenant_id else False,
    )

@router.post('/login', response_model=TokenResponse)
@rate_limit(category='public', rule='login')
def login(request: Request, payload: LoginRequest, db: Session=Depends(get_db)) -> TokenResponse:
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

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
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
        subject = "Password Reset Request"
        body = f"""
        <html>
            <body>
                <p>Dear {user.full_name or user.email},</p>
                <p>You have requested a password reset for your Afruheritage account.</p>
                <p>Click the link below to reset your password:</p>
                <p><a href="{reset_url}">Reset Password</a></p>
                <p>This link will expire in 1 hour.</p>
                <p>If you did not request this reset, please ignore this email.</p>
                <p>Thank you,<br>The Afruheritage Team</p>
            </body>
        </html>
        """
        notification_service.send_email(to_email=user.email, subject=subject, html_content=body)
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