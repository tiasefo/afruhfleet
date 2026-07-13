from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import require_superuser
from app.db.session import get_db
from app.models.platform_config import PlatformSettings, PlanTierConfig
from app.models.user import User
from app.services.platform_config_service import ensure_platform_settings, get_plan_tier_configs, get_plan_tier_config

router = APIRouter(prefix="/sentinel", tags=["Sentinel"])


class PlatformSettingsResponse(BaseModel):
    default_trial_days: int


class PlatformSettingsUpdate(BaseModel):
    default_trial_days: int


class PlanTierConfigResponse(BaseModel):
    tier_code: str
    display_name: str
    price_monthly: int
    max_group_members: int
    features: list[str]
    is_active: bool


class PlanTierConfigUpdate(BaseModel):
    display_name: str | None = None
    price_monthly: int | None = None
    max_group_members: int | None = None
    features: list[str] | None = None
    is_active: bool | None = None


@router.get("/settings/platform", response_model=PlatformSettingsResponse)
def get_platform_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    settings = ensure_platform_settings(db)
    return PlatformSettingsResponse(default_trial_days=settings.default_trial_days)


@router.patch("/settings/platform", response_model=PlatformSettingsResponse)
def update_platform_settings(
    request: PlatformSettingsUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    settings = ensure_platform_settings(db)
    settings.default_trial_days = request.default_trial_days
    settings.updated_by = current_user.id
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return PlatformSettingsResponse(default_trial_days=settings.default_trial_days)


@router.get("/settings/plan-tiers", response_model=list[PlanTierConfigResponse])
def list_plan_tiers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    tiers = get_plan_tier_configs(db)
    result = []
    for t in tiers:
        try:
            features = json.loads(t.features_json)
        except (json.JSONDecodeError, TypeError):
            features = []
        result.append(PlanTierConfigResponse(
            tier_code=t.tier_code,
            display_name=t.display_name,
            price_monthly=t.price_monthly,
            max_group_members=t.max_group_members,
            features=features,
            is_active=t.is_active,
        ))
    return result


@router.patch("/settings/plan-tiers/{tier_code}", response_model=PlanTierConfigResponse)
def update_plan_tier(
    tier_code: str,
    request: PlanTierConfigUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    tier = get_plan_tier_config(db, tier_code)
    if not tier:
        raise HTTPException(status_code=404, detail=f"Plan tier '{tier_code}' not found")
    
    if request.display_name is not None:
        tier.display_name = request.display_name
    if request.price_monthly is not None:
        tier.price_monthly = request.price_monthly
    if request.max_group_members is not None:
        tier.max_group_members = request.max_group_members
    if request.features is not None:
        tier.features_json = json.dumps(request.features)
    if request.is_active is not None:
        tier.is_active = request.is_active
    
    db.add(tier)
    db.commit()
    db.refresh(tier)
    
    try:
        features = json.loads(tier.features_json)
    except (json.JSONDecodeError, TypeError):
        features = []
    
    return PlanTierConfigResponse(
        tier_code=tier.tier_code,
        display_name=tier.display_name,
        price_monthly=tier.price_monthly,
        max_group_members=tier.max_group_members,
        features=features,
        is_active=tier.is_active,
    )


# ---------------------------------------------------------------------------
# Tenant Provisioning endpoints
# ---------------------------------------------------------------------------

from app.models.tenant import Tenant, LaunchStatus
from app.models.platform_config import ProvisioningAlert, PlatformAlertSettings
from app.services.tenant_lifecycle import (
    advance_tenant_lifecycle,
    resolve_provisioning_alert,
    ensure_alert_settings,
)


class ProvisioningAlertResponse(BaseModel):
    id: str
    tenant_id: str
    tenant_name: str
    failure_reason: str
    stage: str
    resolved: bool
    resolved_at: str | None
    created_at: str


class TenantProvisioningStatusResponse(BaseModel):
    id: str
    company_name: str
    slug: str
    launch_status: str
    fleetbase_org_id: str | None
    subdomain: str | None


class RetryProvisioningResponse(BaseModel):
    advanced: bool
    actions: list[str]
    error: str | None
    fleetbase_org_id: str | None


class AlertSettingsResponse(BaseModel):
    provisioning_failure_emails: str


class AlertSettingsUpdate(BaseModel):
    provisioning_failure_emails: str


@router.get("/provisioning/alerts", response_model=list[ProvisioningAlertResponse])
def list_provisioning_alerts(
    resolved: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    query = db.query(ProvisioningAlert).filter(ProvisioningAlert.resolved == resolved)
    rows = query.order_by(ProvisioningAlert.created_at.desc()).all()
    result = []
    for a in rows:
        tenant = db.query(Tenant).filter(Tenant.id == a.tenant_id).first()
        result.append(ProvisioningAlertResponse(
            id=str(a.id),
            tenant_id=str(a.tenant_id),
            tenant_name=tenant.company_name if tenant else "Unknown",
            failure_reason=a.failure_reason,
            stage=a.stage,
            resolved=a.resolved,
            resolved_at=str(a.resolved_at) if a.resolved_at else None,
            created_at=str(a.created_at),
        ))
    return result


@router.get("/provisioning/tenants", response_model=list[TenantProvisioningStatusResponse])
def list_tenant_provisioning_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    tenants = db.query(Tenant).order_by(Tenant.created_at.desc()).all()
    return [
        TenantProvisioningStatusResponse(
            id=str(t.id),
            company_name=t.company_name,
            slug=t.slug,
            launch_status=t.launch_status.value if hasattr(t.launch_status, 'value') else str(t.launch_status),
            fleetbase_org_id=t.fleetbase_org_id,
            subdomain=t.subdomain,
        )
        for t in tenants
    ]


@router.post("/provisioning/retry/{tenant_id}", response_model=RetryProvisioningResponse)
def retry_provisioning(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    result = advance_tenant_lifecycle(db, tenant_id)
    return RetryProvisioningResponse(
        advanced=result.get("advanced", False),
        actions=result.get("actions", []),
        error=result.get("error"),
        fleetbase_org_id=result.get("fleetbase_org_id"),
    )


@router.post("/provisioning/alerts/{alert_id}/resolve")
def resolve_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    success = resolve_provisioning_alert(db, alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"resolved": True}


@router.get("/settings/alerts", response_model=AlertSettingsResponse)
def get_alert_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    row = ensure_alert_settings(db)
    return AlertSettingsResponse(provisioning_failure_emails=row.provisioning_failure_emails)


@router.patch("/settings/alerts", response_model=AlertSettingsResponse)
def update_alert_settings(
    request: AlertSettingsUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    row = ensure_alert_settings(db)
    row.provisioning_failure_emails = request.provisioning_failure_emails
    db.add(row)
    db.commit()
    db.refresh(row)
    return AlertSettingsResponse(provisioning_failure_emails=row.provisioning_failure_emails)
