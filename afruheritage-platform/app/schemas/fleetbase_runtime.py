from __future__ import annotations
from app.core.config import settings

from pydantic import BaseModel, Field


class RunnerCreateRequest(BaseModel):
    name: str
    hostname: str
    ssh_port: int = 22
    ssh_user: str = "afruheritage"
    root_runtime_path: str = "/srv/afruheritage/tenants"
    max_tenants: int = 50
    supports_reference_install: bool = True


class RuntimeDeployRequest(BaseModel):
    tenant_id: str
    tenant_slug: str = Field(..., min_length=2, max_length=120)
    runner_id: str | None = None
    is_reference_install: bool = False


class RuntimeRetryRequest(BaseModel):
    runtime_id: str


class RuntimeSuspendRequest(BaseModel):
    runtime_id: str
    reason: str | None = None


class RuntimeResponse(BaseModel):
    id: str
    tenant_id: str
    tenant_slug: str
    runner_id: str | None = None
    status: str
    install_directory: str
    runtime_url: str | None = None
    console_url: str | None = None
    api_url: str | None = None
    fleetbase_version: str | None = None
    last_error: str | None = None
    is_reference_install: bool


class RuntimeEventResponse(BaseModel):
    id: str
    runtime_id: str
    event_type: str
    message: str
    payload_json: str | None = None


class RunnerResponse(BaseModel):
    id: str
    name: str
    hostname: str
    ssh_port: int
    ssh_user: str
    root_runtime_path: str
    status: str
    max_tenants: int
    current_tenants: int
    supports_reference_install: bool
