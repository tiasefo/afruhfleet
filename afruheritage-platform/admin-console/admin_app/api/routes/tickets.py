from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from admin_app.api.deps import get_current_admin
from admin_app.models.admin_user import AdminUser
from admin_app.services import control_plane_client as cp

router = APIRouter(prefix="/tickets", tags=["Admin – Tickets"])


def _get_cp_token(request: Request) -> str:
    token = request.headers.get("X-CP-Token")
    if not token:
        raise HTTPException(status_code=400, detail="X-CP-Token header required")
    return token


@router.get("")
def list_tickets(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
    status: str | None = Query(None),
    tenant_id: str | None = Query(None),
    q: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    params = {"page": page, "page_size": page_size}
    if status:
        params["status"] = status
    if tenant_id:
        params["tenant_id"] = tenant_id
    if q:
        params["q"] = q
    try:
        return cp.list_admin_tickets(_get_cp_token(request), params)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.patch("/{ticket_id}/status")
def update_ticket_status(
    ticket_id: str,
    status: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.update_admin_ticket_status(_get_cp_token(request), ticket_id, status)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)
