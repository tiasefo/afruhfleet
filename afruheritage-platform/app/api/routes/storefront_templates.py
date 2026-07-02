from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_superuser
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
        "template_code": "azure_cloud",
        "name": "Azure Cloud",
        "description": "Clean blue enterprise dashboard inspired by Microsoft Azure",
        "preset": {
            "primary_color": "#0078D4",
            "secondary_color": "#323130",
            "accent_color": "#00BCF2",
            "background_color": "#f3f2f1",
            "font_family": "Segoe UI, sans-serif",
            "header_style": "white_with_shadow",
            "footer_style": "dark",
            "card_style": "rounded_with_border",
        },
    },
    {
        "template_code": "aws_console",
        "name": "AWS Console",
        "description": "Dark sidebar with orange highlights, inspired by Amazon AWS",
        "preset": {
            "primary_color": "#FF9900",
            "secondary_color": "#232F3E",
            "accent_color": "#00A8E1",
            "background_color": "#1a1f2e",
            "font_family": "Amazon Ember, sans-serif",
            "header_style": "dark",
            "footer_style": "dark",
            "card_style": "flat",
        },
    },
    {
        "template_code": "servicenow",
        "name": "ServiceNow",
        "description": "Teal calm ITSM-inspired dashboard",
        "preset": {
            "primary_color": "#81B5A1",
            "secondary_color": "#293E40",
            "accent_color": "#62A39F",
            "background_color": "#f8f9fa",
            "font_family": "Helvetica Neue, sans-serif",
            "header_style": "white",
            "footer_style": "light",
            "card_style": "rounded",
        },
    },
    {
        "template_code": "jira_work",
        "name": "Jira Work",
        "description": "Blue and green agile project management style",
        "preset": {
            "primary_color": "#0052CC",
            "secondary_color": "#172B4D",
            "accent_color": "#36B37E",
            "background_color": "#f4f5f7",
            "font_family": "Charlie Display, sans-serif",
            "header_style": "white",
            "footer_style": "light",
            "card_style": "rounded",
        },
    },
    {
        "template_code": "okta_identity",
        "name": "Okta Identity",
        "description": "Deep blue with white and magenta accent",
        "preset": {
            "primary_color": "#00297A",
            "secondary_color": "#FFFFFF",
            "accent_color": "#E3006D",
            "background_color": "#f5f5f5",
            "font_family": "Inter, sans-serif",
            "header_style": "white",
            "footer_style": "dark",
            "card_style": "rounded_with_shadow",
        },
    },
    {
        "template_code": "google_cloud",
        "name": "Google Cloud",
        "description": "Google blue with green accent, clean and modern",
        "preset": {
            "primary_color": "#1A73E8",
            "secondary_color": "#202124",
            "accent_color": "#34A853",
            "background_color": "#ffffff",
            "font_family": "Google Sans, Roboto, sans-serif",
            "header_style": "white",
            "footer_style": "light",
            "card_style": "rounded_with_shadow",
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
def list_templates(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    seed_default_templates(db)
    templates = db.scalars(select(StorefrontTemplate).where(StorefrontTemplate.is_active.is_(True))).all()
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


@router.post('/select', response_model=dict)
def select_template(
    request: TenantTemplateSelectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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

    return {
        "status": "success",
        "tenant_id": str(tenant.id),
        "template_code": template.template_code,
        "template_name": template.name,
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
    template = db.scalar(select(StorefrontTemplate).where(StorefrontTemplate.id == template_id))
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
    
    db.add(template)
    db.commit()
    db.refresh(template)
    
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
    
    return {"status": "success", "message": "Template deleted"}


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
