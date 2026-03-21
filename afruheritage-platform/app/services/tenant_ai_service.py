from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.orm import Session

from app.models.tenant_ai_settings import TenantAISettings

logger = logging.getLogger("afruheritage.ai")


def ensure_tenant_ai_settings(db: Session, tenant_id: str, tenant_slug: str, company_name: str) -> TenantAISettings:
    existing = db.query(TenantAISettings).filter(TenantAISettings.tenant_id == tenant_id).first()
    if existing:
        return existing

    settings = TenantAISettings(
        tenant_id=tenant_id,
        widget_enabled=True,
        chat_model="afruheritage-copilot:latest",
        retrieval_scope=f"tenant:{tenant_slug}",
        welcome_message=f"Welcome to {company_name} Assistant. How can I help you today?",
        theme="light",
        primary_color="#0ea5e9",
        allowed_hostnames=f"{tenant_slug}.afruheritage.com",
    )
    db.add(settings)
    db.commit()
    db.refresh(settings)
    logger.info("Created AI settings for tenant %s", tenant_slug)
    return settings


def get_tenant_ai_settings_by_hostname(db: Session, hostname: str) -> TenantAISettings | None:
    rows = db.query(TenantAISettings).all()
    for row in rows:
        allowed = [h.strip() for h in (row.allowed_hostnames or "").split(",") if h.strip()]
        if hostname in allowed:
            return row
    return None


def update_tenant_ai_settings(db: Session, tenant_id: str, **kwargs: Any) -> TenantAISettings | None:
    settings = db.query(TenantAISettings).filter(TenantAISettings.tenant_id == tenant_id).first()
    if not settings:
        return None
    for key, value in kwargs.items():
        if hasattr(settings, key) and value is not None:
            setattr(settings, key, value)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings
