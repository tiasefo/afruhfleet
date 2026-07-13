from __future__ import annotations

import json
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.platform_config import PlatformSettings, PlanTierConfig

_DEFAULT_TRIAL_DAYS = 14


def get_default_trial_days(db: Session) -> int:
    """Read default_trial_days from PlatformSettings, falling back to 14 if no row exists."""
    settings = db.query(PlatformSettings).first()
    if settings:
        return settings.default_trial_days
    return _DEFAULT_TRIAL_DAYS


def get_trial_end_date(db: Session, now: datetime | None = None) -> datetime:
    """Return now + default_trial_days."""
    if now is None:
        now = datetime.utcnow()
    return now + timedelta(days=get_default_trial_days(db))


def ensure_platform_settings(db: Session) -> PlatformSettings:
    """Get or create the singleton PlatformSettings row."""
    settings = db.query(PlatformSettings).first()
    if settings:
        return settings
    settings = PlatformSettings(default_trial_days=_DEFAULT_TRIAL_DAYS)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def get_plan_tier_configs(db: Session, active_only: bool = False) -> list[PlanTierConfig]:
    query = db.query(PlanTierConfig)
    if active_only:
        query = query.filter(PlanTierConfig.is_active == True)
    return query.all()


def get_plan_tier_config(db: Session, tier_code: str) -> PlanTierConfig | None:
    return db.query(PlanTierConfig).filter(PlanTierConfig.tier_code == tier_code).first()


def get_tier_features(db: Session, tier_code: str) -> list[str]:
    """Return the feature list for a tier, from PlanTierConfig if available."""
    config = get_plan_tier_config(db, tier_code)
    if config:
        try:
            return json.loads(config.features_json)
        except (json.JSONDecodeError, TypeError):
            pass
    return []
