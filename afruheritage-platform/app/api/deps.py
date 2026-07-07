import uuid
from functools import wraps
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.structured_logging import user_id
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.services.signup_onboarding_service import ensure_user_tenant_context
from app.services.billing_service import evaluate_subscription_state
from app.models.billing import SubscriptionStatus


oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_v1_prefix}/auth/login")


def db_session() -> Session:
    return next(get_db())


def _resolve_tenant_identifier(db: Session, tenant_identifier: str) -> str | None:
    try:
        return str(uuid.UUID(str(tenant_identifier)))
    except (ValueError, TypeError):
        tenant = db.query(Tenant).filter(
            (Tenant.slug == tenant_identifier) | (Tenant.subdomain == tenant_identifier)
        ).first()
        return str(tenant.id) if tenant else None


def get_current_user(request: Request, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='Could not validate credentials',
        headers={'WWW-Authenticate': 'Bearer'},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=['HS256'])
        sub = payload.get('sub')
        if not sub:
            raise credentials_exception
        user_id_val = uuid.UUID(str(sub))
    except (JWTError, ValueError, TypeError) as exc:
        raise credentials_exception from exc

    user = db.get(User, user_id_val)
    if user is None or not user.is_active:
        raise credentials_exception

    if not user.is_superuser and not user.tenant_id:
        ensure_user_tenant_context(db, user)
        db.refresh(user)

    if request and not user.is_superuser:
        candidate_tenant = request.path_params.get('tenant_id') or request.query_params.get('tenant_id')
        if candidate_tenant:
            resolved = _resolve_tenant_identifier(db, candidate_tenant)
            if not resolved or resolved != str(user.tenant_id):
                raise HTTPException(status_code=403, detail='Tenant access denied')
    
    # Set user context for structured logging
    if request:
        request.state.user_id = str(user_id_val)
        request.state.tenant_id = str(user.tenant_id) if user.tenant_id else None
        user_id.set(str(user_id_val))
    
    return user


def get_current_user_no_tenant_check(request: Request, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Authenticate user without enforcing tenant_id query param match.
    Use for user-profile endpoints like /auth/me where stale tenant_id in
    browser localStorage should not block access."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='Could not validate credentials',
        headers={'WWW-Authenticate': 'Bearer'},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=['HS256'])
        sub = payload.get('sub')
        if not sub:
            raise credentials_exception
        user_id_val = uuid.UUID(str(sub))
    except (JWTError, ValueError, TypeError) as exc:
        raise credentials_exception from exc

    user = db.get(User, user_id_val)
    if user is None or not user.is_active:
        raise credentials_exception

    if not user.is_superuser and not user.tenant_id:
        ensure_user_tenant_context(db, user)
        db.refresh(user)

    if request:
        request.state.user_id = str(user_id_val)
        request.state.tenant_id = str(user.tenant_id) if user.tenant_id else None
        user_id.set(str(user_id_val))

    return user


def require_superuser(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail='Superuser access required')
    return current_user


def require_tenant_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require tenant admin access (superuser or tenant admin)."""
    if not current_user.is_superuser and not current_user.is_tenant_admin:
        raise HTTPException(status_code=403, detail='Tenant admin access required')
    return current_user


def get_current_tenant(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    """Get current tenant context for the authenticated user."""
    if not current_user.tenant_id:
        raise HTTPException(status_code=404, detail='No tenant context')
    
    tenant = db.get(Tenant, current_user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail='Tenant not found')
    
    return {
        "id": str(tenant.id),
        "slug": tenant.slug,
        "company_name": tenant.company_name,
    }


def get_current_group_member(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current group member for the authenticated user."""
    from app.models.shipment import GroupMember
    from app.models.group_members import GroupMemberRole
    
    if not current_user.tenant_id:
        raise HTTPException(status_code=403, detail='No tenant context')
    
    member = db.query(GroupMember).filter(
        GroupMember.user_id == current_user.id,
        GroupMember.tenant_id == current_user.tenant_id
    ).first()
    
    if not member:
        # Create a GroupMember if it doesn't exist, using is_tenant_admin to determine role
        role = GroupMemberRole.ADMIN if current_user.is_tenant_admin else GroupMemberRole.CUSTOMER
        member = GroupMember(
            tenant_id=current_user.tenant_id,
            user_id=current_user.id,
            full_name=current_user.full_name,
            email=current_user.email,
            role=role,
            is_active=True,
        )
        db.add(member)
        db.commit()
        db.refresh(member)
    
    return member


def require_active_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    """Require tenant to have an active subscription before allowing action.
    Raises 402 (Payment Required) if no active subscription found or if it's read_only/suspended.
    """
    if current_user.is_superuser:
        return current_user
    
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=402,
            detail="No tenant context. Please create or select a tenant first.",
        )
    
    sub = evaluate_subscription_state(db, str(current_user.tenant_id))
    if not sub:
        raise HTTPException(
            status_code=402,
            detail="No active subscription found. Please select a plan and complete payment.",
        )
    
    # Block actions if subscription is in an unusable state
    if sub.status == SubscriptionStatus.READ_ONLY:
        raise HTTPException(
            status_code=402,
            detail=f"Subscription is read-only: {sub.read_only_reason or 'Account suspended'}",
        )
    
    if sub.status in (SubscriptionStatus.CANCELED, SubscriptionStatus.EXPIRED, SubscriptionStatus.SUSPENDED):
        raise HTTPException(
            status_code=402,
            detail=f"Subscription is {sub.status.value}. Please renew to continue.",
        )
    
    return current_user


def require_feature(feature_code: str):
    """FastAPI dependency factory that checks if the current user's tenant has
    access to a specific feature based on their subscription tier.

    Usage:
        @router.post("/ai/chat")
        def ai_chat(..., _: User = Depends(require_feature("ai_chat"))):
    """
    def _check_feature(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        if current_user.is_superuser:
            return current_user

        if not current_user.tenant_id:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "no_tenant_context",
                    "required_feature": feature_code,
                    "message": "No tenant associated with this user.",
                },
            )

        from app.services.entitlements import tenant_has_feature

        if not tenant_has_feature(db, str(current_user.tenant_id), feature_code):
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "feature_not_available_on_plan",
                    "required_feature": feature_code,
                    "message": "Upgrade your subscription to access this feature.",
                },
            )
        return current_user

    return _check_feature
