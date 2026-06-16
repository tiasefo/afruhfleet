from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FeatureFlagResponse(BaseModel):
    id: str
    feature_code: str
    phase: str
    display_name: str
    description: str | None
    enabled_globally: bool
    requires_plan_upgrade: bool
    min_plan_code: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FeatureFlagUpdateRequest(BaseModel):
    enabled_globally: bool | None = None
    requires_plan_upgrade: bool | None = None
    min_plan_code: str | None = None
    description: str | None = None


class TenantFeatureAssignmentResponse(BaseModel):
    id: str
    tenant_id: str
    feature_code: str
    enabled: bool
    enabled_until: datetime | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TenantFeatureAssignmentCreateRequest(BaseModel):
    tenant_id: str = Field(..., min_length=1)
    feature_code: str = Field(..., min_length=1)
    enabled: bool = True
    enabled_until: datetime | None = None
    notes: str | None = None


class TenantFeatureAssignmentUpdateRequest(BaseModel):
    enabled: bool | None = None
    enabled_until: datetime | None = None
    notes: str | None = None


class ControlCenterSummary(BaseModel):
    total_features: int
    globally_enabled: int
    total_tenant_assignments: int
    active_tenant_assignments: int
    features_by_phase: dict[str, int]


class FeatureDefinition(BaseModel):
    code: str
    phase: str
    display_name: str
    description: str
    requires_plan_upgrade: bool
    min_plan_code: str | None
