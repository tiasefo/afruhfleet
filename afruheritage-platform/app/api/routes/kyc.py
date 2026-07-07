from __future__ import annotations

import json
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_superuser, require_active_subscription
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
    current_user: User = Depends(require_active_subscription),
):
    # tenant_id is optional — personal shippers have no tenant
    tenant_id = str(getattr(current_user, 'tenant_id', '') or '')

    # Subscription check only for tenanted users (company admins / drivers on a plan)
    if tenant_id:
        sub = evaluate_subscription_state(db, tenant_id)
        if sub and not feature_enabled_for_plan(sub.plan_code.value, 'manual_kyc'):
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

    # Store in dedicated model columns (Sprint 3)
    row.status = KYCStatus.pending
    row.id_type = id_type
    row.id_number = id_number
    row.full_name = full_name
    row.id_document_url = id_front_url
    row.id_front_url = id_front_url
    row.id_back_url = id_back_url
    row.liveness_photo_url = liveness_photo_url
    row.liveness_video_url = liveness_video_url

    db.commit()
    db.refresh(row)

    if tenant_id:
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
    current_user: User = Depends(require_active_subscription),
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
    current_user: User = Depends(require_active_subscription),
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
async def get_kyc_status(db: Session = Depends(get_db), current_user: User = Depends(require_active_subscription)):
    return await KYCService().get_kyc_status(db, str(current_user.id))


@router.get('/admin/pending')
def list_pending_kyc(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """Return all KYC submissions awaiting admin review."""
    items = []
    for row in (
        db.query(KYCSubmission)
        .filter(KYCSubmission.status.in_([KYCStatus.pending, KYCStatus.queried]))
        .order_by(KYCSubmission.created_at.asc())
        .all()
    ):
        items.append({
            'id': str(row.id),
            'user_id': str(row.user_id),
            'status': row.status.value,
            'id_type': row.id_type,
            'id_number': row.id_number,
            'full_name': row.full_name,
            'id_front_url': row.id_front_url or row.id_document_url,
            'id_back_url': row.id_back_url,
            'liveness_photo_url': row.liveness_photo_url,
            'liveness_video_url': row.liveness_video_url,
            'admin_note': row.admin_note,
            'created_at': row.created_at,
            'updated_at': row.updated_at,
        })
    return items


@router.get('/admin/list')
def list_kyc_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    items = []
    for row in db.query(KYCSubmission).order_by(KYCSubmission.updated_at.desc()).all():
        items.append(
            {
                'id': str(row.id),
                'user_id': str(row.user_id),
                'status': row.status.value,
                'id_type': row.id_type,
                'id_number': row.id_number,
                'full_name': row.full_name,
                'id_front_url': row.id_front_url or row.id_document_url,
                'id_back_url': row.id_back_url,
                'liveness_photo_url': row.liveness_photo_url,
                'liveness_video_url': row.liveness_video_url,
                'admin_note': row.admin_note,
                'reviewed_at': row.reviewed_at,
                'created_at': row.created_at,
                'updated_at': row.updated_at,
            }
        )
    return items


@router.post('/{submission_id}/review')
def review_kyc_submission(
    submission_id: str,
    action: str,           # approve | reject | query
    admin_note: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """Admin review: approve, reject, or query a KYC submission."""
    valid_actions = {'approve', 'reject', 'query'}
    if action not in valid_actions:
        raise HTTPException(status_code=400, detail=f'action must be one of {sorted(valid_actions)}')

    row = db.query(KYCSubmission).filter_by(id=uuid.UUID(submission_id)).first()
    if not row:
        raise HTTPException(status_code=404, detail='KYC submission not found')

    status_map = {'approve': KYCStatus.approved, 'reject': KYCStatus.rejected, 'query': KYCStatus.queried}
    row.status = status_map[action]
    row.admin_note = admin_note or None
    row.reviewed_by = current_user.id
    row.reviewed_at = datetime.utcnow()
    db.commit()
    return {'submission_id': submission_id, 'status': row.status.value, 'admin_note': row.admin_note}


@router.post('/admin/approve/{kyc_id}')
def approve_kyc_submission(
    kyc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    row = db.query(KYCSubmission).filter_by(id=uuid.UUID(kyc_id)).first()
    if not row:
        raise HTTPException(status_code=404, detail='KYC submission not found')
    row.status = KYCStatus.approved
    row.reviewed_by = current_user.id
    row.reviewed_at = datetime.utcnow()
    db.commit()
    return {'status': 'approved'}


@router.post('/admin/revoke/{kyc_id}')
def revoke_kyc_submission(
    kyc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    row = db.query(KYCSubmission).filter_by(id=uuid.UUID(kyc_id)).first()
    if not row:
        raise HTTPException(status_code=404, detail='KYC submission not found')
    row.status = KYCStatus.rejected
    row.reviewed_by = current_user.id
    row.reviewed_at = datetime.utcnow()
    db.commit()
    return {'status': 'revoked'}


@router.post('/ocr-parse')
async def ocr_parse_id(
    id_image: UploadFile = File(...),
    current_user: User = Depends(require_active_subscription),
):
    """
    Accept an ID document image and attempt to extract:
      full_name, id_number, date_of_birth, nationality
    Uses pytesseract if available; falls back to regex heuristics.
    Returns empty strings for fields that could not be extracted.
    """
    import re
    content = await id_image.read()
    text = ''

    # Try pytesseract OCR
    try:
        import pytesseract
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(content))
        text = pytesseract.image_to_string(img)
    except Exception:
        pass  # pytesseract not available or failed — fall back to heuristics

    result = {
        'full_name': '',
        'id_number': '',
        'date_of_birth': '',
        'nationality': '',
        'raw_text': text[:500] if text else '',
        'ocr_available': bool(text),
    }

    if text:
        lines = [l.strip() for l in text.splitlines() if l.strip()]

        # Ghana Card: GHA-XXXXXXXXXX-X
        ghana_card = re.search(r'GHA-[A-Z0-9]{9,12}-\d', text, re.IGNORECASE)
        if ghana_card:
            result['id_number'] = ghana_card.group(0).upper()
            result['nationality'] = 'Ghanaian'

        # Passport number: letter + 7-8 digits
        if not result['id_number']:
            passport = re.search(r'\b[A-Z]{1,2}\d{7,8}\b', text)
            if passport:
                result['id_number'] = passport.group(0)

        # Date patterns: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
        dob_match = re.search(
            r'\b(\d{2}[\/\-]\d{2}[\/\-]\d{4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})\b', text
        )
        if dob_match:
            result['date_of_birth'] = dob_match.group(0)

        # Name: look for lines with 2–4 capitalised words after keywords
        name_keywords = ['name', 'surname', 'given name', 'full name']
        for i, line in enumerate(lines):
            if any(kw in line.lower() for kw in name_keywords):
                # Take the next non-empty line as the name
                for j in range(i + 1, min(i + 3, len(lines))):
                    candidate = lines[j]
                    if re.match(r'^[A-Z][a-zA-Z]+(\s[A-Z][a-zA-Z]+)+$', candidate):
                        result['full_name'] = candidate
                        break

        # Nationality from text
        nations = ['ghanaian', 'kenyan', 'nigerian', 'south african', 'ugandan',
                   'tanzanian', 'zimbabwean', 'zambian', 'cameroonian']
        for nation in nations:
            if nation in text.lower():
                result['nationality'] = nation.capitalize()
                break

    return result
