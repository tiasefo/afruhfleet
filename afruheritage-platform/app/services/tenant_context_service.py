from __future__ import annotations

import json
import logging
import uuid
from typing import Optional

from sqlalchemy.orm import Session

from app.models.tenant import Tenant
from app.models.tenant_branding import TenantBranding
from app.models.saas_subscription import TenantSubscription, SaaSPlan
from app.schemas.tenant_context import (
    TenantContextResponse,
    TenantTheme,
    TenantContact,
    TenantLegal,
    TenantFeatureFlags,
    TenantSubscriptionInfo,
    TenantSEO,
)

logger = logging.getLogger("afruheritage.tenant_context")


def _as_uuid(value: str | uuid.UUID):
    try:
        return uuid.UUID(str(value))
    except (TypeError, ValueError):
        return None


def resolve_tenant_by_slug(db: Session, slug: str) -> Optional[Tenant]:
    return db.query(Tenant).filter(Tenant.slug == slug).first()


def resolve_tenant_by_subdomain(db: Session, subdomain: str) -> Optional[Tenant]:
    return db.query(Tenant).filter(Tenant.subdomain == subdomain).first()


def resolve_tenant_by_domain(db: Session, domain: str) -> Optional[Tenant]:
    return db.query(Tenant).filter(Tenant.custom_domain == domain).first()


def resolve_tenant(db: Session, identifier: str) -> Optional[Tenant]:
    """Resolve a tenant by UUID, slug, subdomain, or custom domain."""
    tenant_uuid = _as_uuid(identifier)
    if tenant_uuid:
        tenant = db.query(Tenant).filter(Tenant.id == tenant_uuid).first()
        if tenant:
            return tenant

    tenant = resolve_tenant_by_slug(db, identifier)
    if tenant:
        return tenant

    tenant = resolve_tenant_by_subdomain(db, identifier)
    if tenant:
        return tenant

    tenant = resolve_tenant_by_domain(db, identifier)
    if tenant:
        return tenant

    return None


def _get_subscription_info(db: Session, tenant_id: str) -> TenantSubscriptionInfo:
    sub = db.query(TenantSubscription).filter(
        TenantSubscription.tenant_id == str(tenant_id)
    ).first()

    if not sub:
        return TenantSubscriptionInfo()

    features: list[str] = []
    plan = db.query(SaaSPlan).filter(SaaSPlan.code == sub.plan_code).first()
    if plan and plan.features_json:
        try:
            features = json.loads(plan.features_json)
        except (json.JSONDecodeError, TypeError):
            features = []

    return TenantSubscriptionInfo(
        plan_code=sub.plan_code,
        status=sub.status,
        trial=sub.trial,
        credits_balance=sub.credits_balance,
        features=features,
    )


