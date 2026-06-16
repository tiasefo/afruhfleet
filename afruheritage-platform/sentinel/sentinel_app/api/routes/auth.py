from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from sentinel_app.api.deps import get_current_admin, require_super_admin
from sentinel_app.core.security import create_admin_token, get_password_hash, verify_password
from sentinel_app.db.session import get_db
from sentinel_app.models.admin_user import AdminUser
from sentinel_app.schemas.auth import (
    AdminCreateRequest,
    AdminLoginRequest,
    AdminTokenResponse,
    AdminUserResponse,
)
from sentinel_app.services.audit_service import record_admin_audit
from sentinel_app.services import control_plane_client as cp

router = APIRouter(prefix="/auth", tags=["Admin Auth"])


@router.post("/login", response_model=AdminTokenResponse)
def admin_login(payload: AdminLoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(AdminUser).where(AdminUser.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    record_admin_audit(db, admin_email=user.email, action="admin.login", entity_type="admin_user", entity_id=str(user.id))
    control_plane_token = None
    try:
        # Use email as username for control plane login
        control_plane_token = cp.login_control_plane(user.email.lower(), payload.password)
    except Exception:
        control_plane_token = None
    return AdminTokenResponse(access_token=create_admin_token(str(user.id)), control_plane_token=control_plane_token)


@router.get("/me", response_model=AdminUserResponse)
def admin_me(current_admin: AdminUser = Depends(get_current_admin)):
    return AdminUserResponse(
        id=str(current_admin.id),
        email=current_admin.email,
        full_name=current_admin.full_name,
        role=current_admin.role,
        is_active=current_admin.is_active,
    )


@router.post("/users", response_model=AdminUserResponse)
def create_admin_user(
    payload: AdminCreateRequest,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_super_admin),
):
    existing = db.scalar(select(AdminUser).where(AdminUser.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=409, detail="Admin user already exists")

    user = AdminUser(
        email=payload.email.lower(),
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="admin.user_created",
        entity_type="admin_user",
        entity_id=str(user.id),
        details={"email": user.email, "role": user.role},
    )
    return AdminUserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
    )


@router.get("/users", response_model=list[AdminUserResponse])
def list_admin_users(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_super_admin),
):
    users = db.scalars(select(AdminUser).order_by(AdminUser.created_at.asc())).all()
    return [
        AdminUserResponse(
            id=str(u.id),
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
        )
        for u in users
    ]


@router.post("/bootstrap", response_model=AdminTokenResponse)
def bootstrap_first_admin(payload: AdminCreateRequest, db: Session = Depends(get_db)):
    existing = db.scalar(select(AdminUser).where(AdminUser.role == "super_admin"))
    if existing:
        raise HTTPException(status_code=409, detail="Super admin already exists")

    user = AdminUser(
        email=payload.email.lower(),
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role="super_admin",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    record_admin_audit(db, admin_email=user.email, action="admin.bootstrap", entity_type="admin_user", entity_id=str(user.id))
    control_plane_token = None
    try:
        control_plane_token = cp.login_control_plane(payload.email.lower(), payload.password)
    except Exception:
        control_plane_token = None
    return AdminTokenResponse(access_token=create_admin_token(str(user.id)), control_plane_token=control_plane_token)
