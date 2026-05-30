from __future__ import annotations
from app.core.config import settings

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


def enum_values(enum_cls):
    return [e.value for e in enum_cls]


class RuntimeStatus(str, PyEnum):
    REQUESTED = "requested"
    QUEUED = "queued"
    PREPARING_RUNNER = "preparing_runner"
    INSTALLING = "installing"
    CONFIGURING = "configuring"
    HEALTH_CHECKING = "health_checking"
    ACTIVE = "active"
    FAILED = "failed"
    SUSPENDED = "suspended"
    DECOMMISSIONED = "decommissioned"


class RunnerStatus(str, PyEnum):
    ACTIVE = "active"
    DRAINING = "draining"
    DISABLED = "disabled"


class FleetbaseRuntime(Base):
    __tablename__ = "fleetbase_runtimes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, unique=True, index=True)
    tenant_slug: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    runner_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)

    status: Mapped[RuntimeStatus] = mapped_column(
        Enum(RuntimeStatus, values_callable=enum_values),
        nullable=False,
        default=RuntimeStatus.REQUESTED,
    )
    install_directory: Mapped[str] = mapped_column(String(500), nullable=False)
    runtime_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    console_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    api_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    fleetbase_version: Mapped[str | None] = mapped_column(String(120), nullable=True)
    install_log_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_reference_install: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class FleetbaseRunnerNode(Base):
    __tablename__ = "fleetbase_runner_nodes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    hostname: Mapped[str] = mapped_column(String(255), nullable=False)
    ssh_port: Mapped[int] = mapped_column(Integer, nullable=False, default=22)
    ssh_user: Mapped[str] = mapped_column(String(120), nullable=False, default="afruheritage")
    root_runtime_path: Mapped[str] = mapped_column(String(500), nullable=False, default="/srv/afruheritage/tenants")
    status: Mapped[RunnerStatus] = mapped_column(
        Enum(RunnerStatus, values_callable=enum_values),
        nullable=False,
        default=RunnerStatus.ACTIVE,
    )
    max_tenants: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    current_tenants: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    supports_reference_install: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class FleetbaseRuntimeEvent(Base):
    __tablename__ = "fleetbase_runtime_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    runtime_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(120), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    payload_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
