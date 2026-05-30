from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class MarketplaceGpsPing(Base):
    __tablename__ = "marketplace_gps_pings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    shipment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)

    driver_id: Mapped[str] = mapped_column(String(255), index=True)

    latitude: Mapped[float] = mapped_column(Float)

    longitude: Mapped[float] = mapped_column(Float)

    speed_kmh: Mapped[float | None] = mapped_column(Float, nullable=True)

    heading_degrees: Mapped[float | None] = mapped_column(Float, nullable=True)

    distance_to_dropoff_km: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
