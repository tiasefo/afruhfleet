from __future__ import annotations
from app.core.config import settings

import logging
import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.models.tenant_branding import TenantBranding

logger = logging.getLogger("afruheritage.branding")


def _as_uuid(value: str | uuid.UUID):
    try:
        return uuid.UUID(str(value))
    except (TypeError, ValueError):
        return value


def ensure_tenant_branding(
    db: Session,
    tenant_id: str,
    company_name: str,
    contact_email: str | None = None,
) -> TenantBranding:
    tenant_pk = _as_uuid(tenant_id)
    existing = db.query(TenantBranding).filter(TenantBranding.tenant_id == tenant_pk).first()
    if existing:
        return existing

    branding = TenantBranding(
        tenant_id=tenant_pk,
        company_name=company_name,
        primary_color="#0ea5e9",
        secondary_color="#1e293b",
        accent_color="#f59e0b",
        background_color="#ffffff",
        support_email=contact_email,
        notification_from_name=company_name,
        notification_from_email=contact_email,
        default_language="en",
        supported_languages="en,zh",
        maps_enabled=True,
        public_tracking_enabled=True,
        csv_import_enabled=True,
        group_members_enabled=True,
        max_group_members=5000,
    )
    db.add(branding)
    db.commit()
    db.refresh(branding)
    logger.info("Created branding for tenant %s", company_name)
    return branding


def get_tenant_branding(db: Session, tenant_id: str) -> TenantBranding | None:
    return db.query(TenantBranding).filter(TenantBranding.tenant_id == _as_uuid(tenant_id)).first()


def update_tenant_branding(db: Session, tenant_id: str, **kwargs: Any) -> TenantBranding | None:
    branding = db.query(TenantBranding).filter(TenantBranding.tenant_id == _as_uuid(tenant_id)).first()
    if not branding:
        return None
    for key, value in kwargs.items():
        if value is not None and hasattr(branding, key):
            setattr(branding, key, value)
    db.commit()
    db.refresh(branding)
    return branding
