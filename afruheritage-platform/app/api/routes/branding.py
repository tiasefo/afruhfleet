from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.branding import BrandingResponse, BrandingUpdate
from app.services.tenant_branding_service import get_tenant_branding, update_tenant_branding

router = APIRouter(prefix="/branding", tags=["Tenant Branding"])


@router.get("/{tenant_id}", response_model=BrandingResponse)
def get_branding_route(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    branding = get_tenant_branding(db, tenant_id)
    if not branding:
        raise HTTPException(status_code=404, detail="Branding not found for this tenant")
    return _to_response(branding)


@router.get("/public/{tenant_id}", response_model=BrandingResponse)
def get_public_branding_route(
    tenant_id: str,
    db: Session = Depends(get_db),
):
    branding = get_tenant_branding(db, tenant_id)
    if not branding:
        raise HTTPException(status_code=404, detail="Branding not found for this tenant")
    return _to_response(branding)


@router.patch("/{tenant_id}", response_model=BrandingResponse)
def update_branding_route(
    tenant_id: str,
    payload: BrandingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    branding = update_tenant_branding(db, tenant_id, **payload.model_dump(exclude_unset=True))
    if not branding:
        raise HTTPException(status_code=404, detail="Branding not found for this tenant")
    return _to_response(branding)


def _to_response(b) -> BrandingResponse:
    return BrandingResponse(
        id=str(b.id),
        tenant_id=str(b.tenant_id),
        company_name=b.company_name,
        tagline=b.tagline,
        logo_url=b.logo_url,
        favicon_url=b.favicon_url,
        primary_color=b.primary_color,
        secondary_color=b.secondary_color,
        accent_color=b.accent_color,
        background_color=b.background_color,
        legal_company_name=b.legal_company_name,
        legal_footer_text=b.legal_footer_text,
        terms_url=b.terms_url,
        privacy_url=b.privacy_url,
        support_email=b.support_email,
        support_phone=b.support_phone,
        support_url=b.support_url,
        notification_from_name=b.notification_from_name,
        notification_from_email=b.notification_from_email,
        default_language=b.default_language,
        supported_languages=b.supported_languages,
        maps_enabled=b.maps_enabled,
        public_tracking_enabled=b.public_tracking_enabled,
        csv_import_enabled=b.csv_import_enabled,
        group_members_enabled=b.group_members_enabled,
        max_group_members=b.max_group_members,
        created_at=b.created_at,
        updated_at=b.updated_at,
    )
