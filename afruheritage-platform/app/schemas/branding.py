from __future__ import annotations
from app.core.config import settings

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BrandingUpdate(BaseModel):
    company_name: str | None = None
    tagline: str | None = None
    logo_url: str | None = None
    favicon_url: str | None = None
    primary_color: str | None = None
    secondary_color: str | None = None
    accent_color: str | None = None
    background_color: str | None = None
    legal_company_name: str | None = None
    legal_footer_text: str | None = None
    terms_url: str | None = None
    privacy_url: str | None = None
    support_email: str | None = None
    support_phone: str | None = None
    support_url: str | None = None
    notification_from_name: str | None = None
    notification_from_email: str | None = None
    email_signature_html: str | None = None
    default_language: str | None = None
    supported_languages: str | None = None
    storefront_config: dict | None = None


class BrandingResponse(BaseModel):
    id: str
    tenant_id: str
    company_name: str
    tagline: str | None = None
    logo_url: str | None = None
    favicon_url: str | None = None
    primary_color: str
    secondary_color: str
    accent_color: str
    background_color: str
    legal_company_name: str | None = None
    legal_footer_text: str | None = None
    terms_url: str | None = None
    privacy_url: str | None = None
    support_email: str | None = None
    support_phone: str | None = None
    support_url: str | None = None
    notification_from_name: str | None = None
    notification_from_email: str | None = None
    default_language: str
    supported_languages: str
    maps_enabled: bool
    public_tracking_enabled: bool
    csv_import_enabled: bool
    group_members_enabled: bool
    max_group_members: int
    template_code: str | None = None
    storefront_config: dict | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
