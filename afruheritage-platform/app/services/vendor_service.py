from __future__ import annotations

import logging
from datetime import datetime

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.vendor import (
    BookingStatus,
    BusinessType,
    DeliveryVendor,
    IDType,
    VehicleType,
    VendorServiceBooking,
    VendorStatus,
    VendorVehicle,
)
from app.services.kyc_service import KYCService

logger = logging.getLogger("afruheritage.vendor")


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
    vendor = db.query(DeliveryVendor).filter(
        DeliveryVendor.id == vendor_id,
        DeliveryVendor.status == VendorStatus.APPROVED,
    ).first()
    if not vendor:
        raise ValueError("Vendor not found or not approved")

    booking = VendorServiceBooking(
        tenant_id=tenant_id,
        vendor_id=vendor_id,
        shipment_id=shipment_id,
        pickup_address=pickup_address,
        delivery_address=delivery_address,
        vehicle_type_requested=VehicleType(vehicle_type_requested) if vehicle_type_requested else None,
        notes=notes,
        credit_cost=credit_cost,
        booked_by=booked_by,
        status=BookingStatus.REQUESTED,
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
        booking.status = new_status
        if new_status == BookingStatus.ACCEPTED:
            booking.accepted_at = datetime.utcnow()
        elif new_status == BookingStatus.COMPLETED:
            booking.completed_at = datetime.utcnow()
            # Update vendor stats
            vendor = db.query(DeliveryVendor).filter(DeliveryVendor.id == booking.vendor_id).first()
            if vendor:
                vendor.total_deliveries += 1

    for key, value in kwargs.items():
        if value is not None and hasattr(booking, key):
            setattr(booking, key, value)

    # Recalculate vendor average rating if a rating was given
    if kwargs.get("tenant_rating"):
        _recalculate_vendor_rating(db, str(booking.vendor_id))

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
