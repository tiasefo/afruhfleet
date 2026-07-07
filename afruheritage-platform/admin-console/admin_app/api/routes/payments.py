from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel

from admin_app.api.deps import get_current_admin
from admin_app.models.admin_user import AdminUser
from admin_app.services import control_plane_client as cp

router = APIRouter(prefix="/payments", tags=["Admin – Payments"])


def _get_cp_token(request: Request) -> str:
    token = request.headers.get("X-CP-Token")
    if not token:
        raise HTTPException(status_code=400, detail="X-CP-Token header required")
    return token


@router.get("")
def list_payments(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
    tenant_id: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    params = {"page": page, "page_size": page_size}
    if tenant_id:
        params["tenant_id"] = tenant_id
    if status:
        params["status"] = status
    try:
        return cp.list_admin_payments(_get_cp_token(request), params)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.get("/{payment_id}")
def get_payment(
    payment_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.get_admin_payment(_get_cp_token(request), payment_id)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


class ManualPaymentPayload(BaseModel):
    tenant_id: str
    amount: float
    currency: str = "GHS"
    method: str = "manual"
    reference: str | None = None
    description: str | None = None


@router.post("/manual")
def create_manual_payment(
    payload: ManualPaymentPayload,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.create_manual_payment(_get_cp_token(request), payload.model_dump())
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


class RefundPayload(BaseModel):
    amount: float | None = None
    reason: str
    refund_to: str = "original"


@router.post("/{payment_id}/refund")
def refund_payment(
    payment_id: str,
    payload: RefundPayload,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.refund_payment(_get_cp_token(request), payment_id, payload.model_dump())
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


class DisputePayload(BaseModel):
    status: str
    resolution_notes: str | None = None
    refund_amount: float | None = None


@router.post("/{payment_id}/dispute")
def handle_dispute(
    payment_id: str,
    payload: DisputePayload,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.handle_dispute(_get_cp_token(request), payment_id, payload.model_dump())
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.get("/{payment_id}/status")
def check_payment_status(
    payment_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.check_payment_status(_get_cp_token(request), payment_id)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)
