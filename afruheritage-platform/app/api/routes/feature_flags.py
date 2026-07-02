from __future__ import annotations

from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_superuser
from app.db.session import get_db
from app.models.feature_flags import FeatureFlag
from app.models.user import User

router = APIRouter(prefix="/admin/features", tags=["Feature Flags"])


# ----- Schemas -----
class FeatureFlagUpdate(BaseModel):
    enabled: bool


class FeatureFlagResponse(BaseModel):
    id: str
    key: str
    label: str
    description: Optional[str]
    enabled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ----- Endpoints -----
@router.get("", response_model=list[FeatureFlagResponse])
def list_feature_flags(
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """List all feature flags (admin only)."""
    flags = db.scalars(select(FeatureFlag).order_by(FeatureFlag.key)).all()
    return flags


@router.patch("/{flag_key}", response_model=FeatureFlagResponse)
def toggle_feature_flag(
    flag_key: str,
    data: FeatureFlagUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Toggle a feature flag (admin only)."""
    flag = db.scalar(select(FeatureFlag).where(FeatureFlag.key == flag_key))
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    
    flag.enabled = data.enabled
    db.add(flag)
    db.commit()
    db.refresh(flag)
    return flag


# Seed default feature flags
DEFAULT_FLAGS = [
    {
        "key": "marketplace_enabled",
        "label": "Marketplace",
        "description": "Enable delivery marketplace for shipment posting and bidding",
        "enabled": True,
    },
    {
        "key": "vendor_registration",
        "label": "Vendor Registration",
        "description": "Allow new vendor registrations",
        "enabled": True,
    },
    {
        "key": "gps_tracking",
        "label": "GPS Tracking",
        "description": "Enable real-time GPS tracking for deliveries",
        "enabled": True,
    },
    {
        "key": "public_tracking",
        "label": "Public Tracking",
        "description": "Allow unauthenticated public tracking of shipments",
        "enabled": True,
    },
    {
        "key": "csv_import",
        "label": "CSV Import",
        "description": "Enable bulk shipment import via CSV",
        "enabled": True,
    },
    {
        "key": "group_members",
        "label": "Group Members",
        "description": "Enable group member management for shipments",
        "enabled": True,
    },
]


def seed_default_flags(db: Session) -> None:
    """Seed default feature flags if they don't exist."""
    for flag_data in DEFAULT_FLAGS:
        existing = db.scalar(select(FeatureFlag).where(FeatureFlag.key == flag_data["key"]))
        if not existing:
            flag = FeatureFlag(**flag_data)
            db.add(flag)
    db.commit()
