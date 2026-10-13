from __future__ import annotations
from app.core.config import settings
import logging
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, require_superuser, require_active_subscription, require_vendor, require_approved_vendor, VendorContext
from app.db.session import get_db
from app.models.user import User
from app.schemas.vendor import AutoDispatchRequest, AutoDispatchResponse, BookingCreateRequest, BookingDecisionRequest, BookingResponse, BookingUpdateRequest, VendorAvailabilityResponse, VendorAvailabilityUpdateRequest, VendorDocumentResponse, VendorDocumentSubmitResponse, VendorMatchRequest, VendorMatchResult, VendorRegisterRequest, VendorRegisterResponse, VendorResponse, VendorReviewRequest, VendorSearchResult, VendorVehicleResponse, VendorInvitationAcceptRequest
from app.services.billing_service import consume_wallet_credits, evaluate_subscription_state, feature_credit_cost, feature_enabled_for_plan
from app.services.storage_service import storage_service
from app.services.vendor_service import add_vendor_document, auto_dispatch_booking, create_booking, get_booking, get_vendor, get_vendor_by_email, list_bookings, list_vendors, register_vendor, review_vendor, search_marketplace, suggest_vendors_for_pickup, suspend_vendor, update_booking, update_vendor_availability, vendor_decide_booking
from app.middleware.rate_limit import rate_limit

_VALID_ID_TYPES = {"ghana_card", "passport", "voter_id", "drivers_license"}
_ID_TYPE_ALIASES = {
    "national_id": "ghana_card",
    "national_card": "ghana_card",
    "ghana_national_id": "ghana_card",
    "driver_license": "drivers_license",
    "driver's_license": "drivers_license",
    "drivers license": "drivers_license",
}

_VALID_VEHICLE_TYPES = {"truck", "car", "motorbike", "bicycle"}
_VEHICLE_TYPE_ALIASES = {
    "van": "truck",
    "lorry": "truck",
    "motorcycle": "motorbike",
    "motor_cycle": "motorbike",
    "bike": "motorbike",
    "cycle": "bicycle",
}

_VALID_BUSINESS_TYPES = {"individual", "registered", "fleet"}
_BUSINESS_TYPE_ALIASES = {
    "company": "registered",
    "corporate": "registered",
    "business": "registered",
    "sole_proprietor": "individual",
    "sole_trader": "individual",
}

logger = logging.getLogger("afruheritage.vendors")
router = APIRouter(prefix='/vendors', tags=['Delivery Vendors'])

@router.post('/register', response_model=VendorRegisterResponse)
@rate_limit(category='public', rule='vendor_register')
async def register_vendor_route(request: Request, db: Session=Depends(get_db)):
    try:
        payload = VendorRegisterRequest.model_validate(await request.json())

        # Normalise id_type — map common aliases to valid enum values so that
        # callers sending "national_id" or other variants don't get a hard 500
        # from SQLAlchemy trying to persist an invalid PostgreSQL enum value.
        normalised_id_type = _ID_TYPE_ALIASES.get(
            (payload.id_type or "").lower().strip(),
            (payload.id_type or "").lower().strip(),
        )
        if normalised_id_type not in _VALID_ID_TYPES:
            raise HTTPException(
                status_code=422,
                detail={
                    "field": "id_type",
                    "error": f"'{payload.id_type}' is not a valid ID type.",
                    "valid_values": sorted(_VALID_ID_TYPES),
                },
            )

        # Normalise vehicle types
        normalised_vehicle_types = []
        for vt in payload.vehicle_types:
            nv = _VEHICLE_TYPE_ALIASES.get(vt.lower().strip(), vt.lower().strip())
            if nv not in _VALID_VEHICLE_TYPES:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "field": "vehicle_types",
                        "error": f"'{vt}' is not a valid vehicle type.",
                        "valid_values": sorted(_VALID_VEHICLE_TYPES),
                    },
                )
            normalised_vehicle_types.append(nv)

        # Normalise business_type
        normalised_business_type = _BUSINESS_TYPE_ALIASES.get(
            (payload.business_type or "individual").lower().strip(),
            (payload.business_type or "individual").lower().strip(),
        )
        if normalised_business_type not in _VALID_BUSINESS_TYPES:
            raise HTTPException(
                status_code=422,
                detail={
                    "field": "business_type",
                    "error": f"'{payload.business_type}' is not a valid business type.",
                    "valid_values": sorted(_VALID_BUSINESS_TYPES),
                },
            )

        vendor = register_vendor(
            db,
            full_name=payload.full_name,
            email=payload.email,
            phone=payload.phone,
            id_type=normalised_id_type,
            id_number=payload.id_number,
            vehicle_types=normalised_vehicle_types,
            vehicle_reg_number=payload.vehicle_reg_number,
            vehicle_model=payload.vehicle_model,
            vehicle_year=payload.vehicle_year,
            business_name=payload.business_name,
            business_type=normalised_business_type,
            operating_regions=payload.operating_regions,
            years_experience=payload.years_experience,
            terms_accepted=payload.terms_accepted,
            insurance_accepted=payload.insurance_accepted,
            background_check_accepted=payload.background_check_accepted,
        )
        return VendorRegisterResponse(
            id=str(vendor.id),
            full_name=vendor.full_name,
            email=vendor.email,
            phone=vendor.phone,
            status=vendor.status.value,
            message='Registration submitted successfully. Our team will review your application within 2-3 business days.',
        )
    except HTTPException:
        raise
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("DB error during vendor registration")
        raise HTTPException(status_code=500, detail="Database error during registration. Please try again.") from exc
    except Exception as exc:
        db.rollback()
        logger.exception("Unexpected error during vendor registration")
        raise HTTPException(status_code=500, detail="Unexpected error during registration. Please try again.") from exc

