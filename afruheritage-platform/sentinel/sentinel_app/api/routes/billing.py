from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from sentinel_app.api.deps import get_current_admin
from sentinel_app.db.session import get_db
from sentinel_app.models.admin_user import AdminUser
from sentinel_app.schemas.proxy import ProxyBillingAdjustCredits, ProxyBillingAssignPlan, ProxyBillingSetReadOnly
from sentinel_app.services.audit_service import audit_attempt_or_503, record_admin_audit
from sentinel_app.services import control_plane_client as cp

router = APIRouter(prefix="/billing", tags=["Admin – Billing"])


def _get_cp_token(request: Request) -> str | None:
    return request.headers.get("X-CP-Token")


@router.get("/plans")
def list_plans(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.list_plans(_get_cp_token(request))
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.patch("/plans/{plan_id}")
def update_plan(
    plan_id: str,
    payload: dict,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.admin_update_plan(_get_cp_token(request), plan_id, payload)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.delete("/plans/{plan_id}")
def delete_plan(
    plan_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.admin_delete_plan(_get_cp_token(request), plan_id)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.get("/promotions")
def list_promotions(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.admin_list_promotions(_get_cp_token(request))
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.post("/promotions")
def create_promotion(
    payload: dict,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.admin_create_promotion(_get_cp_token(request), payload)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.patch("/promotions/{promotion_id}")
def update_promotion(
    promotion_id: str,
    payload: dict,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.admin_update_promotion(_get_cp_token(request), promotion_id, payload)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.delete("/promotions/{promotion_id}")
def delete_promotion(
    promotion_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.admin_delete_promotion(_get_cp_token(request), promotion_id)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.get("/subscriptions/{tenant_id}")
def get_subscription(
    tenant_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    return cp.get_subscription(_get_cp_token(request), tenant_id)


@router.get("/wallets/{tenant_id}")
def get_wallet(
    tenant_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    return cp.get_wallet(_get_cp_token(request), tenant_id)


@router.post("/assign-plan")
def assign_plan(
    payload: ProxyBillingAssignPlan,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    audit_attempt_or_503(
        db,
        admin_email=current_admin.email,
        action="billing.plan_assigned_via_admin",
        entity_type="subscription",
        entity_id=payload.tenant_id,
        details={"plan_code": payload.plan_code},
    )
    result = cp.assign_plan(_get_cp_token(request), payload.model_dump())
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="billing.plan_assigned_via_admin",
        entity_type="subscription",
        entity_id=payload.tenant_id,
        details={**({"plan_code": payload.plan_code}), "outcome": "success"},
    )
    return result


@router.post("/adjust-credits")
def adjust_credits(
    payload: ProxyBillingAdjustCredits,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    audit_attempt_or_503(
        db,
        admin_email=current_admin.email,
        action="billing.credits_adjusted_via_admin",
        entity_type="wallet",
        entity_id=payload.tenant_id,
        details={"delta": payload.credits_delta, "memo": payload.memo},
    )
    result = cp.adjust_credits(_get_cp_token(request), payload.model_dump())
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="billing.credits_adjusted_via_admin",
        entity_type="wallet",
        entity_id=payload.tenant_id,
        details={**({"delta": payload.credits_delta, "memo": payload.memo}), "outcome": "success"},
    )
    return result


@router.post("/set-read-only")
def set_read_only(
    payload: ProxyBillingSetReadOnly,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    audit_attempt_or_503(
        db,
        admin_email=current_admin.email,
        action="billing.read_only_set_via_admin",
        entity_type="subscription",
        entity_id=payload.tenant_id,
        details={"reason": payload.reason},
    )
    result = cp.set_read_only(_get_cp_token(request), payload.model_dump())
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="billing.read_only_set_via_admin",
        entity_type="subscription",
        entity_id=payload.tenant_id,
        details={**({"reason": payload.reason}), "outcome": "success"},
    )
    return result
