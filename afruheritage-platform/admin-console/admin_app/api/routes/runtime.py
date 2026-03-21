from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from admin_app.api.deps import get_current_admin
from admin_app.db.session import get_db
from admin_app.models.admin_user import AdminUser
from admin_app.schemas.proxy import ProxyRuntimeDeploy
from admin_app.services.audit_service import record_admin_audit
from admin_app.services import control_plane_client as cp

router = APIRouter(prefix="/runtime", tags=["Admin – Runtime"])


def _get_cp_token(request: Request) -> str:
    token = request.headers.get("X-CP-Token")
    if not token:
        raise HTTPException(status_code=400, detail="X-CP-Token header required")
    return token


@router.get("/tenant/{tenant_id}")
def get_tenant_runtime(
    tenant_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    return cp.get_tenant_runtime(_get_cp_token(request), tenant_id)


@router.post("/deploy")
def deploy_runtime(
    payload: ProxyRuntimeDeploy,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    result = cp.deploy_runtime(_get_cp_token(request), payload.model_dump())
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="runtime.deployed_via_admin",
        entity_type="runtime",
        entity_id=payload.tenant_id,
        details={"tenant_slug": payload.tenant_slug},
    )
    return result


@router.post("/suspend")
def suspend_runtime(
    request: Request,
    runtime_id: str,
    reason: str | None = None,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    result = cp.suspend_runtime(_get_cp_token(request), {"runtime_id": runtime_id, "reason": reason})
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="runtime.suspended_via_admin",
        entity_type="runtime",
        entity_id=runtime_id,
        details={"reason": reason},
    )
    return result


@router.post("/retry")
def retry_runtime(
    request: Request,
    runtime_id: str,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    result = cp.retry_runtime(_get_cp_token(request), {"runtime_id": runtime_id})
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="runtime.retried_via_admin",
        entity_type="runtime",
        entity_id=runtime_id,
    )
    return result
