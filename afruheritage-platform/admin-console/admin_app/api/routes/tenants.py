from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
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
    try:
        return cp.list_tenants(_get_cp_token(request))
    except Exception as exc:
        # If the control plane API is not available, return empty list
        return []


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


@router.get("/requests")
def list_tenant_requests(
    request: Request,
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_admin: AdminUser = Depends(get_current_admin),
):
    _ = current_admin
    return cp.list_tenant_requests(_get_cp_token(request), status=status, page=page, page_size=page_size)


class ReviewTenantRequestPayload(BaseModel):
    status: str
    review_notes: str | None = None


@router.patch("/requests/{request_id}")
def review_tenant_request(
    request_id: str,
    payload: ReviewTenantRequestPayload,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    result = cp.review_tenant_request(_get_cp_token(request), request_id, payload.model_dump())
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="tenant.request.reviewed_via_admin",
        entity_type="tenant_request",
        entity_id=request_id,
        details={"status": payload.status},
    )
    return result


@router.post("/requests/{request_id}/auto-provision")
def auto_provision_tenant_request(
    request_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    result = cp.auto_provision_tenant_request(_get_cp_token(request), request_id)
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="tenant.request.auto_provisioned_via_admin",
        entity_type="tenant_request",
        entity_id=request_id,
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


@router.post("/{tenant_id}/suspend")
def suspend_tenant(
    tenant_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    result = cp.suspend_tenant(_get_cp_token(request), tenant_id)
    record_admin_audit(db, admin_email=current_admin.email, action="tenant.suspended_via_admin", entity_type="tenant", entity_id=tenant_id)
    return result


@router.post("/{tenant_id}/activate")
def activate_tenant(
    tenant_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    result = cp.activate_tenant(_get_cp_token(request), tenant_id)
    record_admin_audit(db, admin_email=current_admin.email, action="tenant.activated_via_admin", entity_type="tenant", entity_id=tenant_id)
    return result


@router.delete("/{tenant_id}")
def delete_tenant(
    tenant_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    result = cp.delete_tenant(_get_cp_token(request), tenant_id)
    record_admin_audit(db, admin_email=current_admin.email, action="tenant.deleted_via_admin", entity_type="tenant", entity_id=tenant_id)
    return result


@router.post("/{tenant_id}/provision")
def provision_tenant(
    tenant_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    result = cp.provision_tenant_fleetbase(_get_cp_token(request), tenant_id)
    record_admin_audit(db, admin_email=current_admin.email, action="tenant.provisioned_via_admin", entity_type="tenant", entity_id=tenant_id)
    return result


# ── Support: lookup + resend portal URL ─────────────────────────────────────────

@router.get("/lookup")
def lookup_tenant(
    request: Request,
    email: str | None = Query(None),
    slug: str | None = Query(None),
    current_admin: AdminUser = Depends(get_current_admin),
):
    """Support: find a tenant by email or slug and return their portal URL."""
    return cp.lookup_tenant(_get_cp_token(request), email=email, slug=slug)


@router.post("/{tenant_id}/resend-portal-url")
def resend_portal_url(
    tenant_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    """Support: re-send portal URL email to tenant admin and return the URL."""
    result = cp.resend_portal_url(_get_cp_token(request), tenant_id)
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="tenant.portal_url.resent_via_admin",
        entity_type="tenant",
        entity_id=tenant_id,
        details={"portal_url": result.get("portal_url"), "email_sent": result.get("email_sent")},
    )
    return result
