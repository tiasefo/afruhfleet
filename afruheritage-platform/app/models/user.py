import uuid
import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.rbac import UserRole as UserRBACRole


class UserRole(str, enum.Enum):
    personal_shipper = "personal_shipper"   # Individual sending packages
    delivery_driver  = "delivery_driver"    # Rider / truck driver on the marketplace
    company_admin    = "company_admin"      # Freight forwarding company owner
    platform_admin   = "platform_admin"     # Afruheritage superuser
    dispatcher       = "dispatcher"         # Dispatch coordinator
    warehouse        = "warehouse"          # Warehouse staff
    customer         = "customer"           # Customer account
    vendor           = "vendor"             # Delivery vendor
    support          = "support"            # Support staff
    accounting       = "accounting"         # Accounting/finance staff


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
    onboarding_complete: Mapped[bool] = mapped_column(Boolean, default=False, server_default='false')
    must_reset_password: Mapped[bool] = mapped_column(Boolean, default=False)
    password_reset_token: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    password_reset_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # RBAC Relationships
    # NOTE: Role enum is stored in `role`; do not map enum UserRole as relationship.
    user_roles: Mapped[list[UserRBACRole]] = relationship(
        UserRBACRole,
        back_populates="user",
        foreign_keys=[UserRBACRole.user_id],
    )
    activity_logs: Mapped[list["UserActivityLog"]] = relationship("UserActivityLog", back_populates="user")
    sessions: Mapped[list["UserSession"]] = relationship("UserSession", back_populates="user")
