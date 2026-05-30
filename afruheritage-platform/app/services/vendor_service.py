from __future__ import annotations
from app.core.config import settings

import logging
import math
import uuid
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.shipment import ShipmentStatus
from app.models.vendor import (
    BookingStatus,
    BusinessType,
    DeliveryVendor,
    DriverAvailability,
    IDType,
    VehicleType,
    VendorServiceBooking,
    VendorStatus,
    VendorDocument,
    VendorVehicle,
)
from app.services.kyc_service import KYCService
from app.services.geo_service import geo_service
from app.services.shipment_service import add_shipment_event, update_shipment_location

logger = logging.getLogger("afruheritage.vendor")


def _as_float(value) -> float | None:
    if value in (None, ""):
        return None
    if isinstance(value, Decimal):
        return float(value)
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius_km * c


def _coerce_uuid(value):
    if isinstance(value, uuid.UUID) or value is None:
        return value
    if isinstance(value, str):
        try:
            return uuid.UUID(value)
        except ValueError:
            return value
    return value


def _is_offer_expired(booking: VendorServiceBooking) -> bool:
    return bool(
        booking.offer_expires_at
        and booking.status == BookingStatus.REQUESTED
        and booking.offer_expires_at < datetime.utcnow()
    )


def _sync_booking_to_shipment(db: Session, booking: VendorServiceBooking, status_str: str | None = None) -> None:
    if not booking.shipment_id:
        return

    shipment_status = None
    event_type = None
    if status_str == BookingStatus.IN_PROGRESS.value:
        shipment_status = ShipmentStatus.OUT_FOR_DELIVERY.value
        event_type = ShipmentStatus.OUT_FOR_DELIVERY.value
    elif status_str == BookingStatus.COMPLETED.value:
        shipment_status = ShipmentStatus.DELIVERED.value
        event_type = ShipmentStatus.DELIVERED.value
    elif status_str == BookingStatus.ACCEPTED.value:
        event_type = "vendor_assigned"
    elif status_str == BookingStatus.CANCELED.value:
        event_type = "vendor_dispatch_canceled"

    if not any([
        shipment_status,
        event_type,
        booking.current_latitude is not None,
        booking.current_longitude is not None,
        booking.current_location,
    ]):
        return

    description_parts = []
    if booking.driver_name:
        description_parts.append(f"Driver: {booking.driver_name}")
    if booking.driver_phone:
        description_parts.append(f"Phone: {booking.driver_phone}")

    if booking.current_latitude is None or booking.current_longitude is None:
        if event_type:
            add_shipment_event(
                db,
                str(booking.shipment_id),
                event_type=event_type,
                location=booking.current_location,
                description=" | ".join(description_parts) or booking.notes,
                occurred_at=booking.last_location_at,
            )
        return

    update_shipment_location(
        db,
        str(booking.shipment_id),
        str(booking.tenant_id),
        latitude=_as_float(booking.current_latitude),
        longitude=_as_float(booking.current_longitude),
        location=booking.current_location,
        occurred_at=booking.last_location_at,
        provider=booking.live_tracking_provider or "vendor_marketplace",
        event_type=event_type or "vendor_location_update",
        description=" | ".join(description_parts) or booking.notes,
        status=shipment_status,
    )


# ── Registration (public) ──────────────────────────────────────

