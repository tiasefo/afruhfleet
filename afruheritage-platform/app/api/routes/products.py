from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_active_subscription
from app.db.session import get_db
from app.models.product import Product, ProductCategory
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.product import (
    ProductCategoryCreate,
    ProductCategoryResponse,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)

router = APIRouter(prefix="/products", tags=["Products"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _ensure_tenant_access(user: User, tenant_id: uuid.UUID) -> None:
    if not user.is_superuser and user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Access denied")


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------
@router.post("/categories", response_model=ProductCategoryResponse)
def create_category(
    payload: ProductCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User has no tenant")
    cat = ProductCategory(
        tenant_id=current_user.tenant_id,
        name=payload.name,
        description=payload.description,
        sort_order=payload.sort_order,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.get("/categories", response_model=list[ProductCategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="User has no tenant")
    rows = db.scalars(
        select(ProductCategory)
        .where(ProductCategory.tenant_id == tenant_id, ProductCategory.is_active.is_(True))
        .order_by(ProductCategory.sort_order.asc(), ProductCategory.name.asc())
    ).all()
    return rows


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    cat = db.get(ProductCategory, category_id)
    if not cat or cat.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Category not found")
    cat.is_active = False
    db.commit()
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------
@router.post("", response_model=ProductResponse)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User has no tenant")

    product = Product(
        tenant_id=current_user.tenant_id,
        category_id=payload.category_id,
        name=payload.name,
        description=payload.description,
        short_description=payload.short_description,
        price=payload.price,
        compare_at_price=payload.compare_at_price,
        currency=payload.currency,
        images=json.dumps(payload.images),
        videos=json.dumps(payload.videos),
        sku=payload.sku,
        stock_quantity=payload.stock_quantity,
        is_available=payload.is_available,
        is_featured=payload.is_featured,
        tags=payload.tags,
        sort_order=payload.sort_order,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("", response_model=list[ProductResponse])
def list_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
    featured_only: bool = False,
    category_id: uuid.UUID | None = None,
):
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="User has no tenant")

    stmt = (
        select(Product)
        .where(Product.tenant_id == tenant_id)
        .order_by(Product.sort_order.asc(), Product.created_at.desc())
    )
    if featured_only:
        stmt = stmt.where(Product.is_featured.is_(True))
    if category_id:
        stmt = stmt.where(Product.category_id == category_id)

    rows = db.scalars(stmt).all()
    # Hydrate JSON fields
    for r in rows:
        r.images = json.loads(r.images) if isinstance(r.images, str) else r.images or []
        r.videos = json.loads(r.videos) if isinstance(r.videos, str) else r.videos or []
    return rows


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    product = db.get(Product, product_id)
    if not product or product.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Product not found")
    product.images = json.loads(product.images) if isinstance(product.images, str) else product.images or []
    product.videos = json.loads(product.videos) if isinstance(product.videos, str) else product.videos or []
    return product


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: uuid.UUID,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    product = db.get(Product, product_id)
    if not product or product.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Product not found")

    updates = payload.model_dump(exclude_unset=True)
    if "images" in updates:
        updates["images"] = json.dumps(updates["images"])
    if "videos" in updates:
        updates["videos"] = json.dumps(updates["videos"])

    for key, value in updates.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    product.images = json.loads(product.images) if isinstance(product.images, str) else product.images or []
    product.videos = json.loads(product.videos) if isinstance(product.videos, str) else product.videos or []
    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active_subscription),
):
    product = db.get(Product, product_id)
    if not product or product.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Public storefront (no auth required)
# ---------------------------------------------------------------------------
@router.get("/public/{tenant_slug}", response_model=list[ProductResponse])
def public_products(
    tenant_slug: str,
    db: Session = Depends(get_db),
    featured_only: bool = False,
):
    tenant = db.scalar(select(Tenant).where(Tenant.slug == tenant_slug))
    if not tenant:
        raise HTTPException(status_code=404, detail="Storefront not found")

    stmt = (
        select(Product)
        .where(Product.tenant_id == tenant.id, Product.is_available.is_(True))
        .order_by(Product.sort_order.asc(), Product.created_at.desc())
    )
    if featured_only:
        stmt = stmt.where(Product.is_featured.is_(True))

    rows = db.scalars(stmt).all()
    for r in rows:
        r.images = json.loads(r.images) if isinstance(r.images, str) else r.images or []
        r.videos = json.loads(r.videos) if isinstance(r.videos, str) else r.videos or []
    return rows
