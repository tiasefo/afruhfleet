from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.core.structured_logging import security_logger
from app.db.session import get_db
from app.middleware.rate_limit import rate_limit
from app.models.user import User
from app.schemas.auth import BootstrapAdminRequest, LoginRequest, RegisterRequest, TokenResponse

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/bootstrap', response_model=TokenResponse)
def bootstrap_admin(payload: BootstrapAdminRequest, db: Session = Depends(get_db)) -> TokenResponse:
    if not settings.enable_bootstrap_admin:
        raise HTTPException(status_code=403, detail='Bootstrap admin route disabled')
    existing_admin = db.scalar(select(User).where(User.is_superuser.is_(True)))
    if existing_admin:
        raise HTTPException(status_code=409, detail='Bootstrap admin already exists')

    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        is_superuser=True,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post('/register', response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=409, detail='An account with this email already exists')
    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        is_superuser=False,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post('/login', response_model=TokenResponse)
@rate_limit(category="public", rule="login")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.username.lower()))
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("User-Agent", "")
    
    if not user or not verify_password(payload.password, user.hashed_password):
        # Log failed login attempt
        security_logger.log_login_attempt(
            email=payload.username.lower(),
            success=False,
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason="Invalid credentials"
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Incorrect email or password')
    
    # Log successful login
    security_logger.log_login_attempt(
        email=user.email,
        success=True,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.get('/me')
def me(current_user: User = Depends(get_current_user)) -> dict[str, str | bool]:
    return {
        'email': current_user.email,
        'full_name': current_user.full_name,
        'is_superuser': current_user.is_superuser,
    }
