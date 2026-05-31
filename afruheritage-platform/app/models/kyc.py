from app.core.config import settings
import uuid
import enum
from datetime import datetime
from sqlalchemy import Enum, ForeignKey, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

class KYCStatus(str, enum.Enum):
    not_started = "not_started"
    pending     = "pending"       # Submitted, awaiting admin review
    approved    = "approved"
    rejected    = "rejected"
    queried     = "queried"       # Admin has a question / needs more info
    failed      = "failed"        # Technical failure during submission

class KYCSubmission(Base):
    __tablename__ = "kyc_submissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Document details
    id_type: Mapped[str | None] = mapped_column(String(50), nullable=True)         # ghana_card, passport, voter_id, drivers_license
    id_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)      # As on the ID

    # Uploaded files
    id_front_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    id_back_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    liveness_photo_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    liveness_video_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    # Parsed / extracted data (JSON strings)
    mrz_data: Mapped[str | None] = mapped_column(Text, nullable=True)     # Passport MRZ fields as JSON
    parsed_info: Mapped[str | None] = mapped_column(Text, nullable=True)  # Extracted name, DOB, expiry, etc.

    # Review
    status: Mapped[KYCStatus] = mapped_column(Enum(KYCStatus), default=KYCStatus.not_started, nullable=False)
    admin_note: Mapped[str | None] = mapped_column(Text, nullable=True)   # Shown to user on reject / query
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Legacy field kept for backwards compatibility
    result: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
