from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


def enum_values(enum_cls):
    return [e.value for e in enum_cls]


class DomainType(str, PyEnum):
    PLATFORM_SUBDOMAIN = "platform_subdomain"
    CUSTOMER_SUBDOMAIN = "customer_subdomain"
    APEX = "apex"


class DomainStatus(str, PyEnum):
    REQUESTED = "requested"
    PENDING_VERIFICATION = "pending_verification"
    PENDING_SSL = "pending_ssl"
    ACTIVE = "active"
    FAILED = "failed"
    DISABLED = "disabled"
    REMOVED = "removed"


class VerificationMethod(str, PyEnum):
    TXT = "txt"
    CNAME = "cname"
    HTTP = "http"
    NONE = "none"


class DomainProvider(str, PyEnum):
    CLOUDFLARE = "cloudflare"
    INTERNAL = "internal"


class CustomDomain(Base):
    __tablename__ = "custom_domains"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)

    hostname: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    domain_type: Mapped[DomainType] = mapped_column(
        Enum(DomainType, values_callable=enum_values),
        nullable=False,
    )
    status: Mapped[DomainStatus] = mapped_column(
        Enum(DomainStatus, values_callable=enum_values),
        nullable=False,
        default=DomainStatus.REQUESTED,
    )
    provider: Mapped[DomainProvider] = mapped_column(
        Enum(DomainProvider, values_callable=enum_values),
        nullable=False,
        default=DomainProvider.CLOUDFLARE,
    )

    verification_method: Mapped[VerificationMethod] = mapped_column(
        Enum(VerificationMethod, values_callable=enum_values),
        nullable=False,
        default=VerificationMethod.NONE,
    )
    verification_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verification_value: Mapped[str | None] = mapped_column(Text, nullable=True)

    ssl_status: Mapped[str | None] = mapped_column(String(100), nullable=True)
    routing_target: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cloudflare_hostname_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    fallback_hostname: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fallback_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class CustomDomainEvent(Base):
    __tablename__ = "custom_domain_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    domain_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("custom_domains.id"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    payload_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class TenantDomainSettings(Base):
    __tablename__ = "tenant_domain_settings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, unique=True, index=True)

    platform_subdomain: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    active_primary_hostname: Mapped[str] = mapped_column(String(255), nullable=False)
    fallback_hostname: Mapped[str] = mapped_column(String(255), nullable=False)
    fallback_always_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
