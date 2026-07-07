from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_superuser, require_tenant_admin
from app.core.redis_client import cache_get, cache_set, cache_delete_pattern
from app.db.session import get_db
from app.models.storefront_template import StorefrontTemplate
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.storefront_template import StorefrontTemplateResponse, TenantTemplateSelectionRequest

router = APIRouter(prefix='/storefront-templates', tags=['Storefront Templates'])


class TemplateCreateRequest(BaseModel):
    template_code: str
    name: str
    description: Optional[str] = None
    preset: dict


class TemplateUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    preset: Optional[dict] = None
    is_active: Optional[bool] = None


DEFAULT_TEMPLATES = [
    {
        "template_code": "amooksco",
        "name": "Amooksco Logistics",
        "description": "Specialized China-Ghana logistics storefront with tracking, shipping estimator, and WhatsApp integration.",
        "preset": {
            "primary_color": "#1f5d72",
            "secondary_color": "#3aa6b9",
            "accent_color": "#eef6f8",
            "background_color": "#ffffff",
            "font_family": "Inter, sans-serif",
            "header_style": "white",
            "footer_style": "dark",
            "card_style": "rounded",
            "theme_class": "theme-amooksco",
            "image": "/images/amooksco-hero.png",
            "swatches": ["#1f5d72", "#3aa6b9", "#eef6f8"],
            "tags": ["Freight", "China-Ghana", "Tracking", "WhatsApp"],
            "storage_fees_enabled": True,
            "required_endpoints": [
                "GET /api/v1/fleetbase-proxy/drivers",
                "GET /api/v1/fleetbase-proxy/vehicles",
                "GET /api/v1/fleetbase-proxy/fleets",
                "GET /api/v1/fleetbase-proxy/orders",
                "GET /api/v1/shipments/{tenant_id}/track",
                "GET /api/v1/shipments/public/track/{tenant_id}/{tracking_number}",
                "POST /api/v1/shipments/{tenant_id}/import/csv",
                "GET /api/v1/ai/chat",
            ],
            "features": ["tracking", "bulk_import", "ai_chat", "fleetbase_integration", "shipping_estimator"],
            "fallbacks": {
                "tracking": "show_mock_data",
                "fleetbase_integration": "show_static_message",
                "ai_chat": "hide_widget",
                "shipping_estimator": "use_default_rates",
            },
        },
    },
    {
        "template_code": "freight",
        "name": "Meridian Freight",
        "description": "Ocean, air, and land freight forwarding storefront with live quote and tracking flows.",
        "preset": {
            "primary_color": "#1f5d72",
            "secondary_color": "#3aa6b9",
            "accent_color": "#eef6f8",
            "background_color": "#ffffff",
            "font_family": "Inter, sans-serif",
            "header_style": "white",
            "footer_style": "dark",
            "card_style": "rounded",
            "theme_class": "theme-freight",
            "image": "/images/freight-hero.png",
            "swatches": ["#1f5d72", "#3aa6b9", "#eef6f8"],
            "tags": ["Freight", "Customs", "Tracking"],
            "storage_fees_enabled": True,
            "required_endpoints": [
                "GET /api/v1/shipments/{tenant_id}/track",
                "POST /api/v1/shipments/{tenant_id}/import/csv",
                "GET /api/v1/shipments/{tenant_id}/members",
                "GET /api/v1/ai/chat",
                "GET /api/v1/shipments/public/track/{tenant_id}/{tracking_number}",
            ],
            "features": ["tracking", "bulk_import", "members", "ai_chat", "warehouse_notices", "customs_calculator", "storage_fees"],
            "fallbacks": {
                "tracking": "show_static_message",
                "ai_chat": "hide_widget",
                "warehouse_notices": "hide_section",
                "customs_calculator": "hide_section",
                "storage_fees": "hide_column",
            },
        },
    },
    {
        "template_code": "fleet",
        "name": "Vanta Fleet",
        "description": "Logistics-grade storefront for fleet operators — vehicle leasing, dispatch, and route management.",
        "preset": {
            "primary_color": "#26324d",
            "secondary_color": "#e8a13a",
            "accent_color": "#f4f5f8",
            "background_color": "#ffffff",
            "font_family": "Inter, sans-serif",
            "header_style": "dark",
            "footer_style": "dark",
            "card_style": "rounded",
            "theme_class": "theme-fleet",
            "image": "/images/fleet-hero.png",
            "swatches": ["#26324d", "#e8a13a", "#f4f5f8"],
            "tags": ["Logistics", "Leasing", "Dispatch"],
            "storage_fees_enabled": True,
            "required_endpoints": [
                "GET /api/v1/shipments/{tenant_id}/track",
                "POST /api/v1/shipments/{tenant_id}/import/csv",
                "GET /api/v1/shipments/{tenant_id}/members",
                "GET /api/v1/ai/chat",
                "GET /api/v1/vendors/marketplace",
            ],
            "features": ["tracking", "bulk_import", "members", "ai_chat", "maps", "vendor_marketplace", "bus_fleet", "storage_fees"],
            "fallbacks": {
                "tracking": "show_static_message",
                "ai_chat": "hide_widget",
                "maps": "hide_section",
                "vendor_marketplace": "hide_section",
                "bus_fleet": "hide_section",
                "storage_fees": "hide_column",
            },
        },
    },
    {
        "template_code": "ecommerce",
        "name": "Verde Goods",
        "description": "Clean, conversion-focused product store with collections, cart, and editorial sections.",
        "preset": {
            "primary_color": "#2f9e6b",
            "secondary_color": "#e7c14b",
            "accent_color": "#fbfaf4",
            "background_color": "#ffffff",
            "font_family": "Inter, sans-serif",
            "header_style": "white",
            "footer_style": "light",
            "card_style": "rounded",
            "theme_class": "theme-ecommerce",
            "image": "/images/ecommerce-hero.png",
            "swatches": ["#2f9e6b", "#e7c14b", "#fbfaf4"],
            "tags": ["Retail", "Cart", "Collections"],
            "storage_fees_enabled": False,
            "required_endpoints": ["GET /api/v1/ai/chat", "GET /api/v1/shipments/public/track/{tenant_id}/{tracking_number}"],
            "features": ["ai_chat", "tracking"],
            "fallbacks": {"ai_chat": "hide_widget", "tracking": "hide_section"},
        },
    },
    {
        "template_code": "mall",
        "name": "Lumière Mall",
        "description": "Premium multi-brand mall directory with stores, dining, events, and floor guide.",
        "preset": {
            "primary_color": "#2b2722",
            "secondary_color": "#c79a4a",
            "accent_color": "#f5f1ea",
            "background_color": "#ffffff",
            "font_family": "Inter, sans-serif",
            "header_style": "dark",
            "footer_style": "dark",
            "card_style": "rounded",
            "theme_class": "theme-mall",
            "image": "/images/mall-hero.png",
            "swatches": ["#2b2722", "#c79a4a", "#f5f1ea"],
            "tags": ["Directory", "Brands", "Events"],
            "storage_fees_enabled": False,
            "required_endpoints": ["GET /api/v1/ai/chat"],
            "features": ["ai_chat"],
            "fallbacks": {"ai_chat": "hide_widget"},
        },
    },
    {
        "template_code": "bookings",
        "name": "Skyline Travel",
        "description": "Multi-modal booking storefront for flights, buses, and event tickets with a search engine.",
        "preset": {
            "primary_color": "#2f6fd1",
            "secondary_color": "#f08a32",
            "accent_color": "#eef4fd",
            "background_color": "#ffffff",
            "font_family": "Inter, sans-serif",
            "header_style": "white",
            "footer_style": "light",
            "card_style": "rounded",
            "theme_class": "theme-bookings",
            "image": "/images/bookings-hero.png",
            "swatches": ["#2f6fd1", "#f08a32", "#eef4fd"],
            "tags": ["Flights", "Buses", "Tickets"],
            "storage_fees_enabled": False,
            "required_endpoints": ["GET /api/v1/ai/chat", "GET /api/v1/shipments/{tenant_id}/track"],
            "features": ["ai_chat", "tracking"],
            "fallbacks": {"ai_chat": "hide_widget", "tracking": "hide_section"},
        },
    },
    {
        "template_code": "restaurant",
        "name": "Ember & Oak",
        "description": "Atmospheric dining storefront with menu, reservations, and online ordering.",
        "preset": {
            "primary_color": "#c0432b",
            "secondary_color": "#e0a23c",
            "accent_color": "#241d18",
            "background_color": "#ffffff",
            "font_family": "Inter, sans-serif",
            "header_style": "dark",
            "footer_style": "dark",
            "card_style": "rounded",
            "theme_class": "theme-restaurant",
            "image": "/images/restaurant-hero.png",
            "swatches": ["#c0432b", "#e0a23c", "#241d18"],
            "tags": ["Menu", "Reservations", "Ordering"],
            "storage_fees_enabled": False,
            "required_endpoints": ["GET /api/v1/ai/chat"],
            "features": ["ai_chat"],
            "fallbacks": {"ai_chat": "hide_widget"},
        },
    },
    {
        "template_code": "realestate",
        "name": "Haven Estates",
        "description": "Refined property listing storefront with search, featured homes, and agent profiles.",
        "preset": {
            "primary_color": "#2f5d45",
            "secondary_color": "#b69a5e",
            "accent_color": "#faf8f2",
            "background_color": "#ffffff",
            "font_family": "Inter, sans-serif",
            "header_style": "white",
            "footer_style": "light",
            "card_style": "rounded",
            "theme_class": "theme-realestate",
            "image": "/images/realestate-hero.png",
            "swatches": ["#2f5d45", "#b69a5e", "#faf8f2"],
            "tags": ["Listings", "Search", "Agents"],
            "storage_fees_enabled": False,
            "required_endpoints": ["GET /api/v1/ai/chat"],
            "features": ["ai_chat"],
            "fallbacks": {"ai_chat": "hide_widget"},
        },
    },
]


