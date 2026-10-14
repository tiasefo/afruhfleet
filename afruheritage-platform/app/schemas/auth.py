from datetime import datetime
import uuid
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class BootstrapAdminRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12)
    full_name: str = Field(min_length=2, max_length=255)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=2, max_length=255)
    # I1: optional for individuals — a personal account must not require an
    # invented company name. Required when account_type == 'business'.
    company_name: str | None = Field(default=None, min_length=2, max_length=255)
    account_type: str = Field(default='business', pattern='^(individual|business)$')
    plan_code: str | None = Field(default=None, min_length=3, max_length=64)

    @model_validator(mode="after")
    def require_company_name_for_business(self) -> "RegisterRequest":
        if self.account_type == 'business' and not (self.company_name or '').strip():
            raise ValueError("company_name is required for business accounts")
        return self


class LoginRequest(BaseModel):
    email: EmailStr | None = None
    username: EmailStr | None = None
    password: str

    @model_validator(mode="after")
    def populate_email(self) -> "LoginRequest":
        if self.email is None and self.username is None:
            raise ValueError("Either email or username is required")
        if self.email is None:
            self.email = self.username
        if self.username is None:
            self.username = self.email
        return self


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    tenant_id: str | None = None
    subdomain: str | None = None
    portal_url: str | None = None
    requires_subscription: bool = False


class PasswordResetConfirmRequest(BaseModel):
    token: str = Field(min_length=16, max_length=255)
    new_password: str = Field(min_length=8)


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True
    is_tenant_admin: bool = False
    is_superuser: bool = False
    tenant_id: Optional[uuid.UUID] = None
    created_at: datetime
    last_login: Optional[datetime] = None
    social_accounts: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)
