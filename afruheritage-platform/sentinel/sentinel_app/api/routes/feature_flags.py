from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from sentinel_app.api.deps import get_current_admin
from sentinel_app.models.admin_user import AdminUser
import sentinel_app.services.control_plane_client as cp

router = APIRouter(prefix="/feature-flags", tags=["Admin – Feature Flags"])


def _get_cp_token(request: Request) -> str:
    token = request.headers.get("X-CP-Token")
    if not token:
        raise HTTPException(status_code=400, detail="X-CP-Token header required")
    return token


@router.get("/tenant/{tenant_id}")
def get_tenant_flags(
    tenant_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.get_tenant_feature_flags(_get_cp_token(request), tenant_id)
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


class FeatureFlagsUpdate(BaseModel):
    flags: dict


@router.patch("/tenant/{tenant_id}")
def update_tenant_flags(
    tenant_id: str,
    payload: FeatureFlagsUpdate,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.update_tenant_feature_flags(_get_cp_token(request), tenant_id, payload.model_dump())
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.get("/global")
def get_global_flags(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.get_global_feature_flags(_get_cp_token(request))
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.patch("/global")
def update_global_flags(
    payload: FeatureFlagsUpdate,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.update_global_feature_flags(_get_cp_token(request), payload.model_dump())
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)
