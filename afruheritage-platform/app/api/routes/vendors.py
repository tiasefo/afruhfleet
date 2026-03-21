from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_superuser
from app.db.session import get_db
from app.models.user import User
from app.schemas.vendor import (
    BookingCreateRequest,
    BookingResponse,
    BookingUpdateRequest,
    VendorRegisterRequest,
    VendorRegisterResponse,
    VendorResponse,
    VendorReviewRequest,
    VendorSearchResult,
    VendorVehicleResponse,
)
from app.services.vendor_service import (
    create_booking,
    get_booking,
    get_vendor,
    list_bookings,
    list_vendors,
    register_vendor,
    review_vendor,
    search_marketplace,
    suspend_vendor,
    update_booking,
)
from app.middleware.rate_limit import rate_limit

router = APIRouter(prefix="/vendors", tags=["Delivery Vendors"])


# ── Public Registration (no auth — matches frontend form) ──────

@router.post("/register", response_model=VendorRegisterResponse)
@rate_limit(category="public", rule="vendor_register")
def register_vendor_route(
    payload: VendorRegisterRequest,
    db: Session = Depends(get_db),
):
    try:
        vendor = register_vendor(
            db,
            full_name=payload.full_name,
            email=payload.email,
            phone=payload.phone,
            id_type=payload.id_type,
            id_number=payload.id_number,
            vehicle_types=payload.vehicle_types,
            vehicle_reg_number=payload.vehicle_reg_number,
            vehicle_model=payload.vehicle_model,
            vehicle_year=payload.vehicle_year,
            business_name=payload.business_name,
            business_type=payload.business_type,
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
            message="Registration submitted successfully. Our team will review your application within 2-3 business days.",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


# ── Admin: List & Review Vendors ───────────────────────────────

@router.get("/admin", response_model=dict)
def list_vendors_admin(
    status: str | None = Query(None),
    q: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    items, total = list_vendors(db, status=status, query=q, page=page, page_size=page_size)
    pages = max(1, (total + page_size - 1) // page_size)
    return {
        "items": [_to_response(v).model_dump(mode="json") for v in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


@router.get("/admin/{vendor_id}", response_model=VendorResponse)
def get_vendor_admin(
    vendor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    vendor = get_vendor(db, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return _to_response(vendor)


@router.post("/admin/{vendor_id}/review", response_model=VendorResponse)
def review_vendor_route(
    vendor_id: str,
    payload: VendorReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    try:
        vendor = review_vendor(
            db, vendor_id,
            action=payload.action,
            reviewed_by=current_user.email,
            rejection_reason=payload.rejection_reason,
        )
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
        return _to_response(vendor)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/admin/{vendor_id}/suspend", response_model=VendorResponse)
def suspend_vendor_route(
    vendor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    vendor = suspend_vendor(db, vendor_id, reviewed_by=current_user.email)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return _to_response(vendor)


# ── Marketplace Search (tenant-facing, auth required) ──────────

@router.get("/marketplace", response_model=dict)
def search_vendor_marketplace(
    region: str | None = Query(None),
    vehicle_type: str | None = Query(None),
    q: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = search_marketplace(
        db, region=region, vehicle_type=vehicle_type, query=q,
        page=page, page_size=page_size,
    )
    pages = max(1, (total + page_size - 1) // page_size)
    return {
        "items": [_to_search_result(v).model_dump() for v in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


@router.get("/marketplace/{vendor_id}", response_model=VendorResponse)
def get_marketplace_vendor(
    vendor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vendor = get_vendor(db, vendor_id)
    if not vendor or vendor.status.value != "approved":
        raise HTTPException(status_code=404, detail="Vendor not found")
    return _to_response(vendor)


# ── Bookings (tenant books a vendor) ───────────────────────────

@router.post("/{tenant_id}/bookings", response_model=BookingResponse)
def create_booking_route(
    tenant_id: str,
    payload: BookingCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        booking = create_booking(
            db, tenant_id, payload.vendor_id,
            shipment_id=payload.shipment_id,
            pickup_address=payload.pickup_address,
            delivery_address=payload.delivery_address,
            vehicle_type_requested=payload.vehicle_type_requested,
            notes=payload.notes,
            booked_by=current_user.email,
        )
        return _booking_to_response(booking)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{tenant_id}/bookings", response_model=dict)
def list_tenant_bookings(
    tenant_id: str,
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = list_bookings(db, tenant_id=tenant_id, status=status, page=page, page_size=page_size)
    pages = max(1, (total + page_size - 1) // page_size)
    return {
        "items": [_booking_to_response(b).model_dump(mode="json") for b in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


@router.get("/{tenant_id}/bookings/{booking_id}", response_model=BookingResponse)
def get_booking_route(
    tenant_id: str,
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = get_booking(db, booking_id)
    if not booking or str(booking.tenant_id) != tenant_id:
        raise HTTPException(status_code=404, detail="Booking not found")
    return _booking_to_response(booking)


@router.patch("/{tenant_id}/bookings/{booking_id}", response_model=BookingResponse)
def update_booking_route(
    tenant_id: str,
    booking_id: str,
    payload: BookingUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = get_booking(db, booking_id)
    if not existing or str(existing.tenant_id) != tenant_id:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = update_booking(db, booking_id, **payload.model_dump(exclude_unset=True))
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return _booking_to_response(booking)


# ── Response helpers ───────────────────────────────────────────

def _to_response(v) -> VendorResponse:
    regions = v.operating_regions.split(",") if v.operating_regions else []
    return VendorResponse(
        id=str(v.id),
        full_name=v.full_name,
        email=v.email,
        phone=v.phone,
        id_type=v.id_type.value,
        id_number=v.id_number,
        business_name=v.business_name,
        business_type=v.business_type.value,
        operating_regions=[r.strip() for r in regions if r.strip()],
        years_experience=v.years_experience,
        status=v.status.value,
        average_rating=float(v.average_rating),
        total_deliveries=v.total_deliveries,
        vehicles=[
            VendorVehicleResponse(
                id=str(veh.id),
                vehicle_type=veh.vehicle_type.value,
                registration_number=veh.registration_number,
                make_model=veh.make_model,
                year=veh.year,
                insurance_doc_url=veh.insurance_doc_url,
                roadworthy_doc_url=veh.roadworthy_doc_url,
                is_active=veh.is_active,
            )
            for veh in (v.vehicles or [])
        ],
        terms_accepted=v.terms_accepted,
        insurance_accepted=v.insurance_accepted,
        background_check_accepted=v.background_check_accepted,
        reviewed_by=v.reviewed_by,
        reviewed_at=v.reviewed_at,
        rejection_reason=v.rejection_reason,
        created_at=v.created_at,
        updated_at=v.updated_at,
    )


def _to_search_result(v) -> VendorSearchResult:
    regions = v.operating_regions.split(",") if v.operating_regions else []
    vtypes = list({veh.vehicle_type.value for veh in (v.vehicles or []) if veh.is_active})
    return VendorSearchResult(
        id=str(v.id),
        full_name=v.full_name,
        business_name=v.business_name,
        business_type=v.business_type.value,
        operating_regions=[r.strip() for r in regions if r.strip()],
        vehicle_types=vtypes,
        average_rating=float(v.average_rating),
        total_deliveries=v.total_deliveries,
    )


def _booking_to_response(b) -> BookingResponse:
    return BookingResponse(
        id=str(b.id),
        tenant_id=str(b.tenant_id),
        vendor_id=str(b.vendor_id),
        vendor_name=b.vendor.full_name if b.vendor else "",
        shipment_id=str(b.shipment_id) if b.shipment_id else None,
        status=b.status.value,
        pickup_address=b.pickup_address,
        delivery_address=b.delivery_address,
        vehicle_type_requested=b.vehicle_type_requested.value if b.vehicle_type_requested else None,
        notes=b.notes,
        credit_cost=b.credit_cost,
        currency=b.currency,
        tenant_rating=b.tenant_rating,
        tenant_review=b.tenant_review,
        booked_by=b.booked_by,
        accepted_at=b.accepted_at,
        completed_at=b.completed_at,
        created_at=b.created_at,
        updated_at=b.updated_at,
    )
