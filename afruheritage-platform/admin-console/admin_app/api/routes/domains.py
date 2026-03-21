from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from admin_app.api.deps import get_current_admin
from admin_app.db.session import get_db
from admin_app.models.admin_user import AdminUser
from admin_app.schemas.proxy import ProxyDomainActivate
from admin_app.services.audit_service import record_admin_audit
from admin_app.services import control_plane_client as cp

router = APIRouter(prefix="/domains", tags=["Admin – Domains"])


def _get_cp_token(request: Request) -> str:
    token = request.headers.get("X-CP-Token")
    if not token:
        raise HTTPException(status_code=400, detail="X-CP-Token header required")
    return token


@router.get("/tenant/{tenant_id}")
def list_tenant_domains(
    tenant_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    return cp.list_tenant_domains(_get_cp_token(request), tenant_id)


@router.post("/activate")
def activate_domain(
    payload: ProxyDomainActivate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    result = cp.activate_domain(_get_cp_token(request), payload.model_dump())
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="domain.activated_via_admin",
        entity_type="domain",
        entity_id=payload.tenant_id,
        details={"hostname": payload.hostname},
    )
    return result
