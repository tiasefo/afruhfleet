from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class TenantTheme(BaseModel):
    primary_color: str = "#0ea5e9"
    secondary_color: str = "#1e293b"
    accent_color: str = "#f59e0b"
    background_color: str = "#ffffff"
    foreground_color: str = "#0f172a"
    success_color: str = "#22c55e"
    warning_color: str = "#f59e0b"
    danger_color: str = "#ef4444"
    font_family: str = "Inter, sans-serif"
    radius: str = "0.625rem"
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    og_image_url: Optional[str] = None


class TenantContact(BaseModel):
    support_email: Optional[str] = None
    support_phone: Optional[str] = None
    support_url: Optional[str] = None
    notification_from_name: Optional[str] = None
    notification_from_email: Optional[str] = None


class TenantLegal(BaseModel):
    legal_company_name: Optional[str] = None
    legal_footer_text: Optional[str] = None
    terms_url: Optional[str] = None
    privacy_url: Optional[str] = None


class TenantFeatureFlags(BaseModel):
    maps_enabled: bool = True
    public_tracking_enabled: bool = True
    csv_import_enabled: bool = True
    group_members_enabled: bool = True
    max_group_members: int = 5000
    ai_enabled: bool = False
    marketplace_enabled: bool = False
    custom_domains_enabled: bool = False


class TenantSubscriptionInfo(BaseModel):
    plan_code: str = "free"
    status: str = "active"
    trial: bool = False
    credits_balance: int = 0
    features: list[str] = []


class TenantSEO(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    keywords: list[str] = []
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    twitter_card: str = "summary_large_image"
    canonical_url: Optional[str] = None
    robots: str = "index, follow"


class TenantContextResponse(BaseModel):
    id: str
    slug: str
    company_name: str
    tagline: Optional[str] = None
    domain: Optional[str] = None
    subdomain: Optional[str] = None
    custom_domain: Optional[str] = None
    whatsapp_channel_url: Optional[str] = None
    default_language: str = "en"
    supported_languages: list[str] = ["en"]
    template_code: Optional[str] = None
    storefront_config: Optional[dict] = None
    theme: TenantTheme
    contact: TenantContact
    legal: TenantLegal
    features: TenantFeatureFlags
    subscription: TenantSubscriptionInfo
    seo: TenantSEO
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
