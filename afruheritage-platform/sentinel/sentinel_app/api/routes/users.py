from __future__ import annotations

from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from sentinel_app.api.deps import get_current_admin, require_super_admin
from sentinel_app.core.security import get_password_hash
from sentinel_app.db.session import get_db
from sentinel_app.models.admin_user import AdminUser
from sentinel_app.schemas.auth import AdminUserResponse
from sentinel_app.services.audit_service import record_admin_audit

router = APIRouter(prefix="/users", tags=["users"])


class UserListResponse(BaseModel):
    items: List[AdminUserResponse]
    total: int
    skip: int
    limit: int


class UserCreateRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=12)
    role: str = Field(default="admin", pattern="^(super_admin|admin|viewer)$")


class UserUpdateRequest(BaseModel):
    full_name: str | None = None
    role: str | None = Field(default=None, pattern="^(super_admin|admin|viewer)$")
    is_active: bool | None = None
    password: str | None = None


def _to_response(u: AdminUser) -> AdminUserResponse:
    return AdminUserResponse(
        id=str(u.id),
        email=u.email,
        full_name=u.full_name,
        role=u.role,
        is_active=u.is_active,
    )


@router.get("/", response_model=UserListResponse)
def list_users(
    *,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: str | None = Query(None),
    role: str | None = Query(None),
    is_active: bool | None = Query(None),
) -> Any:
    """List admin users with filtering and pagination."""
    query = select(AdminUser)

    if search:
        query = query.where(
            (AdminUser.email.ilike(f"%{search}%"))
            | (AdminUser.full_name.ilike(f"%{search}%"))
        )

    if role:
        query = query.where(AdminUser.role == role)

    if is_active is not None:
        query = query.where(AdminUser.is_active == is_active)

    total = len(db.scalars(query).all())
    users = db.scalars(
        query.order_by(AdminUser.created_at.desc()).offset(skip).limit(limit)
    ).all()

    return UserListResponse(
        items=[_to_response(u) for u in users],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.post("/", response_model=AdminUserResponse)
def create_user(
    *,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_super_admin),
    user_in: UserCreateRequest,
) -> Any:
    """Create a new admin user."""
    existing = db.scalar(select(AdminUser).where(AdminUser.email == user_in.email.lower()))
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    user = AdminUser(
        email=user_in.email.lower(),
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        is_active=True,
    )
    db.add(user)
    db.flush()  # materialize user.id for the audit entity_id
    # Atomic fail-closed: audit row joins the same transaction — if it
    # cannot be persisted, the user is not created.
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="admin.user_created",
        entity_type="admin_user",
        entity_id=str(user.id),
        details={"email": user.email, "role": user.role},
        commit=False,
    )
    db.commit()
    db.refresh(user)
    return _to_response(user)


@router.get("/{user_id}", response_model=AdminUserResponse)
def get_user(
    *,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
    user_id: UUID,
) -> Any:
    """Get admin user by ID."""
    user = db.scalar(select(AdminUser).where(AdminUser.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_response(user)


@router.put("/{user_id}", response_model=AdminUserResponse)
def update_user(
    *,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_super_admin),
    user_id: UUID,
    user_in: UserUpdateRequest,
) -> Any:
    """Update admin user."""
    user = db.scalar(select(AdminUser).where(AdminUser.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_in.model_dump(exclude_unset=True)

    if "password" in update_data and update_data["password"]:
        user.hashed_password = get_password_hash(update_data["password"])
    if "full_name" in update_data and update_data["full_name"]:
        user.full_name = update_data["full_name"]
    if "role" in update_data and update_data["role"]:
        user.role = update_data["role"]
    if "is_active" in update_data and update_data["is_active"] is not None:
        user.is_active = update_data["is_active"]

    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="admin.user_updated",
        entity_type="admin_user",
        entity_id=str(user.id),
        details=update_data,
        commit=False,
    )
    db.commit()
    db.refresh(user)
    return _to_response(user)


@router.delete("/{user_id}")
def delete_user(
    *,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_super_admin),
    user_id: UUID,
) -> Any:
    """Delete admin user (hard delete)."""
    user = db.scalar(select(AdminUser).where(AdminUser.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    user_email = user.email
    db.delete(user)
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="admin.user_deleted",
        entity_type="admin_user",
        entity_id=str(user_id),
        details={"email": user_email},
        commit=False,
    )
    db.commit()
    return {"detail": f"User {user_email} has been permanently deleted"}


@router.post("/{user_id}/activate")
def activate_user(
    *,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_super_admin),
    user_id: UUID,
) -> Any:
    """Activate admin user account."""
    user = db.scalar(select(AdminUser).where(AdminUser.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = True
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="admin.user_activated",
        entity_type="admin_user",
        entity_id=str(user.id),
        commit=False,
    )
    db.commit()
    return {"detail": f"User {user.email} has been activated"}


@router.post("/{user_id}/deactivate")
def deactivate_user(
    *,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_super_admin),
    user_id: UUID,
) -> Any:
    """Deactivate admin user account."""
    user = db.scalar(select(AdminUser).where(AdminUser.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")

    user.is_active = False
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="admin.user_deactivated",
        entity_type="admin_user",
        entity_id=str(user.id),
        commit=False,
    )
    db.commit()
    return {"detail": f"User {user.email} has been deactivated"}
