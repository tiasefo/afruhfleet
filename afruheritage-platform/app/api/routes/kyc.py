from fastapi import APIRouter, UploadFile, File, Depends
from app.services.kyc_service import KYCService
from app.api.deps import get_db, get_current_user
from app.models.user import User
from sqlalchemy.orm import Session

router = APIRouter()
from fastapi import Form
# Test endpoint: Run full in-built KYC pipeline
@router.post("/test/full-pipeline")
async def test_full_kyc_pipeline(
    id_document: UploadFile = File(...),
    selfie_video: UploadFile = File(...),
    id_type: str = Form(...),
    id_number: str = Form(...),
    full_name: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    kyc_service = KYCService()
    id_bytes = await id_document.read()
    video_bytes = await selfie_video.read()
    result = await kyc_service.perform_kyc_verification(
        db=db,
        user_id=str(current_user.id),
        id_document=id_bytes,
        selfie_video=video_bytes,
        id_type=id_type,
        id_number=id_number,
        full_name=full_name
    )
    return result
from app.models.kyc import KYCSubmission, KYCStatus
from app.services.kyc_service import submit_id_document, submit_liveness_video
from app.api.deps import require_superuser
@router.get("/admin/list")
def list_kyc_submissions(db: Session = Depends(get_db), current_user: User = Depends(require_superuser)):
    """List all KYC submissions (admin only)"""
    return [
        {
            "id": str(k.id),
            "user_id": str(k.user_id),
            "status": k.status.value,
            "id_document_url": k.id_document_url,
            "liveness_video_url": k.liveness_video_url,
            "result": k.result,
            "created_at": k.created_at,
            "updated_at": k.updated_at,
        }
        for k in db.query(KYCSubmission).all()
    ]

@router.post("/admin/approve/{kyc_id}")
def approve_kyc_submission(kyc_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_superuser)):
    kyc = db.query(KYCSubmission).filter_by(id=kyc_id).first()
    if not kyc:
        raise HTTPException(status_code=404, detail="KYC submission not found")
    kyc.status = KYCStatus.approved
    db.commit()
    return {"status": "approved"}

@router.post("/admin/revoke/{kyc_id}")
def revoke_kyc_submission(kyc_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_superuser)):
    kyc = db.query(KYCSubmission).filter_by(id=kyc_id).first()
    if not kyc:
        raise HTTPException(status_code=404, detail="KYC submission not found")
    kyc.status = KYCStatus.rejected
    db.commit()
    return {"status": "revoked"}
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db
from app.models.user import User

router = APIRouter(prefix="/kyc", tags=["KYC Verification"])

@router.post("/upload-id")
async def upload_id_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload ID document for OCR/KYC verification"""
    # TODO: Save file, call OCR API, store result
    return {"status": "pending", "message": "ID uploaded, verification in progress"}

@router.post("/liveness")
async def upload_liveness_video(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload liveness/selfie video for biometric verification"""
    # TODO: Save file, call biometrics API, store result
    return {"status": "pending", "message": "Liveness video uploaded, verification in progress"}

@router.get("/status")
async def get_kyc_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # TODO: Query KYC status from DB
    return {"status": "not_started"}
