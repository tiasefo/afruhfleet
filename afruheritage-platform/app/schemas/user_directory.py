from pydantic import BaseModel, EmailStr, Field


class TenantUserCreateRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    password: str | None = Field(default=None, min_length=8)
    send_invite_email: bool = False
    role: str = "customer"  # "customer" or "admin"
    tenant_id: str | None = None


class TenantUserStatusUpdateRequest(BaseModel):
    is_active: bool


class TenantUserRoleUpdateRequest(BaseModel):
    is_tenant_admin: bool


class TenantUserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    tenant_id: str | None = None
    is_tenant_admin: bool
    is_superuser: bool
    is_active: bool
    created_at: str


class TenantUserAuditResponse(BaseModel):
    id: str
    actor_email: str
    event_type: str
    entity_type: str
    entity_id: str
    details_json: str
    created_at: str


class TenantUserResetResponse(BaseModel):
    status: str
    message: str
