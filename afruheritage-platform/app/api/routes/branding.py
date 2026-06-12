from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from datetime import datetime, timezone
import io
import uuid

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.branding import BrandingResponse, BrandingUpdate
from app.services.storage_service import storage_service
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
        return _default_response(tenant_id)
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


_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"}
_MAX_LOGO_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post("/{tenant_id}/logo", response_model=BrandingResponse)
def upload_branding_logo(
    tenant_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a logo image and store the public URL in tenant branding."""
    if file.content_type not in _ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid image type. Allowed: JPEG, PNG, WebP, GIF, SVG")
    content = file.file.read()
    if len(content) > _MAX_LOGO_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 5 MB)")
    ext = (file.filename or "logo").rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "png"
    object_key = f"branding/{tenant_id}/logo.{ext}"
    logo_url = storage_service.upload(
        file_data=io.BytesIO(content),
        filename=object_key,
        content_type=file.content_type,
    )
    branding = update_tenant_branding(db, tenant_id, logo_url=logo_url)
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


def _default_response(tenant_id: str) -> BrandingResponse:
    now = datetime.now(timezone.utc)
    return BrandingResponse(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        company_name="Afruheritage",
        tagline="AI-powered freight forwarding platform built for Africa.",
        logo_url=None,
        favicon_url="/favicon.ico",
        primary_color="#0ea5e9",
        secondary_color="#64748b",
        accent_color="#f59e0b",
        background_color="#ffffff",
        legal_company_name="Afruheritage Logistics Ltd",
        legal_footer_text="© 2024 Afruheritage. All rights reserved.",
        terms_url=None,
        privacy_url=None,
        support_email="support@afruheritage.com",
        support_phone="+233 30 123 4567",
        support_url=None,
        notification_from_name="Afruheritage",
        notification_from_email="support@afruheritage.com",
        default_language="en",
        supported_languages="en,zh",
        maps_enabled=True,
        public_tracking_enabled=True,
        csv_import_enabled=True,
        group_members_enabled=True,
        max_group_members=50,
        created_at=now,
        updated_at=now,
    )
