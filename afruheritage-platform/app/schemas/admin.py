from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str
    tenant_id: Optional[UUID] = None
    is_tenant_admin: bool = False
    is_superuser: bool = False
    is_active: bool = True
    onboarding_complete: bool = False


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    tenant_id: Optional[UUID] = None
    is_tenant_admin: Optional[bool] = None
    is_superuser: Optional[bool] = None
    is_active: Optional[bool] = None
    onboarding_complete: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8)


class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    must_reset_password: bool = False
    last_login: Optional[datetime] = None
    
    # RBAC fields
    roles: List[str] = []
    permissions: List[str] = []
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    items: List[UserResponse]
    total: int
    skip: int
    limit: int


class RoleBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    is_system_role: bool = False
    is_active: bool = True


class RoleCreate(RoleBase):
    permission_ids: List[UUID] = []


class RoleUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    permission_ids: Optional[List[UUID]] = None


class RoleResponse(RoleBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    permissions: List[str] = []
    
    class Config:
        from_attributes = True


class PermissionBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    resource_type: str
    permission_type: str


class PermissionResponse(PermissionBase):
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserActivityLogResponse(BaseModel):
    id: UUID
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    success: bool = True
    error_message: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# Real-time Dashboard Schemas
class DashboardStats(BaseModel):
    total_users: int
    active_users: int
    total_tenants: int
    active_tenants: int
    total_vendors: int
    pending_vendors: int
    total_revenue: float
    monthly_revenue: float
    total_shipments: int
    active_shipments: int


class SystemHealth(BaseModel):
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    database_status: str
    redis_status: str
    api_status: str
    uptime: str


class AlertItem(BaseModel):
    id: UUID
    type: str  # system, business, security
    severity: str  # low, medium, high, critical
    title: str
    message: str
    created_at: datetime
    is_read: bool = False


class DashboardResponse(BaseModel):
    stats: DashboardStats
    health: SystemHealth
    alerts: List[AlertItem]
    recent_activities: List[UserActivityLogResponse]


# Advanced Tenant Management Schemas
class TenantStats(BaseModel):
    total_users: int
    active_shipments: int
    monthly_revenue: float
    storage_used: float
    api_calls: int


class TenantResponse(BaseModel):
    id: UUID
    name: str
    subdomain: str
    status: str
    created_at: datetime
    plan_code: str
    stats: TenantStats
    
    class Config:
        from_attributes = True


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    plan_code: Optional[str] = None
    feature_flags: Optional[Dict[str, bool]] = None


# System Monitoring Schemas
class ServiceStatus(BaseModel):
    name: str
    status: str
    uptime: str
    cpu: float
    memory: float
    last_check: datetime


class LogEntry(BaseModel):
    timestamp: datetime
    level: str
    service: str
    message: str
    metadata: Dict[str, Any] = {}


class SystemMonitoringResponse(BaseModel):
    services: List[ServiceStatus]
    recent_logs: List[LogEntry]
    system_metrics: Dict[str, float]
    alerts: List[AlertItem]
