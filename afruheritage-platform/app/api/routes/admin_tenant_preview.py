"""
Admin tenant preview endpoints.

Allows superusers to view tenant data (products, storefront, Fleetbase)
as the tenant would see it, without needing the tenant's credentials.
"""
from __future__ import annotations

import json
import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_superuser
from app.core.config import settings
from app.db.session import get_db
from app.models.product import Product, ProductCategory
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.product import ProductCategoryResponse, ProductResponse

router = APIRouter(prefix="/admin/tenants", tags=["Admin Tenant Preview"])


@router.get("/{tenant_id}/products", response_model=list[ProductResponse])
def admin_list_tenant_products(
    tenant_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """List all products for a tenant (admin view)."""
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    rows = db.scalars(
        select(Product)
        .where(Product.tenant_id == tenant_id)
        .order_by(Product.sort_order.asc(), Product.created_at.desc())
    ).all()
    for r in rows:
        r.images = json.loads(r.images) if isinstance(r.images, str) else r.images or []
        r.videos = json.loads(r.videos) if isinstance(r.videos, str) else r.videos or []
    return rows


@router.get("/{tenant_id}/products/categories", response_model=list[ProductCategoryResponse])
def admin_list_tenant_categories(
    tenant_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """List all product categories for a tenant (admin view)."""
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    rows = db.scalars(
        select(ProductCategory)
        .where(ProductCategory.tenant_id == tenant_id)
        .order_by(ProductCategory.sort_order.asc(), ProductCategory.name.asc())
    ).all()
    return rows


@router.get("/{tenant_id}/fleetbase/{resource}")
def admin_preview_fleetbase(
    tenant_id: uuid.UUID,
    resource: str,  # drivers, vehicles, orders, fleets, tracking
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser),
):
    """Preview Fleetbase data for a tenant (admin view)."""
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    if not tenant.fleetbase_org_id:
        raise HTTPException(status_code=404, detail="Tenant Fleetbase not provisioned")

    base = (settings.fleetbase_internal_url or "http://10.0.0.115:8003").rstrip("/")
    token = settings.fleetbase_api_token or ""
    url = f"{base}/int/v1/{resource}"

    try:
        resp = httpx.get(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/json",
            },
            params={"company_uuid": str(tenant.fleetbase_org_id)},
            timeout=30,
        )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Fleetbase unreachable: {exc}")

    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.text[:500])

    if not resp.content:
        return {}
    try:
        return resp.json()
    except Exception:
        return {"raw": resp.text}
