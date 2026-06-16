from fastapi import APIRouter, Depends, Request, HTTPException
from sentinel_app.services.control_plane_client import list_kyc_submissions, approve_kyc_submission, revoke_kyc_submission
from sentinel_app.api.deps import get_cp_token

router = APIRouter(prefix="/kyc", tags=["KYC Management"])

@router.get("/list")
def kyc_list(request: Request, cp_token: str = Depends(get_cp_token)):
    """List all KYC submissions"""
    try:
        return list_kyc_submissions(cp_token)
    except Exception as exc:
        # If the control plane API is not available, return empty list
        return []

@router.post("/approve/{kyc_id}")
def kyc_approve(kyc_id: str, cp_token: str = Depends(get_cp_token)):
    try:
        return approve_kyc_submission(cp_token, kyc_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

@router.post("/revoke/{kyc_id}")
def kyc_revoke(kyc_id: str, cp_token: str = Depends(get_cp_token)):
    try:
        return revoke_kyc_submission(cp_token, kyc_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
