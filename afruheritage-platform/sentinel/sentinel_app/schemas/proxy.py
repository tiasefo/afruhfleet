from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ProxyTenantCreate(BaseModel):
    company_name: str = Field(min_length=2, max_length=255)
    contact_email: str
    plan_code: str
    requested_domain: str
    domain_type: str
    verification_notes: str | None = None


class ProxyTenantApprove(BaseModel):
    verification_notes: str | None = None


class ProxyTenantLaunch(BaseModel):
    runner_id: str | None = None


class ProxyRunnerCreate(BaseModel):
    name: str
    host: str
    ssh_port: int = 22
    ssh_user: str
    fleetbase_root: str
    reserved_for_single_tenant: bool = True


class ProxyBillingAssignPlan(BaseModel):
    tenant_id: str
    plan_code: str
    currency: str = "GHS"


class ProxyBillingAdjustCredits(BaseModel):
    tenant_id: str
    credits_delta: int
    memo: str | None = None


class ProxyBillingSetReadOnly(BaseModel):
    tenant_id: str
    reason: str


class ProxyVendorReview(BaseModel):
    action: str  # approve | reject
    rejection_reason: str | None = None


class ProxyDomainActivate(BaseModel):
    tenant_id: str
    hostname: str


class ProxyRuntimeDeploy(BaseModel):
    tenant_id: str
    tenant_slug: str
    runner_id: str | None = None
    is_reference_install: bool = False
