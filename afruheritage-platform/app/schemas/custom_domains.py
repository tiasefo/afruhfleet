from __future__ import annotations

from pydantic import BaseModel, Field


class DomainRequestCreate(BaseModel):
    tenant_id: str
    hostname: str = Field(..., min_length=3, max_length=255)
    domain_type: str = Field(..., pattern="^(customer_subdomain|apex|platform_subdomain)$")
    created_by: str | None = None


class DomainResponse(BaseModel):
    id: str
    tenant_id: str
    hostname: str
    domain_type: str
    status: str
    provider: str
    verification_method: str
    verification_name: str | None = None
    verification_value: str | None = None
    ssl_status: str | None = None
    fallback_hostname: str | None = None
    fallback_active: bool
    last_error: str | None = None


class DomainEventResponse(BaseModel):
    id: str
    domain_id: str
    event_type: str
    message: str
    payload_json: str | None = None


class DomainActivateRequest(BaseModel):
    tenant_id: str
    hostname: str


class DomainFailRequest(BaseModel):
    reason: str


class TenantDomainSettingsResponse(BaseModel):
    tenant_id: str
    platform_subdomain: str
    active_primary_hostname: str
    fallback_hostname: str
    fallback_always_active: bool
