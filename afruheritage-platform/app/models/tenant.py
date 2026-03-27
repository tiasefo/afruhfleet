import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class DomainType(str, enum.Enum):
    provider_subdomain = 'provider_subdomain'
    customer_domain = 'customer_domain'


class LaunchStatus(str, enum.Enum):
    draft = 'draft'
    pending_verification = 'pending_verification'
    approved = 'approved'
    queued = 'queued'
    provisioning = 'provisioning'
    active = 'active'
    failed = 'failed'
    suspended = 'suspended'


class Tenant(Base):
    __tablename__ = 'tenants'

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    company_name: Mapped[str] = mapped_column(String(255), unique=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    contact_email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    plan_code: Mapped[str] = mapped_column(String(80))
    requested_domain: Mapped[str] = mapped_column(String(255), unique=True)
    domain_type: Mapped[DomainType] = mapped_column(Enum(DomainType), default=DomainType.provider_subdomain)
    launch_status: Mapped[LaunchStatus] = mapped_column(Enum(LaunchStatus), default=LaunchStatus.pending_verification)
    verification_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    runner_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey('runner_nodes.id'), nullable=True)
    live_console_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    live_api_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fleetbase_install_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    subdomain: Mapped[str | None] = mapped_column(String(120), unique=False, index=True, nullable=True)
    custom_domain: Mapped[str | None] = mapped_column(String(255), unique=False, nullable=True)
    custom_domain_verified: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    runner = relationship('RunnerNode')
    jobs = relationship('ProvisioningJob', back_populates='tenant', cascade='all, delete-orphan')


class ProvisioningJob(Base):
    __tablename__ = 'provisioning_jobs'

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('tenants.id'), index=True)
    status: Mapped[LaunchStatus] = mapped_column(Enum(LaunchStatus), default=LaunchStatus.queued)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    task_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship('Tenant', back_populates='jobs')