def register_vendor(
    db: Session,
    *,
    full_name: str,
    email: str,
    phone: str,
    id_type: str,
    id_number: str,
    vehicle_types: list[str],
    vehicle_reg_number: str,
    vehicle_model: str | None = None,
    vehicle_year: str | None = None,
    business_name: str | None = None,
    business_type: str = "individual",
    operating_regions: list[str] | None = None,
    years_experience: str | None = None,
    terms_accepted: bool = False,
    insurance_accepted: bool = False,
    background_check_accepted: bool = False,
) -> DeliveryVendor:
    existing = db.query(DeliveryVendor).filter(DeliveryVendor.email == email).first()
    if existing:
        raise ValueError(f"A vendor with email {email} already exists")

    if not terms_accepted or not insurance_accepted or not background_check_accepted:
        raise ValueError("All agreement checkboxes must be accepted")

    if not vehicle_types:
        raise ValueError("At least one vehicle type is required")

    vendor = DeliveryVendor(
        full_name=full_name,
        email=email,
        phone=phone,
        id_type=IDType(id_type),
        id_number=id_number,
        business_name=business_name,
        business_type=BusinessType(business_type),
        operating_regions=",".join(operating_regions or []),
        years_experience=years_experience,
        terms_accepted=terms_accepted,
        insurance_accepted=insurance_accepted,
        background_check_accepted=background_check_accepted,
        status=VendorStatus.PENDING,
    )
    db.add(vendor)
    db.flush()

    # Create vehicle records for each selected type
    for vtype in vehicle_types:
        vehicle = VendorVehicle(
            vendor_id=vendor.id,
            vehicle_type=VehicleType(vtype),
            registration_number=vehicle_reg_number,
            make_model=vehicle_model,
            year=int(vehicle_year) if vehicle_year and vehicle_year.isdigit() else None,
        )
        db.add(vehicle)

    db.commit()
    db.refresh(vendor)
    logger.info("Vendor registered: %s (%s)", vendor.full_name, vendor.email)
    return vendor


# ── Admin review ───────────────────────────────────────────────

def review_vendor(
    db: Session,
    vendor_id: str,
    action: str,
    reviewed_by: str,
    rejection_reason: str | None = None,
) -> DeliveryVendor | None:
    vendor = db.query(DeliveryVendor).filter(DeliveryVendor.id == vendor_id).first()
    if not vendor:
        return None

    if action == "approve":
        vendor.status = VendorStatus.APPROVED
        vendor.reviewed_by = reviewed_by
        vendor.reviewed_at = datetime.utcnow()
        vendor.rejection_reason = None
        logger.info("Vendor approved: %s by %s", vendor.full_name, reviewed_by)
    elif action == "reject":
        vendor.status = VendorStatus.REJECTED
        vendor.reviewed_by = reviewed_by
        vendor.reviewed_at = datetime.utcnow()
        vendor.rejection_reason = rejection_reason
        logger.info("Vendor rejected: %s by %s — %s", vendor.full_name, reviewed_by, rejection_reason)
    else:
        raise ValueError(f"Invalid action: {action}. Must be 'approve' or 'reject'.")

    db.commit()
    db.refresh(vendor)
    return vendor


def suspend_vendor(db: Session, vendor_id: str, reviewed_by: str) -> DeliveryVendor | None:
    vendor = db.query(DeliveryVendor).filter(DeliveryVendor.id == vendor_id).first()
    if not vendor:
        return None
    vendor.status = VendorStatus.SUSPENDED
    vendor.reviewed_by = reviewed_by
    vendor.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(vendor)
    return vendor


# ── Get / List ─────────────────────────────────────────────────

def get_vendor(db: Session, vendor_id: str) -> DeliveryVendor | None:
    return db.query(DeliveryVendor).filter(DeliveryVendor.id == vendor_id).first()


def get_vendor_by_email(db: Session, email: str) -> DeliveryVendor | None:
    return db.query(DeliveryVendor).filter(DeliveryVendor.email == email).first()


