from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from sentinel_app.api.deps import get_current_admin, require_super_admin
from sentinel_app.db.session import get_db
from sentinel_app.models.admin_user import AdminUser
from sentinel_app.models.feature_control import (
    FeatureCode,
    FeaturePhase,
    GlobalFeatureFlag,
    TenantFeatureAssignment,
)
from sentinel_app.schemas.feature_control import (
    ControlCenterSummary,
    FeatureDefinition,
    FeatureFlagResponse,
    FeatureFlagUpdateRequest,
    TenantFeatureAssignmentCreateRequest,
    TenantFeatureAssignmentResponse,
    TenantFeatureAssignmentUpdateRequest,
)

logger = logging.getLogger("sentinel.control_center")
router = APIRouter(prefix="/control-center", tags=["Control Center"])

DEFAULT_FEATURES: list[FeatureDefinition] = [
    # Phase 1
    FeatureDefinition(
        code=FeatureCode.POD.value,
        phase=FeaturePhase.PHASE_1.value,
        display_name="Proof of Delivery (POD)",
        description="Capture delivery photos, digital signatures, and barcode scans at drop-off. Provides legally verifiable proof of delivery.",
        requires_plan_upgrade=False,
        min_plan_code=None,
    ),
    FeatureDefinition(
        code=FeatureCode.CONTACTS_PLACES.value,
        phase=FeaturePhase.PHASE_1.value,
        display_name="Contacts & Places",
        description="Tenant-managed address book of frequently used senders and receivers. Auto-fills shipment forms and prevents address typos.",
        requires_plan_upgrade=False,
        min_plan_code=None,
    ),
    FeatureDefinition(
        code=FeatureCode.SERVICE_RATES.value,
        phase=FeaturePhase.PHASE_1.value,
        display_name="Service Rates",
        description="Zone-based or distance-based pricing rules. Auto-calculates shipment costs based on origin, destination, and weight.",
        requires_plan_upgrade=True,
        min_plan_code="pro",
    ),
    # Phase 2
    FeatureDefinition(
        code=FeatureCode.DISPATCH_ENGINE.value,
        phase=FeaturePhase.PHASE_2.value,
        display_name="Dispatch Engine",
        description="Assign pending shipments to available drivers via drag-and-drop board or auto-dispatch algorithm. Real-time driver status map.",
        requires_plan_upgrade=True,
        min_plan_code="pro",
    ),
    FeatureDefinition(
        code=FeatureCode.ROUTE_PLANNING.value,
        phase=FeaturePhase.PHASE_2.value,
        display_name="Route Planning",
        description="Create multi-stop planned routes for drivers. Click-to-add waypoints on a map with estimated total time and distance.",
        requires_plan_upgrade=True,
        min_plan_code="pro",
    ),
    FeatureDefinition(
        code=FeatureCode.WEBHOOKS.value,
        phase=FeaturePhase.PHASE_2.value,
        display_name="Webhooks",
        description="HTTP POST callbacks to tenant-configured URLs on shipment events. Enables ERP, Shopify, and custom system integrations.",
        requires_plan_upgrade=True,
        min_plan_code="business",
    ),
    FeatureDefinition(
        code=FeatureCode.NOTIFICATIONS.value,
        phase=FeaturePhase.PHASE_2.value,
        display_name="Notifications (Push / SMS / In-app)",
        description="Automated alerts to drivers and customers on status changes. Reduces 'where is my package?' support tickets.",
        requires_plan_upgrade=True,
        min_plan_code="pro",
    ),
    # Phase 3
    FeatureDefinition(
        code=FeatureCode.ROUTE_OPTIMIZATION.value,
        phase=FeaturePhase.PHASE_3.value,
        display_name="Route Optimization (Valhalla)",
        description="AI-powered reordering of route stops to minimize driving time and fuel cost. Can save 20-30% on fleet fuel expenses.",
        requires_plan_upgrade=True,
        min_plan_code="business",
    ),
    FeatureDefinition(
        code=FeatureCode.VRP_SOLVER.value,
        phase=FeaturePhase.PHASE_3.value,
        display_name="VRP Solver (Vroom)",
        description="Vehicle Routing Problem solver — optimally assigns hundreds of deliveries to multiple drivers with capacity and time-window constraints.",
        requires_plan_upgrade=True,
        min_plan_code="business",
    ),
    FeatureDefinition(
        code=FeatureCode.DRIVER_MOBILE_APP.value,
        phase=FeaturePhase.PHASE_3.value,
        display_name="Driver Mobile App",
        description="Dedicated iOS/Android app for drivers. View assigned jobs, capture POD, navigate turn-by-turn, and chat with dispatch.",
        requires_plan_upgrade=True,
        min_plan_code="pro",
    ),
    # Shared Services (Tenant-level, always inherited)
    FeatureDefinition(
        code=FeatureCode.SHIPMENTS.value,
        phase="shared",
        display_name="Shipments",
        description="Core shipment creation, assignment, tracking, and lifecycle management. Every tenant gets this automatically.",
        requires_plan_upgrade=False,
        min_plan_code=None,
    ),
    FeatureDefinition(
        code=FeatureCode.GROUP_MEMBERS.value,
        phase="shared",
        display_name="Group Members",
        description="Contact groups and member management. Organize recipients into groups for bulk operations and targeted communications.",
        requires_plan_upgrade=False,
        min_plan_code=None,
    ),
    FeatureDefinition(
        code=FeatureCode.CSV_IMPORT.value,
        phase="shared",
        display_name="CSV Import",
        description="Bulk shipment creation and update via CSV upload. Auto-resolves group_member_name to existing contacts.",
        requires_plan_upgrade=False,
        min_plan_code=None,
    ),
    FeatureDefinition(
        code=FeatureCode.PUBLIC_TRACKING.value,
        phase="shared",
        display_name="Public Tracking",
        description="Unauthenticated shipment tracking page for customers. Works in Chinese and English. No login required.",
        requires_plan_upgrade=False,
        min_plan_code=None,
    ),
    FeatureDefinition(
        code=FeatureCode.MAPS.value,
        phase="shared",
        display_name="Maps",
        description="Fleet map visualization, route display, and driver location tracking. Leverages Fleetbase map engine under the hood.",
        requires_plan_upgrade=False,
        min_plan_code=None,
    ),
    FeatureDefinition(
        code=FeatureCode.STOREFRONT.value,
        phase="shared",
        display_name="Storefront",
        description="Public product catalog and ordering page per tenant. Customers browse products, place orders, and track deliveries.",
        requires_plan_upgrade=False,
        min_plan_code=None,
    ),
]


