from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_superuser, require_tenant_admin, require_active_subscription
from app.core.redis_client import cache_get, cache_set, cache_delete_pattern
from app.db.session import get_db
from app.models.storefront_template import StorefrontTemplate
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.storefront_template import StorefrontTemplateResponse, StorefrontTemplateCatalogResponse, TenantTemplateSelectionRequest
from app.services.marketplace_service import MarketplaceService

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
        "template_code": "freight",
        "name": "Meridian Freight",
        "description": "Ocean, air, and land freight forwarding storefront with live quote and tracking flows.",
        "renderer_key": "freight",
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
            "preview_route": "/templates/freight",
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
        "renderer_key": "fleet",
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
            "preview_route": "/templates/fleet",
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
        "renderer_key": "ecommerce",
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
            "preview_route": "/templates/ecommerce",
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
        "renderer_key": "mall",
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
            "preview_route": "/templates/mall",
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
        "renderer_key": "bookings",
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
            "preview_route": "/templates/bookings",
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
        "renderer_key": "restaurant",
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
            "preview_route": "/templates/restaurant",
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
        "renderer_key": "realestate",
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
            "preview_route": "/templates/realestate",
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
                renderer_key=item.get("renderer_key"),
                is_active=True,
                status="production_ready",
            )
            db.add(template)
        else:
            # Backfill renderer_key and preview_route on existing records
            changed = False
            if not existing.renderer_key and item.get("renderer_key"):
                existing.renderer_key = item["renderer_key"]
                changed = True
            if existing.status != "production_ready":
                existing.status = "production_ready"
                changed = True
            preset = json.loads(existing.preset) if isinstance(existing.preset, str) else existing.preset
            if not preset.get("preview_route") and item["preset"].get("preview_route"):
                preset["preview_route"] = item["preset"]["preview_route"]
                existing.preset = json.dumps(preset)
                changed = True
            if changed:
                db.add(existing)
    db.commit()


_CATALOG_SAFE_PRESET_KEYS = {
    "primary_color", "secondary_color", "accent_color", "background_color",
    "font_family", "header_style", "footer_style", "card_style",
    "theme_class", "image", "swatches", "tags", "features",
    "storage_fees_enabled",
}


def _sanitize_preset_for_catalog(preset: dict) -> dict:
    """Strip internal manifest data from preset, keeping only catalog-safe fields."""
    return {k: v for k, v in preset.items() if k in _CATALOG_SAFE_PRESET_KEYS}


@router.get('/catalog', response_model=list[StorefrontTemplateCatalogResponse])
def list_templates_catalog(db: Session = Depends(get_db)):
    """Public catalog endpoint — returns sanitized template data safe for display."""
    cache_key = "storefront_templates:catalog"
    cached = cache_get(cache_key)
    if cached:
        return cached

    seed_default_templates(db)
    templates = db.scalars(select(StorefrontTemplate).where(StorefrontTemplate.is_active.is_(True))).all()

    result = [
        StorefrontTemplateCatalogResponse(
            template_code=t.template_code,
            name=t.name,
            description=t.description,
            preset=_sanitize_preset_for_catalog(json.loads(t.preset) if isinstance(t.preset, str) else t.preset),
            is_active=t.is_active,
            status=t.status,
            version=t.version,
            renderer_key=t.renderer_key,
            minimum_platform_version=t.minimum_platform_version,
            business_type=t.business_type,
            required_capabilities=[c.code for c in t.required_capabilities],
            optional_capabilities=[c.code for c in t.optional_capabilities],
            compatible_plugins=t.compatible_plugins,
            incompatible_plugins=t.incompatible_plugins,
            preview_route=t.preview_route,
            preview_image=t.preview_image,
        )
        for t in templates
    ]

    cache_set(cache_key, result, ttl=3600)
    return result


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
    
    def _preset(t):
        try:
            return json.loads(t.preset) if isinstance(t.preset, str) and t.preset else {}
        except json.JSONDecodeError:
            return {}

    result = [
        StorefrontTemplateResponse(
            id=t.id,
            template_code=t.template_code,
            name=t.name,
            description=t.description,
            preset=_preset(t),
            is_active=t.is_active,
            status=t.status,
            version=t.version,
            renderer_key=t.renderer_key,
            minimum_platform_version=t.minimum_platform_version,
            business_type=t.business_type,
            required_capabilities=[c.code for c in t.required_capabilities],
            optional_capabilities=[c.code for c in t.optional_capabilities],
            compatible_plugins=t.compatible_plugins,
            incompatible_plugins=t.incompatible_plugins,
            preview_route=t.preview_route,
            preview_image=t.preview_image,
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
        if current_user.is_superuser and request.tenant_id:
            pass
        else:
            raise HTTPException(status_code=400, detail='User has no tenant')

    effective_tenant_id = request.tenant_id or str(current_user.tenant_id)
    if not current_user.is_superuser and str(current_user.tenant_id) != str(effective_tenant_id):
        raise HTTPException(status_code=403, detail='Tenant access denied')


    service = MarketplaceService(db)
    try:
        return service.select_template(
            tenant_id=effective_tenant_id,
            template_code=request.template_code,
            requested_by=str(current_user.id) if current_user.id else None,
            requested_by_email=current_user.email,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

@router.post('/rollback', response_model=dict)
def rollback_template(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin),
) -> dict:
    """Rollback the most recent template installation to the previous configuration."""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail='User has no tenant')

    service = MarketplaceService(db)
    try:
        return service.rollback_template(
            tenant_id=str(current_user.tenant_id),
            requested_by_email=current_user.email,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get('/compatibility/{template_code}', response_model=dict)
def check_template_compatibility(
    template_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin),
) -> dict:
    """Check whether the current tenant can install the given template.

    Runs the CompatibilityValidator against the tenant's enabled plugins
    and the template's required capabilities. Returns a factual report;
    does not mutate any state.
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail='User has no tenant')

    from app.services.compatibility_validator import CompatibilityValidator

    validator = CompatibilityValidator(db)
    return validator.validate(str(current_user.tenant_id), template_code)


@router.get('/installations', response_model=dict)
def list_tenant_installations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin),
) -> dict:
    """Return the installation history for the current tenant."""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail='User has no tenant')

    from app.models.tenant_template_installation import TenantTemplateInstallation
    from sqlalchemy import desc

    rows = db.scalars(
        select(TenantTemplateInstallation)
        .where(TenantTemplateInstallation.tenant_id == current_user.tenant_id)
        .order_by(desc(TenantTemplateInstallation.created_at))
        .limit(25)
    ).all()

    return {
        "installations": [
            {
                "id": str(r.id),
                "template_code": r.template_code,
                "template_version": r.template_version,
                "previous_template_code": r.previous_template_code,
                "previous_template_version": r.previous_template_version,
                "status": r.status,
                "requested_at": r.requested_at.isoformat() if r.requested_at else None,
                "started_at": r.started_at.isoformat() if r.started_at else None,
                "completed_at": r.completed_at.isoformat() if r.completed_at else None,
                "failed_at": r.failed_at.isoformat() if r.failed_at else None,
                "failure_reason": r.failure_reason,
                "correlation_id": r.correlation_id,
            }
            for r in rows
        ]
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
