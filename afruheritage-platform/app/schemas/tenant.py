from app.core.config import settings
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TenantCreate(BaseModel):
    company_name: str = Field(min_length=2, max_length=255)
    contact_email: EmailStr
    plan_code: str = Field(min_length=2, max_length=80)
    requested_domain: str = Field(min_length=3, max_length=255)
    domain_type: str
    verification_notes: str | None = None


class TenantResponse(BaseModel):
    id: UUID
    company_name: str
    slug: str
    contact_email: EmailStr
    plan_code: str
    requested_domain: str
    domain_type: str
    launch_status: str
    live_console_url: str | None
    live_api_url: str | None
    fleetbase_install_path: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TenantCreationRequest(BaseModel):
    """Request model for creating a new tenant"""
    company_name: str = Field(min_length=2, max_length=255, description="Company name")
    contact_email: EmailStr = Field(description="Contact email address")
    contact_name: str = Field(min_length=2, max_length=255, description="Contact person name")
    business_type: str = Field(description="Type of business (freight_forwarder, logistics_provider, etc.)")
    country: str = Field(min_length=2, max_length=100, description="Country of operation")
    city: str = Field(min_length=2, max_length=100, description="City of operation")
    address: str = Field(min_length=10, max_length=500, description="Business address")
    phone: str = Field(min_length=10, max_length=20, description="Phone number")
    website: str | None = Field(None, description="Company website")
    plan: str = Field(default="free_trial", description="Subscription plan")


class TenantCreationResponse(BaseModel):
    """Response model for tenant creation"""
    tenant_id: str
    subdomain: str
    company_name: str
    portal_url: str
    status: str
    message: str


class TenantStatusResponse(BaseModel):
    """Response model for tenant status"""
    tenant_id: str
    subdomain: str
    company_name: str
    status: str
    launch_status: str
    plan: str
    portal_url: str
    console_url: str | None
    api_url: str | None
    custom_domain: str | None
    created_at: datetime
    updated_at: datetime


class ApprovalRequest(BaseModel):
    verification_notes: str | None = None


class LaunchRequest(BaseModel):
    runner_id: str | None = None


class TenantRuntimeAuthUpdate(BaseModel):
    live_api_token: str | None = None
    live_api_auth_scheme: str | None = Field(default='bearer', min_length=3, max_length=32)
    clear_live_api_token: bool = False


class JobResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    status: str
    details: str | None
    task_id: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
