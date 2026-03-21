from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from admin_app.core.config import admin_settings
from admin_app.db.session import get_db
from admin_app.models.admin_user import AdminUser

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/admin/auth/login")


def get_current_admin(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> AdminUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, admin_settings.secret_key, algorithms=["HS256"])
        if payload.get("iss") != "admin-console":
            raise credentials_exception
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc

    user = db.get(AdminUser, user_id)
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def require_super_admin(
    current_admin: AdminUser = Depends(get_current_admin),
) -> AdminUser:
    if current_admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return current_admin
