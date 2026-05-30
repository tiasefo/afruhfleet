from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from admin_app.api.deps import get_current_admin
from admin_app.models.admin_user import AdminUser
from admin_app.services import control_plane_client as cp

router = APIRouter(prefix="/tracking", tags=["Admin – Tracking"])


def _get_cp_token(request: Request) -> str:
    token = request.headers.get("X-CP-Token")
    if not token:
        raise HTTPException(status_code=400, detail="X-CP-Token header required")
    return token


@router.get("/public")
def track_public(
    tenant_id: str = Query(...),
    tracking_number: str = Query(...),
    request: Request = None,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="tenant_id must be a valid UUID")
    try:
        return cp.track_public_shipment(_get_cp_token(request), tenant_id, tracking_number)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)
