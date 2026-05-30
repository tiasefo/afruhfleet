from __future__ import annotations

import json
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_superuser
from app.models.kyc import KYCStatus, KYCSubmission
from app.models.user import User
from app.services.billing_service import consume_wallet_credits, evaluate_subscription_state, feature_credit_cost, feature_enabled_for_plan
from app.services.kyc_service import KYCService
from app.services.storage_service import storage_service

router = APIRouter(prefix='/kyc', tags=['KYC Verification'])


def _tenant_scope(user: User) -> str:
    return str(user.tenant_id) if getattr(user, 'tenant_id', None) else 'platform'


def _upload_kyc_file(
    *,
    tenant_scope: str,
    user_id: str,
    submission_id: str,
    upload: UploadFile,
    logical_name: str,
) -> str:
    suffix = Path(upload.filename or '').suffix or '.bin'
    path = f'kyc/{user_id}/{submission_id}/{logical_name}{suffix}'
    return storage_service.upload(
        tenant_id=tenant_scope,
        path=path,
        data=upload.file,
        content_type=upload.content_type or 'application/octet-stream',
    )


@router.post('/submit-manual')
async def submit_manual_kyc(
    id_type: str = Form(...),
    id_number: str = Form(...),
    full_name: str = Form(...),
    id_front: UploadFile = File(...),
    id_back: UploadFile = File(...),
    liveness_photo: UploadFile = File(...),
    liveness_video: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tenant_id = str(getattr(current_user, 'tenant_id', '') or '')
    if not tenant_id:
        raise HTTPException(status_code=400, detail='Tenant context required for KYC submission')

    sub = evaluate_subscription_state(db, tenant_id)
    if not sub:
        raise HTTPException(status_code=402, detail='No active subscription found for tenant')
    if not feature_enabled_for_plan(sub.plan_code.value, 'manual_kyc'):
        raise HTTPException(status_code=403, detail='Current plan does not include manual KYC processing')

    row = db.query(KYCSubmission).filter(KYCSubmission.user_id == current_user.id).first()
    if not row:
        row = KYCSubmission(user_id=current_user.id, status=KYCStatus.pending)
        db.add(row)
        db.flush()

    tenant_scope = _tenant_scope(current_user)
    submission_id = str(row.id)
    user_id = str(current_user.id)

    id_front_url = _upload_kyc_file(
        tenant_scope=tenant_scope,
        user_id=user_id,
        submission_id=submission_id,
        upload=id_front,
        logical_name='id_front',
    )
    id_back_url = _upload_kyc_file(
        tenant_scope=tenant_scope,
        user_id=user_id,
        submission_id=submission_id,
        upload=id_back,
        logical_name='id_back',
    )
    liveness_photo_url = _upload_kyc_file(
        tenant_scope=tenant_scope,
        user_id=user_id,
        submission_id=submission_id,
        upload=liveness_photo,
        logical_name='liveness_photo',
    )

    liveness_video_url = None
    if liveness_video:
        liveness_video_url = _upload_kyc_file(
            tenant_scope=tenant_scope,
            user_id=user_id,
            submission_id=submission_id,
            upload=liveness_video,
            logical_name='liveness_video',
        )

    row.status = KYCStatus.pending
    row.id_document_url = id_front_url
    row.liveness_video_url = liveness_video_url
    row.result = json.dumps(
        {
            'id_type': id_type,
            'id_number': id_number,
            'full_name': full_name,
            'id_front_url': id_front_url,
            'id_back_url': id_back_url,
            'liveness_photo_url': liveness_photo_url,
            'liveness_video_url': liveness_video_url,
            'submitted_at': datetime.utcnow().isoformat(),
            'review_mode': 'manual_admin_review',
        }
    )

    db.commit()
    db.refresh(row)

    credit_cost = feature_credit_cost('kyc_manual_submission')
    if credit_cost > 0:
        try:
            consume_wallet_credits(
                db,
                tenant_id=tenant_id,
                usage_type='document_processing',
                credits=credit_cost,
                memo='Manual KYC submission processing',
            )
        except ValueError as exc:
            raise HTTPException(status_code=402, detail=str(exc)) from exc

    return {
        'submission_id': str(row.id),
        'status': row.status.value,
        'message': 'KYC documents submitted for manual admin review.',
        'files': {
            'id_front_url': id_front_url,
            'id_back_url': id_back_url,
            'liveness_photo_url': liveness_photo_url,
            'liveness_video_url': liveness_video_url,
        },
    }


@router.post('/upload-id')
async def upload_id_document(
    file: UploadFile = File(...),
    side: str = Form('front'),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    side_normalized = side.lower().strip()
    if side_normalized not in {'front', 'back'}:
        raise HTTPException(status_code=400, detail='side must be front or back')

    row = db.query(KYCSubmission).filter(KYCSubmission.user_id == current_user.id).first()
    if not row:
        row = KYCSubmission(user_id=current_user.id, status=KYCStatus.pending)
        db.add(row)
        db.flush()

    file_url = _upload_kyc_file(
        tenant_scope=_tenant_scope(current_user),
        user_id=str(current_user.id),
        submission_id=str(row.id),
        upload=file,
        logical_name=f'id_{side_normalized}',
    )

    payload = {}
    if row.result:
        try:
            payload = json.loads(row.result)
        except Exception:
            payload = {}

    payload[f'id_{side_normalized}_url'] = file_url
    payload['submitted_at'] = datetime.utcnow().isoformat()

    if side_normalized == 'front':
        row.id_document_url = file_url
    row.status = KYCStatus.pending
    row.result = json.dumps(payload)
    db.commit()

    return {'status': row.status.value, 'side': side_normalized, 'file_url': file_url}


@router.post('/liveness')
async def upload_liveness_capture(
    photo: UploadFile = File(...),
    video: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = db.query(KYCSubmission).filter(KYCSubmission.user_id == current_user.id).first()
    if not row:
        row = KYCSubmission(user_id=current_user.id, status=KYCStatus.pending)
        db.add(row)
        db.flush()

    tenant_scope = _tenant_scope(current_user)
    photo_url = _upload_kyc_file(
        tenant_scope=tenant_scope,
        user_id=str(current_user.id),
        submission_id=str(row.id),
        upload=photo,
        logical_name='liveness_photo',
    )

    video_url = None
    if video:
        video_url = _upload_kyc_file(
            tenant_scope=tenant_scope,
            user_id=str(current_user.id),
            submission_id=str(row.id),
            upload=video,
            logical_name='liveness_video',
        )
        row.liveness_video_url = video_url

    payload = {}
    if row.result:
        try:
            payload = json.loads(row.result)
        except Exception:
            payload = {}

    payload['liveness_photo_url'] = photo_url
    if video_url:
        payload['liveness_video_url'] = video_url
    payload['submitted_at'] = datetime.utcnow().isoformat()

    row.status = KYCStatus.pending
    row.result = json.dumps(payload)
    db.commit()

    return {
        'status': row.status.value,
        'liveness_photo_url': photo_url,
        'liveness_video_url': video_url,
        'message': 'Liveness capture submitted for manual review.',
    }


@router.get('/status')
async def get_kyc_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await KYCService().get_kyc_status(db, str(current_user.id))


@router.get('/admin/list')
def list_kyc_submissions(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    items = []
    for row in db.query(KYCSubmission).order_by(KYCSubmission.updated_at.desc()).all():
        payload = {}
        if row.result:
            try:
                payload = json.loads(row.result)
            except Exception:
                payload = {}

        items.append(
            {
                'id': str(row.id),
                'user_id': str(row.user_id),
                'status': row.status.value,
                'id_document_url': row.id_document_url,
                'id_back_url': payload.get('id_back_url'),
                'liveness_photo_url': payload.get('liveness_photo_url'),
                'liveness_video_url': row.liveness_video_url or payload.get('liveness_video_url'),
                'id_type': payload.get('id_type'),
                'id_number': payload.get('id_number'),
                'full_name': payload.get('full_name'),
                'submitted_at': payload.get('submitted_at'),
                'created_at': row.created_at,
                'updated_at': row.updated_at,
            }
        )
    return items


@router.post('/admin/approve/{kyc_id}')
def approve_kyc_submission(
    tenant_id: str,
    kyc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    row = db.query(KYCSubmission).filter_by(id=uuid.UUID(kyc_id)).first()
    if not row:
        raise HTTPException(status_code=404, detail='KYC submission not found')
    row.status = KYCStatus.approved
    db.commit()
    return {'status': 'approved'}


@router.post('/admin/revoke/{kyc_id}')
def revoke_kyc_submission(
    tenant_id: str,
    kyc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    row = db.query(KYCSubmission).filter_by(id=uuid.UUID(kyc_id)).first()
    if not row:
        raise HTTPException(status_code=404, detail='KYC submission not found')
    row.status = KYCStatus.rejected
    db.commit()
    return {'status': 'revoked'}
