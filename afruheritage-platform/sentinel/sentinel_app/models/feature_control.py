from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from sentinel_app.db.session import Base


class FeaturePhase(str, enum.Enum):
    PHASE_1 = "phase_1"
    PHASE_2 = "phase_2"
    PHASE_3 = "phase_3"


class FeatureCode(str, enum.Enum):
    # Phase 1
    POD = "pod"
    CONTACTS_PLACES = "contacts_places"
    SERVICE_RATES = "service_rates"
    # Phase 2
    DISPATCH_ENGINE = "dispatch_engine"
    ROUTE_PLANNING = "route_planning"
    WEBHOOKS = "webhooks"
    NOTIFICATIONS = "notifications"
    # Phase 3
    ROUTE_OPTIMIZATION = "route_optimization"
    VRP_SOLVER = "vrp_solver"
    DRIVER_MOBILE_APP = "driver_mobile_app"
    # Shared Services (Tenant-level, always inherited)
    SHIPMENTS = "shipments"
    GROUP_MEMBERS = "group_members"
    CSV_IMPORT = "csv_import"
    PUBLIC_TRACKING = "public_tracking"
    MAPS = "maps"
    STOREFRONT = "storefront"


class GlobalFeatureFlag(Base):
    """Platform-wide feature flags — controlled from Sentinel Control Center."""

    __tablename__ = "global_feature_flags"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    feature_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    phase: Mapped[str] = mapped_column(String(16), nullable=False, default=FeaturePhase.PHASE_1.value)
    display_name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    enabled_globally: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    requires_plan_upgrade: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    min_plan_code: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class TenantFeatureAssignment(Base):
    """Per-tenant override of feature availability — controlled from Sentinel Control Center."""

    __tablename__ = "tenant_feature_assignments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    feature_code: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    enabled_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (UniqueConstraint("tenant_id", "feature_code", name="uq_tenant_feature"),)
