from __future__ import annotations
from app.core.config import settings

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def _ev(cls):
    return [e.value for e in cls]


class VehicleType(str, PyEnum):
    TRUCK = "truck"
    CAR = "car"
    MOTORBIKE = "motorbike"
    BICYCLE = "bicycle"


class VendorStatus(str, PyEnum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class BusinessType(str, PyEnum):
    INDIVIDUAL = "individual"
    REGISTERED = "registered"
    FLEET = "fleet"


class IDType(str, PyEnum):
    GHANA_CARD = "ghana_card"
    PASSPORT = "passport"
    VOTER_ID = "voter_id"
    DRIVERS_LICENSE = "drivers_license"


class BookingStatus(str, PyEnum):
    REQUESTED = "requested"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELED = "canceled"
    DISPUTED = "disputed"


class DriverAvailability(str, PyEnum):
    OFFLINE = "offline"
    AVAILABLE = "available"
    EN_ROUTE_PICKUP = "en_route_pickup"
    DELIVERING = "delivering"


# ── Delivery Vendor ────────────────────────────────────────────

class DeliveryVendor(Base):
    __tablename__ = "delivery_vendors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Personal info
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    id_type: Mapped[IDType] = mapped_column(Enum(IDType, values_callable=_ev), nullable=False)
    id_number: Mapped[str] = mapped_column(String(100), nullable=False)

    # Business info
    business_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    business_type: Mapped[BusinessType] = mapped_column(
        Enum(BusinessType, values_callable=_ev), nullable=False, default=BusinessType.INDIVIDUAL,
    )
    operating_regions: Mapped[str] = mapped_column(Text, nullable=False, default="")
    years_experience: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Status & review
    status: Mapped[VendorStatus] = mapped_column(
        Enum(VendorStatus, values_callable=_ev), nullable=False, default=VendorStatus.PENDING,
    )
    reviewed_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    availability_status: Mapped[DriverAvailability] = mapped_column(
        Enum(DriverAvailability, values_callable=_ev), nullable=False, default=DriverAvailability.OFFLINE,
    )
    availability_updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_known_location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_known_latitude: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    last_known_longitude: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Agreement flags
    terms_accepted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    insurance_accepted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    background_check_accepted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Rating (updated by service after bookings)
    average_rating: Mapped[float] = mapped_column(Numeric(3, 2), nullable=False, default=0.0)
    total_deliveries: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Billing link — vendor gets their own wallet using the same credit model
    wallet_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    vehicles: Mapped[list[VendorVehicle]] = relationship("VendorVehicle", back_populates="vendor", lazy="selectin")
    documents: Mapped[list[VendorDocument]] = relationship("VendorDocument", back_populates="vendor", lazy="selectin", cascade="all, delete-orphan")


# ── Vendor Vehicle ─────────────────────────────────────────────

class VendorVehicle(Base):
    __tablename__ = "vendor_vehicles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("delivery_vendors.id"), nullable=False, index=True)

    vehicle_type: Mapped[VehicleType] = mapped_column(Enum(VehicleType, values_callable=_ev), nullable=False)
    registration_number: Mapped[str] = mapped_column(String(50), nullable=False)
    make_model: Mapped[str | None] = mapped_column(String(255), nullable=True)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Document references (storage paths)
    insurance_doc_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    roadworthy_doc_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    vendor: Mapped[DeliveryVendor] = relationship("DeliveryVendor", back_populates="vehicles")


class VendorDocument(Base):
    __tablename__ = "vendor_documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("delivery_vendors.id"), nullable=False, index=True)
    document_type: Mapped[str] = mapped_column(String(50), nullable=False)
    file_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    vendor: Mapped[DeliveryVendor] = relationship("DeliveryVendor", back_populates="documents")


# ── Service Booking (tenant consumes vendor service) ───────────

class VendorServiceBooking(Base):
    __tablename__ = "vendor_service_bookings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    vendor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("delivery_vendors.id"), nullable=False, index=True)
    shipment_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)

    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus, values_callable=_ev), nullable=False, default=BookingStatus.REQUESTED,
    )

    pickup_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    delivery_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    vehicle_type_requested: Mapped[VehicleType | None] = mapped_column(
        Enum(VehicleType, values_callable=_ev), nullable=True,
    )
    driver_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    driver_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    current_location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    current_latitude: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    current_longitude: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    last_location_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    live_tracking_provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Pricing (credit-based)
    credit_cost: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="GHS")

    # Rating
    tenant_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tenant_review: Mapped[str | None] = mapped_column(Text, nullable=True)

    booked_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    offered_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    offer_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    canceled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    vendor: Mapped[DeliveryVendor] = relationship("DeliveryVendor")
