from __future__ import annotations

import uuid
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_serializer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_superuser, require_tenant_admin
from app.db.session import get_db
from app.models.rbac import Role, Permission, RolePermission, UserRole, PermissionType, ResourceType
from app.models.user import User

router = APIRouter(prefix='/rbac', tags=['RBAC'])


# Schemas
class PermissionCreate(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    resource_type: str
    permission_type: str


class PermissionResponse(BaseModel):
    id: str
    name: str
    display_name: str
    description: Optional[str]
    resource_type: str
    permission_type: str
    created_at: str


class RoleCreate(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    is_system_role: bool = False
    is_public: bool = False


class RoleResponse(BaseModel):
    id: str
    name: str
    display_name: str
    description: Optional[str]
    is_system_role: bool
    is_public: bool
    is_active: bool
    created_at: str
    updated_at: str


class RolePermissionCreate(BaseModel):
    role_id: str
    permission_id: str


class UserRoleCreate(BaseModel):
    user_id: str
    role_id: str
    expires_at: Optional[str] = None


class UserRoleResponse(BaseModel):
    id: str
    user_id: str
    role_id: str
    assigned_at: str
    expires_at: Optional[str]
    is_active: bool

    @field_serializer('id')
    def serialize_id(self, value: uuid.UUID) -> str:
        return str(value)

    @field_serializer('user_id')
    def serialize_user_id(self, value: uuid.UUID) -> str:
        return str(value)

    @field_serializer('role_id')
    def serialize_role_id(self, value: uuid.UUID) -> str:
        return str(value)

    @field_serializer('assigned_at')
    def serialize_assigned_at(self, value: datetime) -> str:
        return value.isoformat() if value else None

    @field_serializer('expires_at')
    def serialize_expires_at(self, value: Optional[datetime]) -> Optional[str]:
        return value.isoformat() if value else None


# Seed default permissions
DEFAULT_PERMISSIONS = [
    # Tenant Management
    ("tenants.read", "View Tenants", "View tenant information", ResourceType.TENANTS, PermissionType.READ),
    ("tenants.write", "Edit Tenants", "Edit tenant settings", ResourceType.TENANTS, PermissionType.WRITE),
    ("tenants.admin", "Manage Tenants", "Full tenant management", ResourceType.TENANTS, PermissionType.ADMIN),
    
    # User Management
    ("users.read", "View Users", "View user information", ResourceType.USERS, PermissionType.READ),
    ("users.write", "Edit Users", "Edit user information", ResourceType.USERS, PermissionType.WRITE),
    ("users.admin", "Manage Users", "Full user management", ResourceType.USERS, PermissionType.ADMIN),
    
    # Billing
    ("billing.read", "View Billing", "View billing information", ResourceType.BILLING, PermissionType.READ),
    ("billing.write", "Edit Billing", "Edit billing information", ResourceType.BILLING, PermissionType.WRITE),
    ("billing.admin", "Manage Billing", "Full billing management", ResourceType.BILLING, PermissionType.ADMIN),
    
    # Shipments/Tracking
    ("tracking.read", "View Tracking", "View shipment tracking", ResourceType.TRACKING, PermissionType.READ),
    ("tracking.write", "Edit Tracking", "Edit shipment tracking", ResourceType.TRACKING, PermissionType.WRITE),
    
    # Support Tickets
    ("tickets.read", "View Tickets", "View support tickets", ResourceType.TICKETS, PermissionType.READ),
    ("tickets.write", "Edit Tickets", "Edit support tickets", ResourceType.TICKETS, PermissionType.WRITE),
    ("tickets.admin", "Manage Tickets", "Full ticket management", ResourceType.TICKETS, PermissionType.ADMIN),
    
    # Analytics
    ("analytics.read", "View Analytics", "View analytics data", ResourceType.ANALYTICS, PermissionType.READ),
    
    # Settings
    ("settings.read", "View Settings", "View settings", ResourceType.SETTINGS, PermissionType.READ),
    ("settings.write", "Edit Settings", "Edit settings", ResourceType.SETTINGS, PermissionType.WRITE),
    ("settings.admin", "Manage Settings", "Full settings management", ResourceType.SETTINGS, PermissionType.ADMIN),
    
    # CRM
    ("crm.read", "View CRM", "View CRM data", ResourceType.CRM, PermissionType.READ),
    ("crm.write", "Edit CRM", "Edit CRM data", ResourceType.CRM, PermissionType.WRITE),
    ("crm.admin", "Manage CRM", "Full CRM management", ResourceType.CRM, PermissionType.ADMIN),
]


def seed_default_permissions(db: Session) -> None:
    """Seed default permissions if they don't exist."""
    for name, display_name, description, resource_type, permission_type in DEFAULT_PERMISSIONS:
        existing = db.scalar(select(Permission).where(Permission.name == name))
        if not existing:
            permission = Permission(
                name=name,
                display_name=display_name,
                description=description,
                resource_type=resource_type,
                permission_type=permission_type,
            )
            db.add(permission)
    db.commit()


def seed_default_roles(db: Session) -> None:
    """Seed default roles if they don't exist."""
    default_roles = [
        ("superuser", "Superuser", "Full system access", True),
        ("tenant_admin", "Tenant Admin", "Full tenant access", True),
        ("staff", "Staff", "Limited tenant access", True),
        ("customer", "Customer", "Read-only customer access", True),
        ("vendor", "Vendor", "Marketplace vendor access", True),
        ("driver", "Driver", "Fleet driver access", True),
    ]
    
    for name, display_name, description, is_system_role in default_roles:
        existing = db.scalar(select(Role).where(Role.name == name))
        if not existing:
            role = Role(
                name=name,
                display_name=display_name,
                description=description,
                is_system_role=is_system_role,
            )
            db.add(role)
    db.commit()


@router.get('/permissions', response_model=list[PermissionResponse])
def list_permissions(db: Session = Depends(get_db), _: User = Depends(require_superuser)):
    """List all permissions (admin only)."""
    seed_default_permissions(db)
    permissions = db.scalars(select(Permission).order_by(Permission.resource_type, Permission.name)).all()
    return [
        PermissionResponse(
            id=str(p.id),
            name=p.name,
            display_name=p.display_name,
            description=p.description,
            resource_type=p.resource_type,
            permission_type=p.permission_type,
            created_at=p.created_at.isoformat() if p.created_at else None,
        )
        for p in permissions
    ]


@router.post('/permissions', response_model=PermissionResponse)
def create_permission(
    permission: PermissionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Create a new permission (admin only)."""
    existing = db.scalar(select(Permission).where(Permission.name == permission.name))
    if existing:
        raise HTTPException(status_code=400, detail='Permission already exists')

    new_permission = Permission(
        name=permission.name,
        display_name=permission.display_name,
        description=permission.description,
        resource_type=permission.resource_type,
        permission_type=permission.permission_type,
    )
    db.add(new_permission)
    db.commit()
    db.refresh(new_permission)
    return PermissionResponse(
        id=str(new_permission.id),
        name=new_permission.name,
        display_name=new_permission.display_name,
        description=new_permission.description,
        resource_type=new_permission.resource_type,
        permission_type=new_permission.permission_type,
        created_at=new_permission.created_at.isoformat() if new_permission.created_at else None,
    )


@router.get('/roles', response_model=list[RoleResponse])
def list_roles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List roles - superusers see all, tenant admins see only public roles."""
    seed_default_roles(db)
    
    if current_user.is_superuser:
        # Superusers see all roles
        roles = db.scalars(select(Role).order_by(Role.name)).all()
    elif current_user.is_tenant_admin:
        # Tenant admins only see public roles
        roles = db.scalars(select(Role).where(Role.is_public.is_(True)).order_by(Role.name)).all()
    else:
        # Regular users see no roles
        raise HTTPException(status_code=403, detail='Admin access required')
    
    return [
        RoleResponse(
            id=str(r.id),
            name=r.name,
            display_name=r.display_name,
            description=r.description,
            is_system_role=r.is_system_role,
            is_public=r.is_public,
            is_active=r.is_active,
            created_at=r.created_at.isoformat() if r.created_at else None,
            updated_at=r.updated_at.isoformat() if r.updated_at else None,
        )
        for r in roles
    ]


@router.post('/roles', response_model=RoleResponse)
def create_role(
    role: RoleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Create a new role (admin only)."""
    existing = db.scalar(select(Role).where(Role.name == role.name))
    if existing:
        raise HTTPException(status_code=400, detail='Role already exists')

    new_role = Role(
        name=role.name,
        display_name=role.display_name,
        description=role.description,
        is_system_role=role.is_system_role,
        is_public=role.is_public,
    )
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return RoleResponse(
        id=str(new_role.id),
        name=new_role.name,
        display_name=new_role.display_name,
        description=new_role.description,
        is_system_role=new_role.is_system_role,
        is_public=new_role.is_public,
        is_active=new_role.is_active,
        created_at=new_role.created_at.isoformat() if new_role.created_at else None,
        updated_at=new_role.updated_at.isoformat() if new_role.updated_at else None,
    )


@router.post('/roles/{role_id}/permissions')
def assign_permission_to_role(
    role_id: str,
    assignment: RolePermissionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Assign a permission to a role (admin only)."""
    role = db.get(Role, role_id)
    if not role:
        raise HTTPException(status_code=404, detail='Role not found')
    
    permission = db.get(Permission, assignment.permission_id)
    if not permission:
        raise HTTPException(status_code=404, detail='Permission not found')
    
    existing = db.scalar(
        select(RolePermission).where(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == assignment.permission_id,
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail='Permission already assigned to role')
    
    role_permission = RolePermission(role_id=role_id, permission_id=assignment.permission_id)
    db.add(role_permission)
    db.commit()
    
    return {"message": "Permission assigned to role successfully"}


@router.delete('/roles/{role_id}/permissions/{permission_id}')
def remove_permission_from_role(
    role_id: str,
    permission_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Remove a permission from a role (admin only)."""
    role_permission = db.scalar(
        select(RolePermission).where(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id,
        )
    )
    if not role_permission:
        raise HTTPException(status_code=404, detail='Role permission not found')
    
    db.delete(role_permission)
    db.commit()
    
    return {"message": "Permission removed from role successfully"}


@router.post('/users/{user_id}/roles')
def assign_role_to_user(
    user_id: str,
    assignment: UserRoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin),
):
    """Assign a role to a user (tenant admin or superuser only)."""
    # Tenant admins can only assign roles within their tenant
    if not current_user.is_superuser:
        target_user = db.get(User, user_id)
        if not target_user:
            raise HTTPException(status_code=404, detail='User not found')

        if target_user.tenant_id != current_user.tenant_id:
            raise HTTPException(status_code=403, detail='Cannot assign roles to users outside your tenant')

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    role = db.get(Role, assignment.role_id)
    if not role:
        raise HTTPException(status_code=404, detail='Role not found')

    existing = db.scalar(
        select(UserRole).where(
            UserRole.user_id == user_id,
            UserRole.role_id == assignment.role_id,
            UserRole.is_active.is_(True),
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail='User already has this role')

    user_role = UserRole(
        user_id=user_id,
        role_id=assignment.role_id,
        assigned_by=current_user.id,
        expires_at=assignment.expires_at,
    )
    db.add(user_role)
    db.commit()

    return {"message": "Role assigned to user successfully"}


@router.delete('/users/{user_id}/roles/{role_id}')
def remove_role_from_user(
    user_id: str,
    role_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin),
):
    """Remove a role from a user (tenant admin or superuser only)."""
    # Tenant admins can only remove roles within their tenant
    if not current_user.is_superuser:
        target_user = db.get(User, user_id)
        if not target_user:
            raise HTTPException(status_code=404, detail='User not found')

        if target_user.tenant_id != current_user.tenant_id:
            raise HTTPException(status_code=403, detail='Cannot remove roles from users outside your tenant')

    user_role = db.scalar(
        select(UserRole).where(
            UserRole.user_id == user_id,
            UserRole.role_id == role_id,
            UserRole.is_active.is_(True),
        )
    )
    if not user_role:
        raise HTTPException(status_code=404, detail='User role not found')

    user_role.is_active = False
    db.commit()

    return {"message": "Role removed from user successfully"}


@router.get('/users/{user_id}/roles', response_model=list[UserRoleResponse])
def list_user_roles(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """List all roles for a user."""
    user_roles = db.scalars(
        select(UserRole).where(
            UserRole.user_id == user_id,
            UserRole.is_active.is_(True),
        )
    ).all()
    return [
        UserRoleResponse(
            id=str(ur.id),
            user_id=str(ur.user_id),
            role_id=str(ur.role_id),
            assigned_at=ur.assigned_at.isoformat() if ur.assigned_at else None,
            expires_at=ur.expires_at.isoformat() if ur.expires_at else None,
            is_active=ur.is_active,
        )
        for ur in user_roles
    ]


@router.get('/roles/{role_id}/permissions', response_model=list[PermissionResponse])
def list_role_permissions(
    role_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """List all permissions for a role."""
    role_permissions = db.scalars(
        select(RolePermission).where(RolePermission.role_id == role_id)
    ).all()

    permission_ids = [rp.permission_id for rp in role_permissions]
    if not permission_ids:
        return []

    permissions = db.scalars(
        select(Permission).where(Permission.id.in_(permission_ids))
    ).all()
    return [
        PermissionResponse(
            id=str(p.id),
            name=p.name,
            display_name=p.display_name,
            description=p.description,
            resource_type=p.resource_type,
            permission_type=p.permission_type,
            created_at=p.created_at.isoformat() if p.created_at else None,
        )
        for p in permissions
    ]