# ── Vendor membership administration (PO D-01) ─────────────────
# Explicit vendor↔identity linkage. Memberships are NEVER auto-created from
# matching emails — an admin must link a verified platform user account.

from pydantic import BaseModel, EmailStr


class VendorMemberLinkRequest(BaseModel):
    user_email: EmailStr
    role: str = "owner"


def _member_to_response(m) -> dict:
    return {
        'id': str(m.id),
        'vendor_id': str(m.vendor_id),
        'user_id': str(m.user_id),
        'role': m.role.value,
        'status': m.status.value,
        'linked_by': m.linked_by,
        'created_at': m.created_at.isoformat() if m.created_at else None,
    }


@router.get('/admin/{vendor_id}/members', response_model=list)
def list_vendor_members(
    vendor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    from app.models.vendor import VendorMembership
    from app.api.params import uuid_or_400

    vid = uuid_or_400(vendor_id, 'vendor_id')
    if not get_vendor(db, str(vid)):
        raise HTTPException(status_code=404, detail='Vendor not found')
    members = db.query(VendorMembership).filter(VendorMembership.vendor_id == vid).all()
    return [_member_to_response(m) for m in members]


@router.post('/admin/{vendor_id}/members', response_model=dict)
def link_vendor_member(
    vendor_id: str,
    payload: VendorMemberLinkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    from app.models.vendor import VendorMembership, VendorMembershipRole, VendorMembershipStatus
    from app.api.params import uuid_or_400

    vid = uuid_or_400(vendor_id, 'vendor_id')
    vendor = get_vendor(db, str(vid))
    if not vendor:
        raise HTTPException(status_code=404, detail='Vendor not found')
    try:
        role = VendorMembershipRole(payload.role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {payload.role}")

    import secrets as _secrets
    from datetime import datetime as _dt, timedelta as _td, timezone as _tz

    invited = False
    user = db.query(User).filter(User.email == payload.user_email.lower()).first()
    if not user:
        # PO Gate A-2: invited-created platform identity. The account starts
        # password-less (must_reset_password) and the membership starts
        # INVITED — vendor access requires ACTIVE (app/api/deps.py), so the
        # account grants nothing until the emailed invitation is accepted.
        from app.models.user import UserRole
        from app.core.security import get_password_hash

        user = User(
            email=payload.user_email.lower(),
            full_name=payload.user_email.split('@')[0],
            hashed_password=get_password_hash(_secrets.token_urlsafe(32)),
            is_superuser=False,
            is_tenant_admin=False,
            is_active=True,
            role=UserRole.vendor,
            tenant_id=None,
            must_reset_password=True,
        )
        db.add(user)
        db.flush()
        invited = True

    membership = (
        db.query(VendorMembership)
        .filter(VendorMembership.vendor_id == vid, VendorMembership.user_id == user.id)
        .first()
    )
    if membership and membership.status == VendorMembershipStatus.ACTIVE:
        # Existing ACTIVE membership: role management only — never re-issue
        # an invitation for a live membership.
        membership.role = role
        membership.linked_by = current_user.email
    else:
        # New, INVITED or SUSPENDED membership → (re)issue a membership-bound,
        # single-use, expiring invitation. Applies identically to existing
        # platform users: their account is NOT silently activated into a
        # vendor context and their primary role is never touched.
        token = _secrets.token_urlsafe(32)
        if not membership:
            membership = VendorMembership(
                vendor_id=vid,
                user_id=user.id,
                role=role,
                status=VendorMembershipStatus.INVITED,
                linked_by=current_user.email,
            )
            db.add(membership)
        else:
            membership.role = role
            membership.status = VendorMembershipStatus.INVITED
            membership.linked_by = current_user.email
        membership.invitation_token = token
        membership.invitation_expires_at = _dt.now(_tz.utc) + _td(hours=72)
        invited = True
        try:
            from app.services.notification_service import get_notification_service
            accept_url = f"{settings.web_url.rstrip('/')}/vendor-accept?token={token}"
            get_notification_service(db).send_team_invitation_email(
                to=user.email,
                setup_url=accept_url,
                company_name="Afruheritage",
                inviter_name=current_user.email,
            )
        except Exception as exc:
            logger.error("Vendor invitation email failed for %s: %s", user.email, exc)
    db.commit()
    db.refresh(membership)
    return {**_member_to_response(membership), 'account_invited': invited}


@router.post('/invitations/accept', response_model=dict)
def accept_vendor_invitation(
    payload: VendorInvitationAcceptRequest,
    db: Session = Depends(get_db),
):
    """PO Gate A-2: single-use, expiring, membership-bound invitation accept.

    The token lives on the membership row — it can only ever activate that
    one membership, and clearing it on success makes replay impossible.
    """
    from app.models.vendor import VendorMembership, VendorMembershipStatus
    from app.core.security import get_password_hash
    from datetime import datetime as _dt, timezone as _tz

    membership = (
        db.query(VendorMembership)
        .filter(VendorMembership.invitation_token == payload.token)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=404, detail='Invalid invitation token')
    expires_at = membership.invitation_expires_at
    now = _dt.now(_tz.utc)
    if expires_at is None:
        raise HTTPException(status_code=400, detail='Invitation has no expiry')
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=_tz.utc)
    if expires_at < now:
        raise HTTPException(status_code=400, detail='Invitation expired')

    user = db.query(User).filter(User.id == membership.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail='Invited user not found')

    if user.must_reset_password:
        if not payload.new_password or len(payload.new_password) < 8:
            raise HTTPException(
                status_code=400,
                detail='A new password (min 8 characters) is required to activate this account',
            )
        user.hashed_password = get_password_hash(payload.new_password)
        user.must_reset_password = False
        user.is_active = True

    membership.status = VendorMembershipStatus.ACTIVE
    membership.invitation_token = None
    membership.invitation_expires_at = None
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return {'status': 'activated', 'membership': _member_to_response(membership)}


@router.delete('/admin/{vendor_id}/members/{membership_id}', response_model=dict)
def unlink_vendor_member(
    vendor_id: str,
    membership_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    from app.models.vendor import VendorMembership, VendorMembershipStatus
    from app.api.params import uuid_or_400

    vid = uuid_or_400(vendor_id, 'vendor_id')
    mid = uuid_or_400(membership_id, 'membership_id')
    membership = (
        db.query(VendorMembership)
        .filter(VendorMembership.id == mid, VendorMembership.vendor_id == vid)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=404, detail='Membership not found')
    # Suspend rather than hard-delete — preserves the auditable linkage trail.
    membership.status = VendorMembershipStatus.SUSPENDED
    membership.linked_by = current_user.email
    db.commit()
    return _member_to_response(membership)


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
    ctx: VendorContext = Depends(require_vendor),
):
    # PO D-01: vendor identity comes from an explicit active VendorMembership,
    # not from matching the user's email to a vendor record. Vendors are
    # platform participants and do not require a logistics-company
    # subscription; document storage and billing are vendor-scoped, never a
    # tenant's wallet or storage namespace.
    vendor = ctx.vendor
    tenant_scope = f'vendor-{vendor.id}'
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

    # Verification-document submission is a platform cost, not a tenant
    # feature — previously this charged whichever tenant the user belonged
    # to, a cross-account billing bug for platform-global vendors.
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
    ctx: VendorContext = Depends(require_vendor),
):
    vendor = ctx.vendor

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
def search_vendor_marketplace(region: str | None=Query(None), vehicle_type: str | None=Query(None), q: str | None=Query(None), page: int=Query(1, ge=1), page_size: int=Query(20, ge=1, le=100), db: Session=Depends(get_db), current_user: User=Depends(require_active_subscription)):
    (items, total) = search_marketplace(db, region=region, vehicle_type=vehicle_type, query=q, page=page, page_size=page_size)
    pages = max(1, (total + page_size - 1) // page_size)
    return {'items': [_to_search_result(v).model_dump() for v in items], 'total': total, 'page': page, 'page_size': page_size, 'pages': pages}

@router.get('/marketplace/{vendor_id}', response_model=VendorResponse)
def get_marketplace_vendor(vendor_id: str, db: Session=Depends(get_db), current_user: User=Depends(require_active_subscription)):
    vendor = get_vendor(db, vendor_id)
    if not vendor or vendor.status.value != 'approved':
        raise HTTPException(status_code=404, detail='Vendor not found')
    return _to_response(vendor)


@router.post('/{tenant_id}/marketplace/match', response_model=list[VendorMatchResult])
def suggest_marketplace_matches(
    tenant_id: str,
    payload: VendorMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
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
    current_user: User = Depends(require_active_subscription),
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
def create_booking_route(tenant_id: str, payload: BookingCreateRequest, db: Session=Depends(get_db), current_user: User=Depends(require_active_subscription)):
    try:
        booking = create_booking(db, tenant_id, payload.vendor_id, shipment_id=payload.shipment_id, pickup_address=payload.pickup_address, delivery_address=payload.delivery_address, vehicle_type_requested=payload.vehicle_type_requested, notes=payload.notes, booked_by=current_user.email)
        return _booking_to_response(booking)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

# /me routes must be declared BEFORE /{tenant_id} wildcards — otherwise
# "me" binds to {tenant_id} and get_current_user rejects it as a bogus tenant.
@router.get('/me', response_model=dict)
def get_my_vendor_profile(
    db: Session = Depends(get_db),
    ctx: VendorContext = Depends(require_vendor),
):
    """Vendor self-view: profile + membership, without internal admin fields."""
    vendor = ctx.vendor
    return {
        'vendor': _to_self_response(vendor).model_dump(mode='json'),
        'membership': {
            'role': ctx.membership.role.value,
            'status': ctx.membership.status.value,
            'linked_at': ctx.membership.created_at.isoformat() if ctx.membership.created_at else None,
        },
    }


@router.get('/me/bookings', response_model=dict)
def list_my_bookings(
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx: VendorContext = Depends(require_approved_vendor),
):
    vendor = ctx.vendor
    items, total = list_bookings(db, vendor_id=str(vendor.id), status=status, page=page, page_size=page_size)
    pages = max(1, (total + page_size - 1) // page_size)
    return {'items': [_booking_to_vendor_response(b).model_dump(mode='json') for b in items], 'total': total, 'page': page, 'page_size': page_size, 'pages': pages}


@router.get('/{tenant_id}/bookings', response_model=dict)
def list_tenant_bookings(tenant_id: str, status: str | None=Query(None), page: int=Query(1, ge=1), page_size: int=Query(20, ge=1, le=100), db: Session=Depends(get_db), current_user: User=Depends(require_active_subscription)):
    (items, total) = list_bookings(db, tenant_id=tenant_id, status=status, page=page, page_size=page_size)
    pages = max(1, (total + page_size - 1) // page_size)
    return {'items': [_booking_to_response(b).model_dump(mode='json') for b in items], 'total': total, 'page': page, 'page_size': page_size, 'pages': pages}


@router.get('/{tenant_id}/bookings/{booking_id}', response_model=BookingResponse)
def get_booking_route(tenant_id: str, booking_id: str, db: Session=Depends(get_db), current_user: User=Depends(require_active_subscription)):
    booking = get_booking(db, booking_id)
    if not booking or str(booking.tenant_id) != tenant_id:
        raise HTTPException(status_code=404, detail='Booking not found')
    return _booking_to_response(booking)

@router.patch('/{tenant_id}/bookings/{booking_id}', response_model=BookingResponse)
def update_booking_route(tenant_id: str, booking_id: str, payload: BookingUpdateRequest, db: Session=Depends(get_db), current_user: User=Depends(require_active_subscription)):
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
    ctx: VendorContext = Depends(require_approved_vendor),
):
    vendor = ctx.vendor
    try:
        booking = vendor_decide_booking(db, booking_id, vendor_id=str(vendor.id), accept=True, note=payload.note)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    return _booking_to_vendor_response(booking)


@router.post('/me/bookings/{booking_id}/reject', response_model=BookingResponse)
def reject_my_booking_route(
    booking_id: str,
    payload: BookingDecisionRequest,
    db: Session = Depends(get_db),
    ctx: VendorContext = Depends(require_approved_vendor),
):
    vendor = ctx.vendor
    try:
        booking = vendor_decide_booking(db, booking_id, vendor_id=str(vendor.id), accept=False, note=payload.note)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not booking:
        raise HTTPException(status_code=404, detail='Booking not found')
    return _booking_to_vendor_response(booking)

def _to_response(v) -> VendorResponse:
    regions = v.operating_regions.split(',') if v.operating_regions else []
    return VendorResponse(id=str(v.id), full_name=v.full_name, email=v.email, phone=v.phone, id_type=v.id_type.value, id_number=v.id_number, business_name=v.business_name, business_type=v.business_type.value, operating_regions=[r.strip() for r in regions if r.strip()], years_experience=v.years_experience, status=v.status.value, availability_status=v.availability_status.value, availability_updated_at=v.availability_updated_at, last_known_location=v.last_known_location, last_known_latitude=float(v.last_known_latitude) if v.last_known_latitude is not None else None, last_known_longitude=float(v.last_known_longitude) if v.last_known_longitude is not None else None, last_seen_at=v.last_seen_at, average_rating=float(v.average_rating), total_deliveries=v.total_deliveries, vehicles=[VendorVehicleResponse(id=str(veh.id), vehicle_type=veh.vehicle_type.value, registration_number=veh.registration_number, make_model=veh.make_model, year=veh.year, insurance_doc_url=veh.insurance_doc_url, roadworthy_doc_url=veh.roadworthy_doc_url, is_active=veh.is_active) for veh in v.vehicles or []], documents=[VendorDocumentResponse(id=str(doc.id), document_type=doc.document_type, file_url=doc.file_url, created_at=doc.created_at) for doc in v.documents or []], terms_accepted=v.terms_accepted, insurance_accepted=v.insurance_accepted, background_check_accepted=v.background_check_accepted, reviewed_by=v.reviewed_by, reviewed_at=v.reviewed_at, rejection_reason=v.rejection_reason, created_at=v.created_at, updated_at=v.updated_at)

def _to_search_result(v) -> VendorSearchResult:
    regions = v.operating_regions.split(',') if v.operating_regions else []
    vtypes = list({veh.vehicle_type.value for veh in v.vehicles or [] if veh.is_active})
    return VendorSearchResult(id=str(v.id), full_name=v.full_name, business_name=v.business_name, business_type=v.business_type.value, operating_regions=[r.strip() for r in regions if r.strip()], vehicle_types=vtypes, average_rating=float(v.average_rating), total_deliveries=v.total_deliveries)

def _booking_to_response(b) -> BookingResponse:
    return BookingResponse(id=str(b.id), tenant_id=str(b.tenant_id), vendor_id=str(b.vendor_id), vendor_name=b.vendor.full_name if b.vendor else '', shipment_id=str(b.shipment_id) if b.shipment_id else None, status=b.status.value, pickup_address=b.pickup_address, delivery_address=b.delivery_address, vehicle_type_requested=b.vehicle_type_requested.value if b.vehicle_type_requested else None, driver_name=b.driver_name, driver_phone=b.driver_phone, current_location=b.current_location, current_latitude=float(b.current_latitude) if b.current_latitude is not None else None, current_longitude=float(b.current_longitude) if b.current_longitude is not None else None, last_location_at=b.last_location_at, live_tracking_provider=b.live_tracking_provider, notes=b.notes, credit_cost=b.credit_cost, currency=b.currency, tenant_rating=b.tenant_rating, tenant_review=b.tenant_review, booked_by=b.booked_by, offered_at=b.offered_at, offer_expires_at=b.offer_expires_at, responded_at=b.responded_at, accepted_at=b.accepted_at, started_at=b.started_at, completed_at=b.completed_at, canceled_at=b.canceled_at, created_at=b.created_at, updated_at=b.updated_at)


def _to_self_response(v) -> VendorResponse:
    """Vendor self-view — own business data, without internal review fields."""
    resp = _to_response(v)
    resp.reviewed_by = None
    resp.rejection_reason = v.rejection_reason  # vendor sees their own rejection reason
    return resp


def _booking_to_vendor_response(b) -> BookingResponse:
    """Vendor-facing booking view — field allowlist per PO D-01.

    `booked_by` (tenant staff's personal email) is withheld; everything else
    is booking-domain data the vendor is a counterparty to.
    """
    resp = _booking_to_response(b)
    resp.booked_by = None
    return resp