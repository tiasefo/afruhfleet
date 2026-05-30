from __future__ import annotations
from app.core.config import settings
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from pydantic import ValidationError
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, require_superuser
from app.db.session import get_db
from app.models.user import User
from app.schemas.vendor import AutoDispatchRequest, AutoDispatchResponse, BookingCreateRequest, BookingDecisionRequest, BookingResponse, BookingUpdateRequest, VendorAvailabilityResponse, VendorAvailabilityUpdateRequest, VendorDocumentResponse, VendorDocumentSubmitResponse, VendorMatchRequest, VendorMatchResult, VendorRegisterRequest, VendorRegisterResponse, VendorResponse, VendorReviewRequest, VendorSearchResult, VendorVehicleResponse
from app.services.billing_service import consume_wallet_credits, evaluate_subscription_state, feature_credit_cost, feature_enabled_for_plan
from app.services.storage_service import storage_service
from app.services.vendor_service import add_vendor_document, auto_dispatch_booking, create_booking, get_booking, get_vendor, get_vendor_by_email, list_bookings, list_vendors, register_vendor, review_vendor, search_marketplace, suggest_vendors_for_pickup, suspend_vendor, update_booking, update_vendor_availability, vendor_decide_booking
from app.middleware.rate_limit import rate_limit
router = APIRouter(prefix='/vendors', tags=['Delivery Vendors'])

@router.post('/register', response_model=VendorRegisterResponse)
@rate_limit(category='public', rule='vendor_register')
async def register_vendor_route(request: Request, db: Session=Depends(get_db)):
    try:
        payload = VendorRegisterRequest.model_validate(await request.json())
        vendor = register_vendor(db, full_name=payload.full_name, email=payload.email, phone=payload.phone, id_type=payload.id_type, id_number=payload.id_number, vehicle_types=payload.vehicle_types, vehicle_reg_number=payload.vehicle_reg_number, vehicle_model=payload.vehicle_model, vehicle_year=payload.vehicle_year, business_name=payload.business_name, business_type=payload.business_type, operating_regions=payload.operating_regions, years_experience=payload.years_experience, terms_accepted=payload.terms_accepted, insurance_accepted=payload.insurance_accepted, background_check_accepted=payload.background_check_accepted)
        return VendorRegisterResponse(id=str(vendor.id), full_name=vendor.full_name, email=vendor.email, phone=vendor.phone, status=vendor.status.value, message='Registration submitted successfully. Our team will review your application within 2-3 business days.')
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.get('/admin', response_model=dict)
def list_vendors_admin(status: str | None=Query(None), q: str | None=Query(None), page: int=Query(1, ge=1), page_size: int=Query(20, ge=1, le=100), db: Session=Depends(get_db), current_user: User=Depends(require_superuser)):
    (items, total) = list_vendors(db, status=status, query=q, page=page, page_size=page_size)
    pages = max(1, (total + page_size - 1) // page_size)
    return {'items': [_to_response(v).model_dump(mode='json') for v in items], 'total': total, 'page': page, 'page_size': page_size, 'pages': pages}

@router.get('/admin/{vendor_id}', response_model=VendorResponse)
def get_vendor_admin(vendor_id: str, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)):
    vendor = get_vendor(db, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail='Vendor not found')
    return _to_response(vendor)

@router.post('/admin/{vendor_id}/review', response_model=VendorResponse)
def review_vendor_route(vendor_id: str, payload: VendorReviewRequest, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)):
    try:
        vendor = review_vendor(db, vendor_id, action=payload.action, reviewed_by=current_user.email, rejection_reason=payload.rejection_reason)
        if not vendor:
            raise HTTPException(status_code=404, detail='Vendor not found')
        return _to_response(vendor)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.post('/admin/{vendor_id}/suspend', response_model=VendorResponse)
def suspend_vendor_route(vendor_id: str, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)):
    vendor = suspend_vendor(db, vendor_id, reviewed_by=current_user.email)
    if not vendor:
        raise HTTPException(status_code=404, detail='Vendor not found')
    return _to_response(vendor)


