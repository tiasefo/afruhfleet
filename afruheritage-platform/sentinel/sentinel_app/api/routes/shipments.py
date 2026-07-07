from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel

from sentinel_app.api.deps import get_current_admin
from sentinel_app.models.admin_user import AdminUser
import sentinel_app.services.control_plane_client as cp

router = APIRouter(prefix="/shipments", tags=["Admin – Shipments"])


def _get_cp_token(request: Request) -> str:
    token = request.headers.get("X-CP-Token")
    if not token:
        raise HTTPException(status_code=400, detail="X-CP-Token header required")
    return token


@router.get("")
def list_shipments(
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
        return cp.list_admin_shipments(_get_cp_token(request), params)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.get("/{shipment_id}")
def get_shipment(
    shipment_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.get_admin_shipment(_get_cp_token(request), shipment_id)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


class ShipmentUpdate(BaseModel):
    status: str | None = None
    notes: str | None = None
    priority: str | None = None


@router.patch("/{shipment_id}")
def update_shipment(
    shipment_id: str,
    payload: ShipmentUpdate,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.update_admin_shipment(_get_cp_token(request), shipment_id, payload.model_dump(exclude_unset=True))
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


class ReroutePayload(BaseModel):
    new_destination: str
    reason: str


@router.post("/{shipment_id}/reroute")
def reroute_shipment(
    shipment_id: str,
    payload: ReroutePayload,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.reroute_shipment(_get_cp_token(request), shipment_id, payload.model_dump())
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.post("/{shipment_id}/cancel")
def cancel_shipment(
    shipment_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.cancel_shipment(_get_cp_token(request), shipment_id)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.get("/{shipment_id}/tracking")
def get_tracking(
    shipment_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.get_shipment_tracking(_get_cp_token(request), shipment_id)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


class NotesPayload(BaseModel):
    notes: str
    internal: bool = False


@router.post("/{shipment_id}/notes")
def add_notes(
    shipment_id: str,
    payload: NotesPayload,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.add_shipment_notes(_get_cp_token(request), shipment_id, payload.model_dump())
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)
