import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.user import UserRole


class TeamInvitationCreateRequest(BaseModel):
    email: EmailStr
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    role: str = Field(min_length=2, max_length=80)

    @field_validator('role')
    @classmethod
    def role_is_permitted(cls, value: str) -> str:
        try:
            user_role = UserRole(value)
        except ValueError as exc:
            raise ValueError(f'Invalid role: {value}') from exc
        if user_role == UserRole.platform_admin:
            raise ValueError('Platform admin role cannot be assigned through team invitations')
        return value


class TeamInvitationAcceptRequest(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    password: Optional[str] = Field(default=None, min_length=8)


class TeamInvitationResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    email: str
    full_name: Optional[str]
    role: str
    token: str
    status: str
    expires_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TeamMemberResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str]
    role: str
    is_tenant_admin: bool
    is_active: bool
    created_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class TeamMemberTokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    tenant_id: str
    subdomain: Optional[str]
    portal_url: Optional[str]
    requires_subscription: bool = True
