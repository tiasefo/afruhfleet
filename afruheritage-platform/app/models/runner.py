"""
Runner Node Model (STUB - Single Shared Fleetbase Instance)

This is a stub implementation since Afruheritage uses a single shared Fleetbase instance
at http://10.0.0.115:8003 with org-level isolation (fleetbase_org_id), not per-tenant
container orchestration.

This model is kept for API compatibility but is not used in the current architecture.
"""
import uuid
from datetime import datetime
from sqlalchemy import Integer, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class RunnerNode(Base):
    """Stub model for runner nodes (not used in single shared Fleetbase architecture)."""
    __tablename__ = "runner_nodes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    hostname: Mapped[str] = mapped_column(String(255), nullable=False)
    ssh_port: Mapped[int] = mapped_column(Integer, nullable=False, default=22)
    ssh_user: Mapped[str] = mapped_column(String(120), nullable=False, default="afruheritage")
    root_runtime_path: Mapped[str] = mapped_column(String(500), nullable=False, default="/srv/afruheritage/tenants")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