def _ensure_features(db: Session) -> None:
    """Seed default feature definitions if they don't exist."""
    existing_codes = {r[0] for r in db.query(GlobalFeatureFlag.feature_code).all()}
    for feat in DEFAULT_FEATURES:
        if feat.code not in existing_codes:
            db.add(
                GlobalFeatureFlag(
                    feature_code=feat.code,
                    phase=feat.phase,
                    display_name=feat.display_name,
                    description=feat.description,
                    enabled_globally=False,
                    requires_plan_upgrade=feat.requires_plan_upgrade,
                    min_plan_code=feat.min_plan_code,
                )
            )
    db.commit()


@router.get("/summary", response_model=ControlCenterSummary)
def get_summary(
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(require_super_admin),
):
    _ensure_features(db)
    total_features = db.query(GlobalFeatureFlag).count()
    globally_enabled = db.query(GlobalFeatureFlag).filter(GlobalFeatureFlag.enabled_globally.is_(True)).count()
    total_tenant_assignments = db.query(TenantFeatureAssignment).count()
    active_tenant_assignments = db.query(TenantFeatureAssignment).filter(TenantFeatureAssignment.enabled.is_(True)).count()
    phases = db.query(GlobalFeatureFlag.phase).distinct().all()
    features_by_phase = {}
    for (phase,) in phases:
        features_by_phase[phase] = db.query(GlobalFeatureFlag).filter(GlobalFeatureFlag.phase == phase).count()
    return ControlCenterSummary(
        total_features=total_features,
        globally_enabled=globally_enabled,
        total_tenant_assignments=total_tenant_assignments,
        active_tenant_assignments=active_tenant_assignments,
        features_by_phase=features_by_phase,
    )


