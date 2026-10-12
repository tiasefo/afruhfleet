from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session

from sentinel_app.api.deps import get_cp_token, get_current_admin
from sentinel_app.api.validation import uuid_param_or_400
from sentinel_app.db.session import get_db
from sentinel_app.models.admin_user import AdminUser
from sentinel_app.services.audit_service import audited_admin_mutation
from sentinel_app.services.control_plane_client import (
    ControlPlaneError,
    list_kyc_submissions,
    approve_kyc_submission,
    revoke_kyc_submission,
)

router = APIRouter(prefix="/kyc", tags=["KYC Management"])

@router.get("/list")
def kyc_list(request: Request, cp_token: str = Depends(get_cp_token)):
    """List all KYC submissions"""
    try:
        return list_kyc_submissions(cp_token)
    except ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Control plane KYC request failed: {exc}") from exc

@router.post("/approve/{kyc_id}")
def kyc_approve(
    kyc_id: str,
    cp_token: str = Depends(get_cp_token),
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    kyc_id = uuid_param_or_400(kyc_id, "kyc_id")
    try:
        return audited_admin_mutation(
            db,
            admin_email=current_admin.email,
            action="kyc.approved",
            entity_type="kyc_submission",
            entity_id=kyc_id,
            operation=lambda: approve_kyc_submission(cp_token, kyc_id),
        )
    except ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

@router.post("/revoke/{kyc_id}")
def kyc_revoke(
    kyc_id: str,
    cp_token: str = Depends(get_cp_token),
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    kyc_id = uuid_param_or_400(kyc_id, "kyc_id")
    try:
        return audited_admin_mutation(
            db,
            admin_email=current_admin.email,
            action="kyc.revoked",
            entity_type="kyc_submission",
            entity_id=kyc_id,
            operation=lambda: revoke_kyc_submission(cp_token, kyc_id),
        )
    except ControlPlaneError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