@router.post('/admin/{vendor_id}/documents', response_model=VendorResponse)
async def upload_vendor_documents_route(
    vendor_id: str,
    id_front: UploadFile | None = File(None),
    id_back: UploadFile | None = File(None),
    selfie_photo: UploadFile | None = File(None),
    insurance_doc: UploadFile | None = File(None),
    roadworthy_doc: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    raise HTTPException(
        status_code=400,
        detail='Admin upload is disabled. Vendors must upload their own real documents; admin only reviews submissions.',
    )


@router.post('/me/documents', response_model=VendorDocumentSubmitResponse)
async def submit_my_vendor_documents_route(
    id_front: UploadFile | None = File(None),
    id_back: UploadFile | None = File(None),
    selfie_photo: UploadFile | None = File(None),
    insurance_doc: UploadFile | None = File(None),
    roadworthy_doc: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tenant_id = str(getattr(current_user, 'tenant_id', '') or '')
    if not tenant_id:
        raise HTTPException(status_code=400, detail='Tenant context required for vendor document uploads')

    sub = evaluate_subscription_state(db, tenant_id)
    if not sub:
        raise HTTPException(status_code=402, detail='No active subscription found for tenant')
    if not feature_enabled_for_plan(sub.plan_code.value, 'vendor_ops'):
        raise HTTPException(status_code=403, detail='Current plan does not include vendor operations workflows')

    vendor = get_vendor_by_email(db, current_user.email)
    if not vendor:
        raise HTTPException(status_code=404, detail='No vendor profile found for this user email')

    tenant_scope = str(getattr(current_user, 'tenant_id', None) or 'platform')
    uploads = {
        'id_front': id_front,
        'id_back': id_back,
        'selfie_photo': selfie_photo,
        'insurance_doc': insurance_doc,
        'roadworthy_doc': roadworthy_doc,
    }
    uploaded_documents: list[VendorDocumentResponse] = []

    for document_type, upload in uploads.items():
        if not upload:
            continue
        suffix = Path(upload.filename or '').suffix or '.bin'
        storage_path = f'vendor-docs/{vendor.id}/{document_type}{suffix}'
        file_url = storage_service.upload(
            tenant_id=tenant_scope,
            path=storage_path,
            data=upload.file,
            content_type=upload.content_type or 'application/octet-stream',
        )
        row = add_vendor_document(db, str(vendor.id), document_type=document_type, file_url=file_url)
        uploaded_documents.append(
            VendorDocumentResponse(
                id=str(row.id),
                document_type=row.document_type,
                file_url=row.file_url,
                created_at=row.created_at,
            )
        )

    if not uploaded_documents:
        raise HTTPException(status_code=400, detail='At least one document must be uploaded')

    per_document_cost = feature_credit_cost('vendor_document_upload')
    total_cost = per_document_cost * len(uploaded_documents)
    if total_cost > 0:
        try:
            consume_wallet_credits(
                db,
                tenant_id=tenant_id,
                usage_type='document_processing',
                credits=total_cost,
                memo=f'Vendor document upload ({len(uploaded_documents)} files)',
            )
        except ValueError as exc:
            raise HTTPException(status_code=402, detail=str(exc)) from exc

    db.refresh(vendor)
    return VendorDocumentSubmitResponse(
        vendor_id=str(vendor.id),
        status=vendor.status.value,
        uploaded_documents=uploaded_documents,
        message='Documents submitted. Admin will review real photos/documents in console.',
    )


@router.patch('/me/availability', response_model=VendorAvailabilityResponse)
def update_my_availability_route(
    payload: VendorAvailabilityUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vendor = get_vendor_by_email(db, current_user.email)
    if not vendor:
        raise HTTPException(status_code=404, detail='No vendor profile found for this user email')

    try:
        vendor = update_vendor_availability(
            db,
            str(vendor.id),
            availability_status=payload.availability_status,
            current_location=payload.current_location,
            current_latitude=payload.current_latitude,
            current_longitude=payload.current_longitude,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return VendorAvailabilityResponse(
        vendor_id=str(vendor.id),
        availability_status=vendor.availability_status.value,
        current_location=vendor.last_known_location,
        current_latitude=float(vendor.last_known_latitude) if vendor.last_known_latitude is not None else None,
        current_longitude=float(vendor.last_known_longitude) if vendor.last_known_longitude is not None else None,
        availability_updated_at=vendor.availability_updated_at,
    )

@router.get('/marketplace', response_model=dict)
def search_vendor_marketplace(region: str | None=Query(None), vehicle_type: str | None=Query(None), q: str | None=Query(None), page: int=Query(1, ge=1), page_size: int=Query(20, ge=1, le=100), db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    (items, total) = search_marketplace(db, region=region, vehicle_type=vehicle_type, query=q, page=page, page_size=page_size)
    pages = max(1, (total + page_size - 1) // page_size)
    return {'items': [_to_search_result(v).model_dump() for v in items], 'total': total, 'page': page, 'page_size': page_size, 'pages': pages}

@router.get('/marketplace/{vendor_id}', response_model=VendorResponse)
def get_marketplace_vendor(vendor_id: str, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    vendor = get_vendor(db, vendor_id)
    if not vendor or vendor.status.value != 'approved':
        raise HTTPException(status_code=404, detail='Vendor not found')
    return _to_response(vendor)


@router.post('/{tenant_id}/marketplace/match', response_model=list[VendorMatchResult])
def suggest_marketplace_matches(
    tenant_id: str,
    payload: VendorMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    matches = suggest_vendors_for_pickup(
        db,
        pickup_address=payload.pickup_address,
        pickup_latitude=payload.pickup_latitude,
        pickup_longitude=payload.pickup_longitude,
        vehicle_type=payload.vehicle_type,
        region=payload.region,
        limit=payload.limit,
    )
    return [VendorMatchResult(**m) for m in matches]


@router.post('/{tenant_id}/dispatch/auto', response_model=AutoDispatchResponse)
def auto_dispatch_route(
    tenant_id: str,
    payload: AutoDispatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = auto_dispatch_booking(
            db,
            tenant_id=tenant_id,
            shipment_id=payload.shipment_id,
            pickup_address=payload.pickup_address,
            delivery_address=payload.delivery_address,
            pickup_latitude=payload.pickup_latitude,
            pickup_longitude=payload.pickup_longitude,
            vehicle_type_requested=payload.vehicle_type_requested,
            region=payload.region,
            notes=payload.notes,
            candidate_limit=payload.candidate_limit,
            booked_by=current_user.email,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return AutoDispatchResponse(
        booking=_booking_to_response(result['booking']),
        selected_vendor=VendorMatchResult(**result['selected_vendor']),
        fallback_candidates=[VendorMatchResult(**item) for item in result['fallback_candidates']],
    )

@router.post('/{tenant_id}/bookings', response_model=BookingResponse)
def create_booking_route(tenant_id: str, payload: BookingCreateRequest, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    try:
        booking = create_booking(db, tenant_id, payload.vendor_id, shipment_id=payload.shipment_id, pickup_address=payload.pickup_address, delivery_address=payload.delivery_address, vehicle_type_requested=payload.vehicle_type_requested, notes=payload.notes, booked_by=current_user.email)
        return _booking_to_response(booking)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.get('/{tenant_id}/bookings', response_model=dict)
def list_tenant_bookings(tenant_id: str, status: str | None=Query(None), page: int=Query(1, ge=1), page_size: int=Query(20, ge=1, le=100), db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    (items, total) = list_bookings(db, tenant_id=tenant_id, status=status, page=page, page_size=page_size)
    pages = max(1, (total + page_size - 1) // page_size)
    return {'items': [_booking_to_response(b).model_dump(mode='json') for b in items], 'total': total, 'page': page, 'page_size': page_size, 'pages': pages}


@router.get('/me/bookings', response_model=dict)
def list_my_bookings(
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vendor = get_vendor_by_email(db, current_user.email)
    if not vendor:
        raise HTTPException(status_code=404, detail='No vendor profile found for this user email')
    items, total = list_bookings(db, vendor_id=str(vendor.id), status=status, page=page, page_size=page_size)
    pages = max(1, (total + page_size - 1) // page_size)
    return {'items': [_booking_to_response(b).model_dump(mode='json') for b in items], 'total': total, 'page': page, 'page_size': page_size, 'pages': pages}

@router.get('/{tenant_id}/bookings/{booking_id}', response_model=BookingResponse)
def get_booking_route(tenant_id: str, booking_id: str, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    booking = get_booking(db, booking_id)
    if not booking or str(booking.tenant_id) != tenant_id:
        raise HTTPException(status_code=404, detail='Booking not found')
    return _booking_to_response(booking)

@router.patch('/{tenant_id}/bookings/{booking_id}', response_model=BookingResponse)
def update_booking_route(tenant_id: str, booking_id: str, payload: BookingUpdateRequest, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    existing = get_booking(db, booking_id)
    if not existing or str(existing.tenant_id) != tenant_id:
        raise HTTPException(status_code=404, detail='Booking not found')
    booking = update_booking(db, booking_id, **payload.model_dump(exclude_unset=True))
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    return _booking_to_response(booking)


@router.post('/me/bookings/{booking_id}/accept', response_model=BookingResponse)
def accept_my_booking_route(
    booking_id: str,
    payload: BookingDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vendor = get_vendor_by_email(db, current_user.email)
    if not vendor:
        raise HTTPException(status_code=404, detail='No vendor profile found for this user email')
    try:
        booking = vendor_decide_booking(db, booking_id, vendor_id=str(vendor.id), accept=True, note=payload.note)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    return _booking_to_response(booking)


@router.post('/me/bookings/{booking_id}/reject', response_model=BookingResponse)
def reject_my_booking_route(
    booking_id: str,
    payload: BookingDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vendor = get_vendor_by_email(db, current_user.email)
    if not vendor:
        raise HTTPException(status_code=404, detail='No vendor profile found for this user email')
    try:
        booking = vendor_decide_booking(db, booking_id, vendor_id=str(vendor.id), accept=False, note=payload.note)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    return _booking_to_response(booking)

def _to_response(v) -> VendorResponse:
    regions = v.operating_regions.split(',') if v.operating_regions else []
    return VendorResponse(id=str(v.id), full_name=v.full_name, email=v.email, phone=v.phone, id_type=v.id_type.value, id_number=v.id_number, business_name=v.business_name, business_type=v.business_type.value, operating_regions=[r.strip() for r in regions if r.strip()], years_experience=v.years_experience, status=v.status.value, availability_status=v.availability_status.value, availability_updated_at=v.availability_updated_at, last_known_location=v.last_known_location, last_known_latitude=float(v.last_known_latitude) if v.last_known_latitude is not None else None, last_known_longitude=float(v.last_known_longitude) if v.last_known_longitude is not None else None, last_seen_at=v.last_seen_at, average_rating=float(v.average_rating), total_deliveries=v.total_deliveries, vehicles=[VendorVehicleResponse(id=str(veh.id), vehicle_type=veh.vehicle_type.value, registration_number=veh.registration_number, make_model=veh.make_model, year=veh.year, insurance_doc_url=veh.insurance_doc_url, roadworthy_doc_url=veh.roadworthy_doc_url, is_active=veh.is_active) for veh in v.vehicles or []], documents=[VendorDocumentResponse(id=str(doc.id), document_type=doc.document_type, file_url=doc.file_url, created_at=doc.created_at) for doc in v.documents or []], terms_accepted=v.terms_accepted, insurance_accepted=v.insurance_accepted, background_check_accepted=v.background_check_accepted, reviewed_by=v.reviewed_by, reviewed_at=v.reviewed_at, rejection_reason=v.rejection_reason, created_at=v.created_at, updated_at=v.updated_at)

def _to_search_result(v) -> VendorSearchResult:
    regions = v.operating_regions.split(',') if v.operating_regions else []
    vtypes = list({veh.vehicle_type.value for veh in v.vehicles or [] if veh.is_active})
    return VendorSearchResult(id=str(v.id), full_name=v.full_name, business_name=v.business_name, business_type=v.business_type.value, operating_regions=[r.strip() for r in regions if r.strip()], vehicle_types=vtypes, average_rating=float(v.average_rating), total_deliveries=v.total_deliveries)

def _booking_to_response(b) -> BookingResponse:
    return BookingResponse(id=str(b.id), tenant_id=str(b.tenant_id), vendor_id=str(b.vendor_id), vendor_name=b.vendor.full_name if b.vendor else '', shipment_id=str(b.shipment_id) if b.shipment_id else None, status=b.status.value, pickup_address=b.pickup_address, delivery_address=b.delivery_address, vehicle_type_requested=b.vehicle_type_requested.value if b.vehicle_type_requested else None, driver_name=b.driver_name, driver_phone=b.driver_phone, current_location=b.current_location, current_latitude=float(b.current_latitude) if b.current_latitude is not None else None, current_longitude=float(b.current_longitude) if b.current_longitude is not None else None, last_location_at=b.last_location_at, live_tracking_provider=b.live_tracking_provider, notes=b.notes, credit_cost=b.credit_cost, currency=b.currency, tenant_rating=b.tenant_rating, tenant_review=b.tenant_review, booked_by=b.booked_by, offered_at=b.offered_at, offer_expires_at=b.offer_expires_at, responded_at=b.responded_at, accepted_at=b.accepted_at, started_at=b.started_at, completed_at=b.completed_at, canceled_at=b.canceled_at, created_at=b.created_at, updated_at=b.updated_at)