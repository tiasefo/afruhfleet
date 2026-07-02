from __future__ import annotations
import uuid
from datetime import datetime
from sqlalchemy import DateTime, Float, Integer, String, Text, Boolean, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

class MarketplaceShipment(Base):
    __tablename__ = "marketplace_shipments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Human-readable tracking code shown to shippers and drivers e.g. AFR-2026-000042
    tracking_number: Mapped[str | None] = mapped_column(String(40), unique=True, index=True, nullable=True)

    # Who created it (must be authenticated)
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)

    tenant_id: Mapped[str] = mapped_column(String(255), index=True)
    customer_name: Mapped[str] = mapped_column(String(255))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    pickup_label: Mapped[str] = mapped_column(String(255))
    pickup_latitude: Mapped[float] = mapped_column(Float)
    pickup_longitude: Mapped[float] = mapped_column(Float)

    dropoff_label: Mapped[str] = mapped_column(String(255))
    dropoff_latitude: Mapped[float] = mapped_column(Float)
    dropoff_longitude: Mapped[float] = mapped_column(Float)

    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    length_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    width_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    package_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    package_value: Mapped[float | None] = mapped_column(Float, nullable=True)

    image_urls_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    fragile: Mapped[bool] = mapped_column(Boolean, default=False)
    refrigerated: Mapped[bool] = mapped_column(Boolean, default=False)
    special_handling_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    distance_km: Mapped[float] = mapped_column(Float, default=0)
    suggested_price: Mapped[float] = mapped_column(Float, default=0)
    currency: Mapped[str] = mapped_column(String(20), default="GHS")

    # open → assigned → in_progress → completed / cancelled
    status: Mapped[str] = mapped_column(String(100), default="open")
    tracking_status: Mapped[str] = mapped_column(String(100), default="not_started")
    assigned_driver_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ShipmentBid(Base):
    """A driver's bid on an open shipment. Supports negotiate-back (counter-offer)."""
    __tablename__ = "shipment_bids"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shipment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)

    # The driver submitting the bid (user with role=delivery_driver)
    driver_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    driver_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    proposed_price: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(20), default="GHS")
    message: Mapped[str | None] = mapped_column(Text, nullable=True)  # Driver's pitch to shipper

    # pending → accepted / rejected / countered / expired
    status: Mapped[str] = mapped_column(String(50), default="pending", index=True)

    # Shipper counter-offer
    counter_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    counter_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Driver's response to the counter (accepted_counter / rejected_counter)
    counter_response: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        # One active bid per driver per shipment
        UniqueConstraint("shipment_id", "driver_user_id", name="uq_bid_shipment_driver"),
    )


class MarketplaceReview(Base):
    """Reviews/ratings for vendors in the marketplace."""
    __tablename__ = "marketplace_reviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    author_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    author_name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5 stars
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    flagged: Mapped[bool] = mapped_column(Boolean, default=False)  # Flagged for moderation
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        # One review per user per vendor
        UniqueConstraint("vendor_id", "author_id", name="uq_review_vendor_author"),
    )
