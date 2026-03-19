from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class TenantCreate(BaseModel):
    company_name: str = Field(min_length=2, max_length=255)
    contact_email: EmailStr
    plan_code: str = Field(min_length=2, max_length=80)
    requested_domain: str = Field(min_length=3, max_length=255)
    domain_type: str
    verification_notes: str | None = None


class TenantResponse(BaseModel):
    id: str
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

    class Config:
        from_attributes = True


class ApprovalRequest(BaseModel):
    verification_notes: str | None = None


class LaunchRequest(BaseModel):
    runner_id: str | None = None


class JobResponse(BaseModel):
    id: str
    tenant_id: str
    status: str
    details: str | None
    task_id: str | None
    current_step: str | None
    retry_count: int
    started_at: datetime | None
    finished_at: datetime | None
    last_error: str | None
    log_excerpt: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
