from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from admin_app.api.deps import get_current_admin
from admin_app.db.session import get_db
from admin_app.models.admin_user import AdminUser
from admin_app.schemas.proxy import ProxyRunnerCreate
from admin_app.services.audit_service import record_admin_audit
from admin_app.services import control_plane_client as cp

router = APIRouter(prefix="/runners", tags=["Admin – Runners"])


def _get_cp_token(request: Request) -> str:
    token = request.headers.get("X-CP-Token")
    if not token:
        raise HTTPException(status_code=400, detail="X-CP-Token header required")
    return token


@router.get("")
def list_runners(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    return cp.list_runners(_get_cp_token(request))


@router.post("")
def create_runner(
    payload: ProxyRunnerCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    result = cp.create_runner(_get_cp_token(request), payload.model_dump())
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="runner.created_via_admin",
        entity_type="runner",
        entity_id=result.get("id"),
        details={"name": payload.name, "host": payload.host},
    )
    return result