def seed_default_templates(db: Session) -> None:
    for item in DEFAULT_TEMPLATES:
        existing = db.scalar(select(StorefrontTemplate).where(StorefrontTemplate.template_code == item["template_code"]))
        if not existing:
            template = StorefrontTemplate(
                template_code=item["template_code"],
                name=item["name"],
                description=item["description"],
                preset=json.dumps(item["preset"]),
                is_active=True,
            )
            db.add(template)
    db.commit()


@router.get('', response_model=list[StorefrontTemplateResponse])
def list_templates(db: Session = Depends(get_db), _: User = Depends(require_tenant_admin)):
    # Try to get from cache first
    cache_key = "storefront_templates:list"
    cached_templates = cache_get(cache_key)
    if cached_templates:
        return cached_templates

    # Cache miss - query database
    seed_default_templates(db)
    templates = db.scalars(select(StorefrontTemplate).where(StorefrontTemplate.is_active.is_(True))).all()
    
    result = [
        StorefrontTemplateResponse(
            id=t.id,
            template_code=t.template_code,
            name=t.name,
            description=t.description,
            preset=json.loads(t.preset),
            is_active=t.is_active,
            created_at=t.created_at,
        )
        for t in templates
    ]
    
    # Cache the result for 1 hour
    cache_set(cache_key, result, ttl=3600)
    
    return result


