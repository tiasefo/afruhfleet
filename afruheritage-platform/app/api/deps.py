from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.structured_logging import user_id
from app.db.session import get_db
from app.models.user import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_v1_prefix}/auth/login")


def db_session() -> Session:
    return next(get_db())


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db), request: Request = None) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='Could not validate credentials',
        headers={'WWW-Authenticate': 'Bearer'},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=['HS256'])
        user_id_str: str | None = payload.get('sub')
        if user_id_str is None:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc

    user = db.get(User, user_id_str)
    if user is None or not user.is_active:
        raise credentials_exception
    
    # Set user context for structured logging
    if request:
        request.state.user_id = user_id_str
        user_id.set(user_id_str)
    
    return user


def require_superuser(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail='Superuser access required')
    return current_user
