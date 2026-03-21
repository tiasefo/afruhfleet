from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


class BootstrapAdminRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12)
    full_name: str = Field(min_length=2, max_length=255)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=2, max_length=255)


class LoginRequest(BaseModel):
    username: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'


class UserResponse(BaseModel):
    """User response schema for API responses"""
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True
    is_tenant_admin: bool = False
    is_superuser: bool = False
    tenant_id: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None
    social_accounts: Optional[dict] = None
    
    class Config:
        from_attributes = True
