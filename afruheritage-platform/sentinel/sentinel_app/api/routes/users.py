from __future__ import annotations

from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from sentinel_app.api.deps import get_current_admin, get_db
from sentinel_app.core.security import get_password_hash
from app.models.user import User
from app.models.rbac import Role, UserRole, UserActivityLog, Permission, RolePermission
from app.schemas.admin import UserResponse, UserCreate, UserUpdate, UserListResponse, RoleResponse, PermissionResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=UserListResponse)
def list_users(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: str | None = Query(None),
    role: str | None = Query(None),
    is_active: bool | None = Query(None),
    tenant_id: UUID | None = Query(None),
) -> Any:
    """
    Get all users with filtering and pagination.
    Admin can see all users across the platform.
    """
    query = db.query(User)
    
    # Apply filters
    if search:
        query = query.filter(
            (User.email.ilike(f"%{search}%")) |
            (User.full_name.ilike(f"%{search}%"))
        )
    
    if role:
        query = query.filter(User.role == role)
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    if tenant_id:
        query = query.filter(User.tenant_id == tenant_id)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    
    return UserListResponse(
        items=[UserResponse.from_orm(user) for user in users],
        total=total,
        skip=skip,
        limit=limit
    )


@router.post("/", response_model=UserResponse)
def create_user(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    user_in: UserCreate,
) -> Any:
    """
    Create new user.
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )
    
    # Create user
    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        tenant_id=user_in.tenant_id,
        is_tenant_admin=user_in.is_tenant_admin,
        is_superuser=user_in.is_superuser,
        is_active=user_in.is_active,
        onboarding_complete=user_in.onboarding_complete,
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Log activity
    activity = UserActivityLog(
        user_id=current_admin.id,
        action="create_user",
        resource_type="user",
        resource_id=str(user.id),
        ip_address="admin",  # TODO: Get real IP
        user_agent="admin_console"
    )
    db.add(activity)
    db.commit()
    
    return UserResponse.from_orm(user)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    user_id: UUID,
) -> Any:
    """
    Get user by ID.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse.from_orm(user)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    user_id: UUID,
    user_in: UserUpdate,
) -> Any:
    """
    Update user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields
    update_data = user_in.dict(exclude_unset=True)
    
    # Handle password update
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data["password"])
        del update_data["password"]
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    # Log activity
    activity = UserActivityLog(
        user_id=current_admin.id,
        action="update_user",
        resource_type="user",
        resource_id=str(user.id),
        ip_address="admin",
        user_agent="admin_console"
    )
    db.add(activity)
    db.commit()
    
    return UserResponse.from_orm(user)


@router.delete("/{user_id}")
def delete_user(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    user_id: UUID,
) -> Any:
    """
    Delete user (hard delete from database).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-deletion
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Store user info for logging
    user_email = user.email
    
    # Delete user (hard delete)
    db.delete(user)
    db.commit()
    
    # Log activity
    activity = UserActivityLog(
        user_id=current_admin.id,
        action="delete_user",
        resource_type="user",
        resource_id=str(user_id),
        ip_address="admin",
        user_agent="admin_console"
    )
    db.add(activity)
    db.commit()
    
    return {"detail": f"User {user_email} has been permanently deleted"}


@router.post("/{user_id}/activate")
def activate_user(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    user_id: UUID,
) -> Any:
    """
    Activate user account.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = True
    db.commit()
    
    # Log activity
    activity = UserActivityLog(
        user_id=current_admin.id,
        action="activate_user",
        resource_type="user",
        resource_id=str(user.id),
        ip_address="admin",
        user_agent="admin_console"
    )
    db.add(activity)
    db.commit()
    
    return {"detail": f"User {user.email} has been activated"}


@router.post("/{user_id}/deactivate")
def deactivate_user(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    user_id: UUID,
) -> Any:
    """
    Deactivate user account.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-deactivation
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    
    user.is_active = False
    db.commit()
    
    # Log activity
    activity = UserActivityLog(
        user_id=current_admin.id,
        action="deactivate_user",
        resource_type="user",
        resource_id=str(user.id),
        ip_address="admin",
        user_agent="admin_console"
    )
    db.add(activity)
    db.commit()
    
    return {"detail": f"User {user.email} has been deactivated"}


@router.get("/{user_id}/activity")
def get_user_activity(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> Any:
    """
    Get user activity logs.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    activities = db.query(UserActivityLog).filter(
        UserActivityLog.user_id == user_id
    ).order_by(UserActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "items": activities,
        "total": db.query(UserActivityLog).filter(UserActivityLog.user_id == user_id).count()
    }


# RBAC Management Routes
@router.get("/roles/", response_model=List[RoleResponse])
def list_roles(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
) -> Any:
    """
    List all available roles.
    """
    roles = db.query(Role).filter(Role.is_active == True).all()
    return [RoleResponse.from_orm(role) for role in roles]


@router.get("/permissions/", response_model=List[PermissionResponse])
def list_permissions(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    resource_type: str | None = Query(None),
) -> Any:
    """
    List all available permissions.
    """
    query = db.query(Permission)
    if resource_type:
        query = query.filter(Permission.resource_type == resource_type)
    
    permissions = query.all()
    return [PermissionResponse.from_orm(perm) for perm in permissions]


@router.post("/{user_id}/roles/{role_id}")
def assign_role(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    user_id: UUID,
    role_id: UUID,
) -> Any:
    """
    Assign role to user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Check if role already assigned
    existing = db.query(UserRole).filter(
        UserRole.user_id == user_id,
        UserRole.role_id == role_id,
        UserRole.is_active == True
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Role already assigned to user")
    
    # Assign role
    user_role = UserRole(
        user_id=user_id,
        role_id=role_id,
        assigned_by=current_admin.id
    )
    db.add(user_role)
    db.commit()
    
    # Log activity
    activity = UserActivityLog(
        user_id=current_admin.id,
        action="assign_role",
        resource_type="user",
        resource_id=str(user_id),
        ip_address="admin",
        user_agent="admin_console"
    )
    db.add(activity)
    db.commit()
    
    return {"detail": f"Role {role.display_name} assigned to user {user.email}"}


@router.delete("/{user_id}/roles/{role_id}")
def remove_role(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    user_id: UUID,
    role_id: UUID,
) -> Any:
    """
    Remove role from user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Find and deactivate role assignment
    user_role = db.query(UserRole).filter(
        UserRole.user_id == user_id,
        UserRole.role_id == role_id,
        UserRole.is_active == True
    ).first()
    
    if not user_role:
        raise HTTPException(status_code=404, detail="Role not assigned to user")
    
    user_role.is_active = False
    db.commit()
    
    # Log activity
    activity = UserActivityLog(
        user_id=current_admin.id,
        action="remove_role",
        resource_type="user",
        resource_id=str(user_id),
        ip_address="admin",
        user_agent="admin_console"
    )
    db.add(activity)
    db.commit()
    
    return {"detail": f"Role {role.display_name} removed from user {user.email}"}
