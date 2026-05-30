from __future__ import annotations
import uuid
from datetime import datetime
from sqlalchemy import DateTime, Float, String, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

class MarketplaceShipment(Base):
    __tablename__ = "marketplace_shipments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
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
    package_count: Mapped[int | None] = mapped_column(Float, nullable=True)
    package_value: Mapped[float | None] = mapped_column(Float, nullable=True)

    image_urls_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    fragile: Mapped[bool] = mapped_column(Boolean, default=False)
    refrigerated: Mapped[bool] = mapped_column(Boolean, default=False)
    special_handling_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    distance_km: Mapped[float] = mapped_column(Float, default=0)
    suggested_price: Mapped[float] = mapped_column(Float, default=0)
    currency: Mapped[str] = mapped_column(String(20), default="GHS")

    status: Mapped[str] = mapped_column(String(100), default="open")
    tracking_status: Mapped[str] = mapped_column(String(100), default="not_started")
    assigned_driver_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