def build_tenant_context(
    db: Session,
    tenant: Tenant,
    branding: Optional[TenantBranding] = None,
) -> TenantContextResponse:
    """Assemble a complete TenantContext from Tenant + Branding + Subscription."""

    if branding is None:
        branding = db.query(TenantBranding).filter(
            TenantBranding.tenant_id == tenant.id
        ).first()

    sub_info = _get_subscription_info(db, str(tenant.id))

    if branding:
        supported_langs = [
            lang.strip()
            for lang in (branding.supported_languages or "en").split(",")
            if lang.strip()
        ]

        theme = TenantTheme(
            primary_color=branding.primary_color,
            secondary_color=branding.secondary_color,
            accent_color=branding.accent_color,
            background_color=branding.background_color,
            foreground_color="#0f172a",
            success_color="#22c55e",
            warning_color="#f59e0b",
            danger_color="#ef4444",
            font_family="Inter, sans-serif",
            radius="0.625rem",
            logo_url=branding.logo_url,
            favicon_url=branding.favicon_url,
            og_image_url=None,
        )

        contact = TenantContact(
            support_email=branding.support_email,
            support_phone=branding.support_phone,
            support_url=branding.support_url,
            notification_from_name=branding.notification_from_name,
            notification_from_email=branding.notification_from_email,
        )

        legal = TenantLegal(
            legal_company_name=branding.legal_company_name,
            legal_footer_text=branding.legal_footer_text,
            terms_url=branding.terms_url,
            privacy_url=branding.privacy_url,
        )

        features = TenantFeatureFlags(
            maps_enabled=branding.maps_enabled,
            public_tracking_enabled=branding.public_tracking_enabled,
            csv_import_enabled=branding.csv_import_enabled,
            group_members_enabled=branding.group_members_enabled,
            max_group_members=branding.max_group_members,
            ai_enabled="ai_basic" in sub_info.features or "ai_advanced" in sub_info.features,
            marketplace_enabled="marketplace_basic" in sub_info.features or "marketplace_gps" in sub_info.features,
            custom_domains_enabled=tenant.custom_domain is not None,
        )

        seo = TenantSEO(
            title=f"{branding.company_name} | {branding.tagline or 'Logistics & Freight Forwarding'}",
            description=branding.tagline or f"{branding.company_name} — professional logistics and freight forwarding services.",
            keywords=["logistics", "freight forwarding", "shipping", "cargo"],
            og_title=f"{branding.company_name}",
            og_description=branding.tagline or f"{branding.company_name} — professional logistics and freight forwarding services.",
            twitter_card="summary_large_image",
            canonical_url=tenant.custom_domain or f"https://{tenant.subdomain}" if tenant.subdomain else None,
            robots="index, follow",
        )

        return TenantContextResponse(
            id=str(tenant.id),
            slug=tenant.slug,
            company_name=branding.company_name,
            tagline=branding.tagline,
            domain=tenant.requested_domain,
            subdomain=tenant.subdomain,
            custom_domain=tenant.custom_domain,
            default_language=branding.default_language,
            supported_languages=supported_langs,
            template_code=branding.template_code,
            storefront_config=branding.storefront_config,
            theme=theme,
            contact=contact,
            legal=legal,
            features=features,
            subscription=sub_info,
            seo=seo,
            created_at=branding.created_at,
            updated_at=branding.updated_at,
        )

    # Fallback: no branding row exists yet — return defaults with tenant data
    theme = TenantTheme()
    contact = TenantContact()
    legal = TenantLegal()
    features = TenantFeatureFlags(
        custom_domains_enabled=tenant.custom_domain is not None,
    )
    seo = TenantSEO(
        title=f"{tenant.company_name} | Logistics & Freight Forwarding",
        description=f"{tenant.company_name} — professional logistics and freight forwarding services.",
        keywords=["logistics", "freight forwarding", "shipping", "cargo"],
        og_title=tenant.company_name,
        og_description=f"{tenant.company_name} — professional logistics and freight forwarding services.",
        twitter_card="summary_large_image",
        robots="index, follow",
    )

    return TenantContextResponse(
        id=str(tenant.id),
        slug=tenant.slug,
        company_name=tenant.company_name,
        tagline=None,
        domain=tenant.requested_domain,
        subdomain=tenant.subdomain,
        custom_domain=tenant.custom_domain,
        default_language="en",
        supported_languages=["en"],
        template_code=None,
        storefront_config=None,
        theme=theme,
        contact=contact,
        legal=legal,
        features=features,
        subscription=sub_info,
        seo=seo,
    )


def get_tenant_context(db: Session, identifier: str) -> Optional[TenantContextResponse]:
    """Public entry point: resolve tenant and build full context."""
    tenant = resolve_tenant(db, identifier)
    if not tenant:
        return None
    return build_tenant_context(db, tenant)


def get_tenant_from_request(request, db: Session) -> Optional[Tenant]:
    """Extract tenant from request based on subdomain or custom domain."""
    from fastapi import Request
    
    # Try to get tenant from subdomain
    host = request.headers.get("host", "")
    if ":" in host:
        host = host.split(":")[0]
    
    # Check if it's a subdomain format (tenant.afruheritage.com)
    parts = host.split(".")
    if len(parts) >= 3:
        subdomain = parts[0]
        tenant = resolve_tenant_by_subdomain(db, subdomain)
        if tenant:
            return tenant
    
    # Check custom domain
    tenant = resolve_tenant_by_domain(db, host)
    if tenant:
        return tenant
    
    return None
