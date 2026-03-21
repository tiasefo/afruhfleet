from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class PaymentStatus(str, enum.Enum):
    UNPAID = "unpaid"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    REFUNDED = "refunded"
    OVERDUE = "overdue"


class ShipmentStatus(str, enum.Enum):
    DRAFT = "draft"
    BOOKED = "booked"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    AT_CUSTOMS = "at_customs"
    CUSTOMS_CLEARED = "customs_cleared"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    RETURNED = "returned"
    CANCELLED = "cancelled"


class Shipment(Base):
    __tablename__ = "shipments"
    __table_args__ = (
        Index("ix_shipments_tenant_tracking", "tenant_id", "tracking_number", unique=True),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)

    tracking_number: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    reference_number: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)

    sender_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sender_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    sender_address: Mapped[str | None] = mapped_column(Text, nullable=True)

    receiver_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    receiver_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    receiver_address: Mapped[str | None] = mapped_column(Text, nullable=True)

    origin_country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    origin_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    destination_country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    destination_city: Mapped[str | None] = mapped_column(String(100), nullable=True)

    shipped_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    estimated_arrival: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    actual_arrival: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    weight_kg: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    volume_cbm: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    package_count: Mapped[int | None] = mapped_column(nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cargo_type: Mapped[str | None] = mapped_column(String(50), nullable=True)

    total_cost: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    amount_paid: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    balance_due: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="GHS")
    payment_status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus), nullable=False, default=PaymentStatus.UNPAID,
    )

    status: Mapped[ShipmentStatus] = mapped_column(
        Enum(ShipmentStatus), nullable=False, default=ShipmentStatus.DRAFT,
    )

    group_member_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("group_members.id"), nullable=True, index=True,
    )
    created_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    events: Mapped[list[ShipmentEvent]] = relationship("ShipmentEvent", back_populates="shipment", cascade="all, delete-orphan")
    group_member: Mapped[GroupMember | None] = relationship("GroupMember", back_populates="shipments")


class ShipmentEvent(Base):
    __tablename__ = "shipment_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shipment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("shipments.id"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    shipment: Mapped[Shipment] = relationship("Shipment", back_populates="events")


class GroupMember(Base):
    __tablename__ = "group_members"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)

    full_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    id_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    preferred_language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")

    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    shipments: Mapped[list[Shipment]] = relationship("Shipment", back_populates="group_member")
