from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from sentinel_app.db.session import Base


class UatHandoverLink(Base):
    """Registry of minted UAT handover links.

    Enables revocation and per-access auditing. Only a hash of the token is
    stored — the raw token is bearer material and never persisted.
    """

    __tablename__ = "uat_handover_links"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    expires_at: Mapped[int] = mapped_column(BigInteger, nullable=False)
    created_by: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    revoked_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
