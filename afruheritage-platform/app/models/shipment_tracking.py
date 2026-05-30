from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Index, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class ShipmentTrackingPoint(Base):
    __tablename__ = "shipment_tracking_points"
    __table_args__ = (
        Index("ix_tracking_points_tenant_shipment_captured", "tenant_id", "shipment_id", "captured_at"),
        Index("ix_tracking_points_shipment_captured", "shipment_id", "captured_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shipment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)

    latitude: Mapped[float] = mapped_column(Numeric(10, 7), nullable=False)
    longitude: Mapped[float] = mapped_column(Numeric(10, 7), nullable=False)
    speed_kph: Mapped[float | None] = mapped_column(Numeric(7, 2), nullable=True)
    heading: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    accuracy_m: Mapped[float | None] = mapped_column(Numeric(7, 2), nullable=True)

    source: Mapped[str] = mapped_column(String(40), nullable=False, default="driver_app")
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
