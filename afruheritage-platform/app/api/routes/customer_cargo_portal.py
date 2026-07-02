from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db

router = APIRouter(prefix="/customer-cargo", tags=["Customer Cargo Portal"])

def get_tenant(db: Session, tenant_slug: str):
    row = db.execute(text("""
        SELECT id, company_name, slug, requested_domain, custom_domain
        FROM tenants
        WHERE slug=:slug OR requested_domain=:slug OR custom_domain=:slug
        LIMIT 1
    """), {"slug": tenant_slug}).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return row

@router.get("/{tenant_slug}/track/{tracking_number}")
def track_cargo(tenant_slug: str, tracking_number: str, db: Session = Depends(get_db)):
    tenant = get_tenant(db, tenant_slug)
    q = f"%{tracking_number.strip()}%"

    cargo = db.execute(text("""
        SELECT
            c.id,
            c.afru_tracking_number,
            c.external_tracking_number,
            c.customer_name,
            c.description,
            c.cbm,
            c.receipt_date,
            c.loading_date,
            c.status,
            c.match_confidence,
            tc.display_name AS customer_display_name
        FROM cargo_records c
        LEFT JOIN tenant_customers tc ON tc.id = c.customer_id
        WHERE c.tenant_id=:tenant_id
          AND c.status <> 'skipped_non_customer_row'
          AND (
            c.afru_tracking_number ILIKE :q
            OR c.external_tracking_number ILIKE :q
          )
        ORDER BY c.created_at DESC
        LIMIT 25
    """), {"tenant_id": tenant["id"], "q": q}).mappings().all()

    return {
        "tenant": dict(tenant),
        "query": tracking_number,
        "count": len(cargo),
        "results": [dict(x) for x in cargo],
    }

@router.get("/{tenant_slug}/my-goods")
def my_goods(
    tenant_slug: str,
    mark: str = Query(..., description="Customer shipping mark / name"),
    db: Session = Depends(get_db),
):
    tenant = get_tenant(db, tenant_slug)
    q = f"%{mark.strip()}%"

    rows = db.execute(text("""
        SELECT
            c.afru_tracking_number,
            c.external_tracking_number,
            c.customer_name,
            c.description,
            c.cbm,
            c.receipt_date,
            c.loading_date,
            c.status,
            c.match_confidence
        FROM cargo_records c
        WHERE c.tenant_id=:tenant_id
          AND c.status <> 'skipped_non_customer_row'
          AND c.customer_name ILIKE :q
        ORDER BY c.created_at DESC
        LIMIT 100
    """), {"tenant_id": tenant["id"], "q": q}).mappings().all()

    return {
        "tenant": dict(tenant),
        "mark": mark,
        "count": len(rows),
        "goods": [dict(x) for x in rows],
    }

@router.get("/{tenant_slug}/customers/search")
def search_customers(
    tenant_slug: str,
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
):
    tenant = get_tenant(db, tenant_slug)
    like = f"%{q.strip()}%"

    rows = db.execute(text("""
        SELECT
            id,
            display_name,
            phone,
            email,
            source
        FROM tenant_customers
        WHERE tenant_id=:tenant_id
          AND (
            display_name ILIKE :like
            OR normalized_name ILIKE :like
            OR phone ILIKE :like
            OR email ILIKE :like
          )
        ORDER BY display_name ASC
        LIMIT 50
    """), {"tenant_id": tenant["id"], "like": like}).mappings().all()

    return {
        "tenant": dict(tenant),
        "query": q,
        "count": len(rows),
        "customers": [dict(x) for x in rows],
    }
