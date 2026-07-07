from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from sentinel_app.api.deps import get_current_admin
from sentinel_app.models.admin_user import AdminUser
import sentinel_app.services.control_plane_client as cp

router = APIRouter(prefix="/fleetbase", tags=["Admin – Fleetbase Operations"])


def _get_cp_token(request: Request) -> str:
    token = request.headers.get("X-CP-Token")
    if not token:
        raise HTTPException(status_code=400, detail="X-CP-Token header required")
    return token


@router.get("/tenant/{tenant_id}/status")
def get_tenant_status(
    tenant_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.get_fleetbase_tenant_status(_get_cp_token(request), tenant_id)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.post("/tenant/{tenant_id}/restart")
def restart_tenant(
    tenant_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.restart_fleetbase_tenant(_get_cp_token(request), tenant_id)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.get("/tenant/{tenant_id}/logs")
def get_tenant_logs(
    tenant_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
    lines: int = Query(100, ge=1, le=1000),
    since: str | None = Query(None),
):
    params = {"lines": lines}
    if since:
        params["since"] = since
    try:
        return cp.get_fleetbase_tenant_logs(_get_cp_token(request), tenant_id, params)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.post("/tenant/{tenant_id}/debug")
def debug_tenant(
    tenant_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.debug_fleetbase_tenant(_get_cp_token(request), tenant_id)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.get("/tenant/{tenant_id}/health")
def check_tenant_health(
    tenant_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.check_fleetbase_tenant_health(_get_cp_token(request), tenant_id)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)
