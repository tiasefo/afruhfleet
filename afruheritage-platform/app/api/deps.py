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
        user_id_str: str | None = uuid.UUID(payload.get('sub'))
        if user_id_str is None:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc

    user = db.get(User, user_id_str)
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
        request.state.user_id = user_id_str
        request.state.tenant_id = str(user.tenant_id) if user.tenant_id else None
        user_id.set(user_id_str)
    
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
        user_id_str: str | None = uuid.UUID(payload.get('sub'))
        if user_id_str is None:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc

    user = db.get(User, user_id_str)
    if user is None or not user.is_active:
        raise credentials_exception

    if not user.is_superuser and not user.tenant_id:
        ensure_user_tenant_context(db, user)
        db.refresh(user)

    if request:
        request.state.user_id = user_id_str
        request.state.tenant_id = str(user.tenant_id) if user.tenant_id else None
        user_id.set(user_id_str)

    return user


def require_superuser(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail='Superuser access required')
    return current_user


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
