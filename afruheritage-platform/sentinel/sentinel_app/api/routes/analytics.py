from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request

from sentinel_app.api.deps import get_current_admin
from sentinel_app.models.admin_user import AdminUser
from sentinel_app.services import control_plane_client as cp

router = APIRouter(prefix="/analytics", tags=["Admin – Analytics"])


def _get_cp_token(request: Request) -> str:
    token = request.headers.get("X-CP-Token")
    if not token:
        raise HTTPException(status_code=400, detail="X-CP-Token header required")
    return token


@router.get("/summary")
def get_summary(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    try:
        return cp.get_admin_analytics_summary(_get_cp_token(request))
    except cp.ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)