@router.post('/select', response_model=dict)
def select_template(
    request: TenantTemplateSelectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin),
) -> dict:
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail='User has no tenant')

    template = db.scalar(
        select(StorefrontTemplate).where(
            StorefrontTemplate.template_code == request.template_code,
            StorefrontTemplate.is_active.is_(True),
        )
    )
    if not template:
        raise HTTPException(status_code=404, detail='Template not found')

    tenant = db.get(Tenant, current_user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail='Tenant not found')

    preset = json.loads(template.preset)

    # Apply template preset to tenant branding
    from app.services.tenant_branding_service import ensure_tenant_branding
    branding = ensure_tenant_branding(db, str(tenant.id), tenant.company_name, tenant.contact_email)
    branding.primary_color = preset.get("primary_color", branding.primary_color)
    branding.secondary_color = preset.get("secondary_color", branding.secondary_color)
    branding.accent_color = preset.get("accent_color", branding.accent_color)
    branding.background_color = preset.get("background_color", branding.background_color)
    branding.template_code = template.template_code
    db.add(branding)
    db.commit()

    # Run auto-fix plugins for the selected template
    from app.services.template_manifest_service import auto_fix_template_endpoints
    fix_results = auto_fix_template_endpoints(str(tenant.id), template.template_code, db)

    # Track failed endpoints for business liability
    failed_plugins = [item["plugin"] for item in fix_results.get("auto_fixed", []) if not item.get("success", False)]
    still_failing = fix_results.get("still_failing", [])
    all_failed = list(set(failed_plugins + still_failing))
    
    if all_failed:
        from datetime import datetime, timezone
        from app.models.audit import AuditEvent
        from app.services.notification_service import get_notification_service

        tenant.pending_endpoints = json.dumps(all_failed)
        tenant.pending_endpoints_notified_at = None  # Will be set when notification is sent
        db.add(tenant)

        # Create admin notification (audit event)
        audit_event = AuditEvent(
            actor_email=current_user.email,
            event_type="template_auto_fix_failed",
            entity_type="tenant",
            entity_id=str(tenant.id),
            details_json=json.dumps({
                "template_code": template.template_code,
                "template_name": template.name,
                "failed_endpoints": all_failed,
                "message": f"Tenant {tenant.company_name} switched to template {template.name} — endpoints could not be auto-fixed: {', '.join(all_failed)}"
            })
        )
        db.add(audit_event)

        # Send tenant notification about 72-hour warning
        try:
            notification_service = get_notification_service()
            subject = f"Template Change: Some features may not work for 72 hours"
            body = f"""
            <html>
                <body>
                    <p>Dear {tenant.company_name},</p>
                    <p>You have successfully switched to the <strong>{template.name}</strong> template.</p>
                    <p>However, some features could not be automatically configured:</p>
                    <ul>
                        {"".join(f"<li>{ep}</li>" for ep in all_failed)}
                    </ul>
                    <p>These features may not work for up to 72 hours while our team resolves the configuration. Your storefront will continue to function with graceful degradation for these features.</p>
                    <p>Our team has been notified and is working to resolve this. You will receive another notification when all features are fully operational.</p>
                    <p>Thank you for your patience.<br>The Afruheritage Team</p>
                </body>
            </html>
            """
            notification_service.send_email(to_email=tenant.contact_email, subject=subject, html_content=body)
            tenant.pending_endpoints_notified_at = datetime.now(timezone.utc)
            db.add(tenant)
        except Exception as e:
            # Log error but don't fail the template selection
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send tenant notification for failed auto-fix: {e}")

        db.commit()
    else:
        # Clear pending endpoints if all succeeded
        tenant.pending_endpoints = None
        tenant.pending_endpoints_notified_at = None
        db.add(tenant)
        db.commit()

    return {
        "status": "success",
        "tenant_id": str(tenant.id),
        "template_code": template.template_code,
        "template_name": template.name,
        "auto_fix": fix_results,
        "failed_endpoints": all_failed if all_failed else None,
        "graceful_degradation": len(all_failed) > 0,
    }


