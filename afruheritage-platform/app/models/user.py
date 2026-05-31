import uuid
import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class UserRole(str, enum.Enum):
    personal_shipper = "personal_shipper"   # Individual sending packages
    delivery_driver  = "delivery_driver"    # Rider / truck driver on the marketplace
    company_admin    = "company_admin"      # Freight forwarding company owner
    platform_admin   = "platform_admin"     # Afruheritage superuser


class User(Base):
    __tablename__ = 'users'

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), default=UserRole.personal_shipper, nullable=False
    )
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey('tenants.id'), nullable=True, index=True)
    is_tenant_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    must_reset_password: Mapped[bool] = mapped_column(Boolean, default=False)
    password_reset_token: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    password_reset_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