def list_vendors(
    db: Session,
    *,
    status: str | None = None,
    query: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[DeliveryVendor], int]:
    q = db.query(DeliveryVendor)

    if status:
        q = q.filter(DeliveryVendor.status == VendorStatus(status))

    if query:
        like = f"%{query}%"
        q = q.filter(
            or_(
                DeliveryVendor.full_name.ilike(like),
                DeliveryVendor.email.ilike(like),
                DeliveryVendor.phone.ilike(like),
                DeliveryVendor.business_name.ilike(like),
            )
        )

    total = q.count()
    items = q.order_by(DeliveryVendor.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, total


# ── Marketplace search (tenant-facing, only approved vendors) ──

def search_marketplace(
    db: Session,
    *,
    region: str | None = None,
    vehicle_type: str | None = None,
    query: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[DeliveryVendor], int]:
    q = db.query(DeliveryVendor).filter(DeliveryVendor.status == VendorStatus.APPROVED)

    if region:
        q = q.filter(DeliveryVendor.operating_regions.ilike(f"%{region}%"))

    if vehicle_type:
        q = q.join(VendorVehicle).filter(
            VendorVehicle.vehicle_type == VehicleType(vehicle_type),
            VendorVehicle.is_active == True,
        )

    if query:
        like = f"%{query}%"
        q = q.filter(
            or_(
                DeliveryVendor.full_name.ilike(like),
                DeliveryVendor.business_name.ilike(like),
            )
        )

    total = q.count()
    items = (
        q.order_by(DeliveryVendor.average_rating.desc(), DeliveryVendor.total_deliveries.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def suggest_vendors_for_pickup(
    db: Session,
    *,
    pickup_address: str | None = None,
    pickup_latitude: float | None = None,
    pickup_longitude: float | None = None,
    vehicle_type: str | None = None,
    region: str | None = None,
    limit: int = 10,
    only_available: bool = False,
    exclude_vendor_ids: list[str] | None = None,
) -> list[dict]:
    target_lat = pickup_latitude
    target_lng = pickup_longitude

    if (target_lat is None or target_lng is None) and pickup_address:
        geocoded = geo_service.geocode(pickup_address)
        if geocoded:
            target_lat = geocoded.get("lat")
            target_lng = geocoded.get("lng")

    base = db.query(DeliveryVendor).filter(DeliveryVendor.status == VendorStatus.APPROVED)
    if only_available:
        base = base.filter(DeliveryVendor.availability_status == DriverAvailability.AVAILABLE)
    if region:
        base = base.filter(DeliveryVendor.operating_regions.ilike(f"%{region}%"))
    if vehicle_type:
        base = base.join(VendorVehicle).filter(
            VendorVehicle.vehicle_type == VehicleType(vehicle_type),
            VendorVehicle.is_active == True,
        )

    vendors = base.order_by(DeliveryVendor.average_rating.desc(), DeliveryVendor.total_deliveries.desc()).all()
    excluded = {str(v) for v in (exclude_vendor_ids or [])}

    matches: list[dict] = []
    for vendor in vendors:
        if str(vendor.id) in excluded:
            continue
        last_location = (
            db.query(VendorServiceBooking)
            .filter(
                VendorServiceBooking.vendor_id == vendor.id,
                VendorServiceBooking.current_latitude.isnot(None),
                VendorServiceBooking.current_longitude.isnot(None),
            )
            .order_by(VendorServiceBooking.last_location_at.desc(), VendorServiceBooking.updated_at.desc())
            .first()
        )

        distance_km = None
        eta_hours = None
        vendor_lat = _as_float(vendor.last_known_latitude)
        vendor_lng = _as_float(vendor.last_known_longitude)
        if (vendor_lat is None or vendor_lng is None) and last_location:
            vendor_lat = _as_float(last_location.current_latitude)
            vendor_lng = _as_float(last_location.current_longitude)

        if target_lat is not None and target_lng is not None and vendor_lat is not None and vendor_lng is not None:
            distance_km = round(_haversine_distance_km(target_lat, target_lng, vendor_lat, vendor_lng), 2)
            eta_hours = round(distance_km / 35.0, 2)

        rating_score = min(float(vendor.average_rating) / 5.0, 1.0)
        delivery_score = min(vendor.total_deliveries / 200.0, 1.0)
        distance_score = 0.5 if distance_km is None else max(0.0, 1.0 - (distance_km / 50.0))
        match_score = round((distance_score * 0.55) + (rating_score * 0.30) + (delivery_score * 0.15), 4)

        matches.append(
            {
                "vendor_id": str(vendor.id),
                "vendor_name": vendor.full_name,
                "business_name": vendor.business_name,
                "vehicle_types": [veh.vehicle_type.value for veh in vendor.vehicles or [] if veh.is_active],
                "average_rating": float(vendor.average_rating),
                "total_deliveries": vendor.total_deliveries,
                "distance_km": distance_km,
                "eta_hours": eta_hours,
                "match_score": match_score,
            }
        )

    matches.sort(
        key=lambda x: (
            x["distance_km"] is None,
            x["distance_km"] if x["distance_km"] is not None else 999999,
            -x["match_score"],
        )
    )
    return matches[:limit]


# ── Service Bookings ───────────────────────────────────────────

def create_booking(
    db: Session,
    tenant_id: str,
    vendor_id: str,
    *,
    shipment_id: str | None = None,
    pickup_address: str | None = None,
    delivery_address: str | None = None,
    vehicle_type_requested: str | None = None,
    notes: str | None = None,
    credit_cost: int = 0,
    booked_by: str | None = None,
) -> VendorServiceBooking:
    vendor_id_value = _coerce_uuid(vendor_id)
    tenant_id_value = _coerce_uuid(tenant_id)
    shipment_id_value = _coerce_uuid(shipment_id)

    vendor = db.query(DeliveryVendor).filter(
        DeliveryVendor.id == vendor_id_value,
        DeliveryVendor.status == VendorStatus.APPROVED,
    ).first()
    if not vendor:
        raise ValueError("Vendor not found or not approved")

    booking = VendorServiceBooking(
        tenant_id=tenant_id_value,
        vendor_id=vendor_id_value,
        shipment_id=shipment_id_value,
        pickup_address=pickup_address,
        delivery_address=delivery_address,
        vehicle_type_requested=VehicleType(vehicle_type_requested) if vehicle_type_requested else None,
        notes=notes,
        credit_cost=credit_cost,
        booked_by=booked_by,
        status=BookingStatus.REQUESTED,
        offered_at=datetime.utcnow(),
        offer_expires_at=datetime.utcnow() + timedelta(minutes=settings.booking_offer_ttl_minutes),
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    logger.info("Booking created: tenant=%s vendor=%s", tenant_id, vendor.full_name)
    return booking


def update_booking(
    db: Session,
    booking_id: str,
    **kwargs,
) -> VendorServiceBooking | None:
    booking = db.query(VendorServiceBooking).filter(VendorServiceBooking.id == booking_id).first()
    if not booking:
        return None

    status_str = kwargs.pop("status", None)
    if status_str:
        new_status = BookingStatus(status_str)
        if new_status in {BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS} and _is_offer_expired(booking):
            raise ValueError("Booking offer has expired and cannot be accepted")
        booking.status = new_status
        if new_status == BookingStatus.ACCEPTED:
            booking.accepted_at = datetime.utcnow()
            booking.responded_at = datetime.utcnow()
            booking.canceled_at = None
            vendor = db.query(DeliveryVendor).filter(DeliveryVendor.id == booking.vendor_id).first()
            if vendor:
                vendor.availability_status = DriverAvailability.EN_ROUTE_PICKUP
                vendor.availability_updated_at = datetime.utcnow()
                db.add(vendor)
        elif new_status == BookingStatus.COMPLETED:
            booking.completed_at = datetime.utcnow()
            # Update vendor stats
            vendor = db.query(DeliveryVendor).filter(DeliveryVendor.id == booking.vendor_id).first()
            if vendor:
                vendor.total_deliveries += 1
                vendor.availability_status = DriverAvailability.AVAILABLE
                vendor.availability_updated_at = datetime.utcnow()
                db.add(vendor)
        elif new_status == BookingStatus.IN_PROGRESS:
            booking.started_at = datetime.utcnow()
            booking.canceled_at = None
            vendor = db.query(DeliveryVendor).filter(DeliveryVendor.id == booking.vendor_id).first()
            if vendor:
                vendor.availability_status = DriverAvailability.DELIVERING
                vendor.availability_updated_at = datetime.utcnow()
                db.add(vendor)
        elif new_status == BookingStatus.CANCELED:
            booking.canceled_at = datetime.utcnow()
            booking.responded_at = booking.responded_at or datetime.utcnow()
            vendor = db.query(DeliveryVendor).filter(DeliveryVendor.id == booking.vendor_id).first()
            if vendor:
                vendor.availability_status = DriverAvailability.AVAILABLE
                vendor.availability_updated_at = datetime.utcnow()
                db.add(vendor)

    for key, value in kwargs.items():
        if value is not None and hasattr(booking, key):
            setattr(booking, key, value)

    # Recalculate vendor average rating if a rating was given
    if kwargs.get("tenant_rating"):
        _recalculate_vendor_rating(db, str(booking.vendor_id))

    if kwargs.get("current_latitude") is not None or kwargs.get("current_longitude") is not None:
        booking.last_location_at = kwargs.get("last_location_at") or datetime.utcnow()
        booking.live_tracking_provider = kwargs.get("live_tracking_provider") or booking.live_tracking_provider or "vendor_marketplace"

        vendor = db.query(DeliveryVendor).filter(DeliveryVendor.id == booking.vendor_id).first()
        if vendor:
            vendor.last_known_location = kwargs.get("current_location") or vendor.last_known_location
            if kwargs.get("current_latitude") is not None:
                vendor.last_known_latitude = kwargs.get("current_latitude")
            if kwargs.get("current_longitude") is not None:
                vendor.last_known_longitude = kwargs.get("current_longitude")
            vendor.last_seen_at = booking.last_location_at
            db.add(vendor)

    _sync_booking_to_shipment(db, booking, status_str)

    db.commit()
    db.refresh(booking)
    return booking


def get_booking(db: Session, booking_id: str) -> VendorServiceBooking | None:
    return db.query(VendorServiceBooking).filter(VendorServiceBooking.id == booking_id).first()


def list_bookings(
    db: Session,
    *,
    tenant_id: str | None = None,
    vendor_id: str | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[VendorServiceBooking], int]:
    q = db.query(VendorServiceBooking)

    if tenant_id:
        q = q.filter(VendorServiceBooking.tenant_id == tenant_id)
    if vendor_id:
        q = q.filter(VendorServiceBooking.vendor_id == vendor_id)
    if status:
        q = q.filter(VendorServiceBooking.status == BookingStatus(status))

    total = q.count()
    items = q.order_by(VendorServiceBooking.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def add_vendor_document(
    db: Session,
    vendor_id: str,
    *,
    document_type: str,
    file_url: str,
) -> VendorDocument:
    vendor = db.query(DeliveryVendor).filter(DeliveryVendor.id == vendor_id).first()
    if not vendor:
        raise ValueError("Vendor not found")

    row = VendorDocument(
        vendor_id=vendor.id,
        document_type=document_type,
        file_url=file_url,
    )
    if vendor.status in {VendorStatus.PENDING, VendorStatus.REJECTED}:
        vendor.status = VendorStatus.UNDER_REVIEW
        vendor.rejection_reason = None
        vendor.reviewed_by = None
        vendor.reviewed_at = None
        db.add(vendor)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_vendor_availability(
    db: Session,
    vendor_id: str,
    *,
    availability_status: str,
    current_location: str | None = None,
    current_latitude: float | None = None,
    current_longitude: float | None = None,
) -> DeliveryVendor | None:
    vendor = db.query(DeliveryVendor).filter(DeliveryVendor.id == vendor_id).first()
    if not vendor:
        return None

    vendor.availability_status = DriverAvailability(availability_status)
    vendor.availability_updated_at = datetime.utcnow()
    vendor.last_seen_at = datetime.utcnow()
    if current_location:
        vendor.last_known_location = current_location
    if current_latitude is not None:
        vendor.last_known_latitude = current_latitude
    if current_longitude is not None:
        vendor.last_known_longitude = current_longitude

    db.commit()
    db.refresh(vendor)
    return vendor


def vendor_decide_booking(
    db: Session,
    booking_id: str,
    *,
    vendor_id: str,
    accept: bool,
    note: str | None = None,
) -> VendorServiceBooking | None:
    booking = db.query(VendorServiceBooking).filter(VendorServiceBooking.id == booking_id).first()
    if not booking or str(booking.vendor_id) != str(vendor_id):
        return None

    if booking.status != BookingStatus.REQUESTED:
        raise ValueError("Booking is no longer pending response")

    if accept:
        if _is_offer_expired(booking):
            booking.status = BookingStatus.CANCELED
            booking.canceled_at = datetime.utcnow()
            booking.responded_at = datetime.utcnow()
            booking.notes = (booking.notes or "") + " | auto-canceled: offer expired"
            db.commit()
            db.refresh(booking)
            raise ValueError("Booking offer has expired")
        status_update = BookingStatus.ACCEPTED.value
    else:
        status_update = BookingStatus.CANCELED.value

    return update_booking(
        db,
        booking_id,
        status=status_update,
        notes=note or booking.notes,
    )


def auto_dispatch_booking(
    db: Session,
    *,
    tenant_id: str,
    shipment_id: str | None,
    pickup_address: str | None,
    delivery_address: str | None,
    pickup_latitude: float | None,
    pickup_longitude: float | None,
    vehicle_type_requested: str | None,
    region: str | None,
    notes: str | None,
    candidate_limit: int,
    booked_by: str | None,
    exclude_vendor_ids: list[str] | None = None,
) -> dict:
    candidates = suggest_vendors_for_pickup(
        db,
        pickup_address=pickup_address,
        pickup_latitude=pickup_latitude,
        pickup_longitude=pickup_longitude,
        vehicle_type=vehicle_type_requested,
        region=region,
        limit=candidate_limit,
        only_available=True,
        exclude_vendor_ids=exclude_vendor_ids,
    )
    if not candidates:
        raise ValueError("No available vendor candidates found for this request")

    selected = candidates[0]
    booking = create_booking(
        db,
        tenant_id,
        selected["vendor_id"],
        shipment_id=shipment_id,
        pickup_address=pickup_address,
        delivery_address=delivery_address,
        vehicle_type_requested=vehicle_type_requested,
        notes=notes,
        booked_by=booked_by,
    )
    return {
        "booking": booking,
        "selected_vendor": selected,
        "fallback_candidates": candidates[1:],
    }


def reassign_expired_booking_offers(db: Session) -> dict[str, int]:
    expired = (
        db.query(VendorServiceBooking)
        .filter(
            VendorServiceBooking.status == BookingStatus.REQUESTED,
            VendorServiceBooking.offer_expires_at.isnot(None),
            VendorServiceBooking.offer_expires_at < datetime.utcnow(),
        )
        .all()
    )

    checked = len(expired)
    reassigned = 0
    no_candidate = 0

    for booking in expired:
        old_vendor_id = str(booking.vendor_id)
        booking.status = BookingStatus.CANCELED
        booking.canceled_at = datetime.utcnow()
        booking.responded_at = datetime.utcnow()
        booking.notes = ((booking.notes or "") + " | auto-canceled: offer expired").strip()
        db.add(booking)
        db.commit()

        try:
            auto_dispatch_booking(
                db,
                tenant_id=str(booking.tenant_id),
                shipment_id=str(booking.shipment_id) if booking.shipment_id else None,
                pickup_address=booking.pickup_address,
                delivery_address=booking.delivery_address,
                pickup_latitude=None,
                pickup_longitude=None,
                vehicle_type_requested=booking.vehicle_type_requested.value if booking.vehicle_type_requested else None,
                region=None,
                notes=(booking.notes or "") + " | auto-reassigned after expiry",
                candidate_limit=5,
                booked_by=booking.booked_by,
                exclude_vendor_ids=[old_vendor_id],
            )
            reassigned += 1
        except ValueError:
            no_candidate += 1

    return {
        "checked": checked,
        "reassigned": reassigned,
        "no_candidate": no_candidate,
    }


# ── Internal helpers ───────────────────────────────────────────

def _recalculate_vendor_rating(db: Session, vendor_id: str) -> None:
    result = db.query(func.avg(VendorServiceBooking.tenant_rating)).filter(
        VendorServiceBooking.vendor_id == vendor_id,
        VendorServiceBooking.tenant_rating.isnot(None),
    ).scalar()
    if result:
        vendor = db.query(DeliveryVendor).filter(DeliveryVendor.id == vendor_id).first()
        if vendor:
            vendor.average_rating = round(float(result), 2)