# ----- Admin-only template management endpoints -----

@router.post('/admin', response_model=StorefrontTemplateResponse)
def create_template(
    request: TemplateCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
) -> StorefrontTemplateResponse:
    """Create a new template (admin only)."""
    existing = db.scalar(
        select(StorefrontTemplate).where(StorefrontTemplate.template_code == request.template_code)
    )
    if existing:
        raise HTTPException(status_code=400, detail='Template code already exists')
    
    template = StorefrontTemplate(
        template_code=request.template_code,
        name=request.name,
        description=request.description,
        preset=json.dumps(request.preset),
        is_active=True,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    
    # Invalidate cache
    cache_delete_pattern("storefront_templates:*")
    
    return StorefrontTemplateResponse(
        id=template.id,
        template_code=template.template_code,
        name=template.name,
        description=template.description,
        preset=json.loads(template.preset),
        is_active=template.is_active,
        created_at=template.created_at,
    )


@router.patch('/admin/{template_id}', response_model=StorefrontTemplateResponse)
def update_template(
    template_id: str,
    request: TemplateUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
) -> StorefrontTemplateResponse:
    """Update an existing template (admin only)."""
    template = db.get(StorefrontTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail='Template not found')
    
    if request.name is not None:
        template.name = request.name
    if request.description is not None:
        template.description = request.description
    if request.preset is not None:
        template.preset = json.dumps(request.preset)
    if request.is_active is not None:
        template.is_active = request.is_active
    
    db.commit()
    db.refresh(template)
    
    # Invalidate cache
    cache_delete_pattern("storefront_templates:*")
    
    return StorefrontTemplateResponse(
        id=template.id,
        template_code=template.template_code,
        name=template.name,
        description=template.description,
        preset=json.loads(template.preset),
        is_active=template.is_active,
        created_at=template.created_at,
    )


@router.delete('/admin/{template_id}')
def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
) -> dict:
    """Delete a template (admin only)."""
    template = db.scalar(select(StorefrontTemplate).where(StorefrontTemplate.id == template_id))
    if not template:
        raise HTTPException(status_code=404, detail='Template not found')
    
    db.delete(template)
    db.commit()
    
    # Invalidate cache
    cache_delete_pattern("storefront_templates:*")
    
    return {"message": "Template deleted successfully"}


@router.get('/admin/all', response_model=list[StorefrontTemplateResponse])
def list_all_templates(
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
) -> list[StorefrontTemplateResponse]:
    """List all templates including inactive ones (admin only)."""
    templates = db.scalars(select(StorefrontTemplate).order_by(StorefrontTemplate.created_at.desc())).all()
    return [
        StorefrontTemplateResponse(
            id=t.id,
            template_code=t.template_code,
            name=t.name,
            description=t.description,
            preset=json.loads(t.preset),
            is_active=t.is_active,
            created_at=t.created_at,
        )
        for t in templates
    ]


@router.get('/admin/endpoint-health')
def get_endpoint_health(
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
) -> list[dict]:
    """Get endpoint health for all tenants (admin only)."""
    from app.services.template_manifest_service import get_endpoint_health_all_tenants
    return get_endpoint_health_all_tenants(db)


@router.get('/admin/{template_code}/manifest')
def get_template_manifest(
    template_code: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_superuser),
) -> dict:
    """Get the full manifest for a template (admin only)."""
    template = db.scalar(
        select(StorefrontTemplate).where(StorefrontTemplate.template_code == template_code)
    )
    if not template:
        raise HTTPException(status_code=404, detail='Template not found')
    preset = json.loads(template.preset)
    return {
        "template_code": template.template_code,
        "name": template.name,
        "description": template.description,
        "manifest": preset,
    }
