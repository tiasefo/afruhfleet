from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from admin_app.api.deps import get_current_admin
from admin_app.db.session import get_db
from admin_app.models.admin_user import AdminUser
from admin_app.schemas.proxy import ProxyTenantApprove, ProxyTenantCreate, ProxyTenantLaunch
from admin_app.services.audit_service import record_admin_audit
from admin_app.services import control_plane_client as cp

router = APIRouter(prefix="/tenants", tags=["Admin – Tenants"])


def _get_cp_token(request: Request) -> str:
    token = request.headers.get("X-CP-Token")
    if not token:
        raise HTTPException(status_code=400, detail="X-CP-Token header required to proxy to control plane")
    return token


@router.get("")
def list_tenants(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    return cp.list_tenants(_get_cp_token(request))


@router.post("")
def create_tenant(
    payload: ProxyTenantCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    result = cp.create_tenant(_get_cp_token(request), payload.model_dump())
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="tenant.created_via_admin",
        entity_type="tenant",
        entity_id=result.get("id"),
        details={"company_name": payload.company_name},
    )
    return result


@router.post("/{tenant_id}/approve")
def approve_tenant(
    tenant_id: str,
    payload: ProxyTenantApprove,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    result = cp.approve_tenant(_get_cp_token(request), tenant_id, payload.model_dump())
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="tenant.approved_via_admin",
        entity_type="tenant",
        entity_id=tenant_id,
    )
    return result


@router.post("/{tenant_id}/launch")
def launch_tenant(
    tenant_id: str,
    payload: ProxyTenantLaunch,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    result = cp.launch_tenant(_get_cp_token(request), tenant_id, payload.model_dump())
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="tenant.launched_via_admin",
        entity_type="tenant",
        entity_id=tenant_id,
    )
    return result


@router.get("/jobs/{job_id}")
def get_job(
    job_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    return cp.get_job(_get_cp_token(request), job_id)
