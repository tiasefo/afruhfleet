from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from admin_app.api.deps import get_current_admin
from admin_app.db.session import get_db
from admin_app.models.admin_user import AdminUser
from admin_app.schemas.proxy import ProxyBillingAdjustCredits, ProxyBillingAssignPlan, ProxyBillingSetReadOnly
from admin_app.services.audit_service import record_admin_audit
from admin_app.services import control_plane_client as cp

router = APIRouter(prefix="/billing", tags=["Admin – Billing"])


def _get_cp_token(request: Request) -> str:
    token = request.headers.get("X-CP-Token")
    if not token:
        raise HTTPException(status_code=400, detail="X-CP-Token header required")
    return token


@router.get("/plans")
def list_plans(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    return cp.list_plans(_get_cp_token(request))


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
    result = cp.assign_plan(_get_cp_token(request), payload.model_dump())
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="billing.plan_assigned_via_admin",
        entity_type="subscription",
        entity_id=payload.tenant_id,
        details={"plan_code": payload.plan_code},
    )
    return result


@router.post("/adjust-credits")
def adjust_credits(
    payload: ProxyBillingAdjustCredits,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    result = cp.adjust_credits(_get_cp_token(request), payload.model_dump())
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="billing.credits_adjusted_via_admin",
        entity_type="wallet",
        entity_id=payload.tenant_id,
        details={"delta": payload.credits_delta, "memo": payload.memo},
    )
    return result


@router.post("/set-read-only")
def set_read_only(
    payload: ProxyBillingSetReadOnly,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    result = cp.set_read_only(_get_cp_token(request), payload.model_dump())
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="billing.read_only_set_via_admin",
        entity_type="subscription",
        entity_id=payload.tenant_id,
        details={"reason": payload.reason},
    )
    return result