@router.get("/features", response_model=list[FeatureFlagResponse])
def list_features(
    phase: str | None = None,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(require_super_admin),
):
    _ensure_features(db)
    query = db.query(GlobalFeatureFlag)
    if phase:
        query = query.filter(GlobalFeatureFlag.phase == phase)
    items = query.order_by(GlobalFeatureFlag.phase, GlobalFeatureFlag.display_name).all()
    return [
        FeatureFlagResponse(
            id=str(item.id),
            feature_code=item.feature_code,
            phase=item.phase,
            display_name=item.display_name,
            description=item.description,
            enabled_globally=item.enabled_globally,
            requires_plan_upgrade=item.requires_plan_upgrade,
            min_plan_code=item.min_plan_code,
            created_at=item.created_at,
            updated_at=item.updated_at,
        )
        for item in items
    ]


@router.patch("/features/{feature_code}", response_model=FeatureFlagResponse)
def update_feature(
    feature_code: str,
    request: FeatureFlagUpdateRequest,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(require_super_admin),
):
    _ensure_features(db)
    item = db.query(GlobalFeatureFlag).filter(GlobalFeatureFlag.feature_code == feature_code).first()
    if not item:
        raise HTTPException(status_code=404, detail="Feature not found")
    data = request.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return FeatureFlagResponse(
        id=str(item.id),
        feature_code=item.feature_code,
        phase=item.phase,
        display_name=item.display_name,
        description=item.description,
        enabled_globally=item.enabled_globally,
        requires_plan_upgrade=item.requires_plan_upgrade,
        min_plan_code=item.min_plan_code,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.post("/tenant-features", response_model=TenantFeatureAssignmentResponse)
def create_tenant_assignment(
    request: TenantFeatureAssignmentCreateRequest,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(require_super_admin),
):
    existing = (
        db.query(TenantFeatureAssignment)
        .filter(
            TenantFeatureAssignment.tenant_id == request.tenant_id,
            TenantFeatureAssignment.feature_code == request.feature_code,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Assignment already exists for this tenant and feature")
    obj = TenantFeatureAssignment(
        tenant_id=request.tenant_id,
        feature_code=request.feature_code,
        enabled=request.enabled,
        enabled_until=request.enabled_until,
        notes=request.notes,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return TenantFeatureAssignmentResponse(
        id=str(obj.id),
        tenant_id=obj.tenant_id,
        feature_code=obj.feature_code,
        enabled=obj.enabled,
        enabled_until=obj.enabled_until,
        notes=obj.notes,
        created_at=obj.created_at,
        updated_at=obj.updated_at,
    )


@router.get("/tenant-features", response_model=list[TenantFeatureAssignmentResponse])
def list_tenant_assignments(
    tenant_id: str | None = None,
    feature_code: str | None = None,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(require_super_admin),
):
    query = db.query(TenantFeatureAssignment)
    if tenant_id:
        query = query.filter(TenantFeatureAssignment.tenant_id == tenant_id)
    if feature_code:
        query = query.filter(TenantFeatureAssignment.feature_code == feature_code)
    items = query.order_by(TenantFeatureAssignment.created_at.desc()).all()
    return [
        TenantFeatureAssignmentResponse(
            id=str(item.id),
            tenant_id=item.tenant_id,
            feature_code=item.feature_code,
            enabled=item.enabled,
            enabled_until=item.enabled_until,
            notes=item.notes,
            created_at=item.created_at,
            updated_at=item.updated_at,
        )
        for item in items
    ]


@router.patch("/tenant-features/{assignment_id}", response_model=TenantFeatureAssignmentResponse)
def update_tenant_assignment(
    assignment_id: str,
    request: TenantFeatureAssignmentUpdateRequest,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(require_super_admin),
):
    item = db.query(TenantFeatureAssignment).filter(TenantFeatureAssignment.id == assignment_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Assignment not found")
    data = request.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return TenantFeatureAssignmentResponse(
        id=str(item.id),
        tenant_id=item.tenant_id,
        feature_code=item.feature_code,
        enabled=item.enabled,
        enabled_until=item.enabled_until,
        notes=item.notes,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.delete("/tenant-features/{assignment_id}", response_model=dict)
def delete_tenant_assignment(
    assignment_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(require_super_admin),
):
    item = db.query(TenantFeatureAssignment).filter(TenantFeatureAssignment.id == assignment_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(item)
    db.commit()
    return {"detail": "Assignment deleted"}
