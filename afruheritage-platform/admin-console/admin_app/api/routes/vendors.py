from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from admin_app.api.deps import get_current_admin
from admin_app.db.session import get_db
from admin_app.models.admin_user import AdminUser
from admin_app.schemas.proxy import ProxyVendorReview
from admin_app.services.audit_service import record_admin_audit
from admin_app.services import control_plane_client as cp

router = APIRouter(prefix="/vendors", tags=["Admin – Vendors"])


def _get_cp_token(request: Request) -> str:
    token = request.headers.get("X-CP-Token")
    if not token:
        raise HTTPException(status_code=400, detail="X-CP-Token header required to proxy to control plane")
    return token


@router.get("")
def list_vendors(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
    status: str | None = None,
    q: str | None = None,
    page: int = 1,
    page_size: int = 20,
):
    try:
        params = {"page": page, "page_size": page_size}
        if status:
            params["status"] = status
        if q:
            params["q"] = q
        return cp.list_vendors(_get_cp_token(request), params)
    except Exception as exc:
        # If the control plane API is not available, return empty list
        return {"items": [], "total": 0, "page": page, "page_size": page_size, "pages": 0}


@router.get("/{vendor_id}")
def get_vendor(
    vendor_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    return cp.get_vendor(_get_cp_token(request), vendor_id)


@router.post("/{vendor_id}/review")
def review_vendor(
    vendor_id: str,
    payload: ProxyVendorReview,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    result = cp.review_vendor(_get_cp_token(request), vendor_id, payload.model_dump())
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action=f"vendor.{payload.action}_via_admin",
        entity_type="vendor",
        entity_id=vendor_id,
        details={"action": payload.action},
    )
    return result


@router.post("/{vendor_id}/suspend")
def suspend_vendor(
    vendor_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    result = cp.suspend_vendor(_get_cp_token(request), vendor_id)
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="vendor.suspended_via_admin",
        entity_type="vendor",
        entity_id=vendor_id,
    )
    return result
