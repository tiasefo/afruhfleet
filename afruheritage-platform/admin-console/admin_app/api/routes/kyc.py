from fastapi import APIRouter, Depends, Request, HTTPException
from admin_app.services.control_plane_client import list_kyc_submissions, approve_kyc_submission, revoke_kyc_submission
from admin_app.api.deps import get_cp_token

router = APIRouter(prefix="/kyc", tags=["KYC Management"])

@router.get("/list")
def kyc_list(request: Request, cp_token: str = Depends(get_cp_token)):
    """List all KYC submissions"""
    return list_kyc_submissions(cp_token)

@router.post("/approve/{kyc_id}")
def kyc_approve(kyc_id: str, cp_token: str = Depends(get_cp_token)):
    return approve_kyc_submission(cp_token, kyc_id)

@router.post("/revoke/{kyc_id}")
def kyc_revoke(kyc_id: str, cp_token: str = Depends(get_cp_token)):
    return revoke_kyc_submission(cp_token, kyc_id)
