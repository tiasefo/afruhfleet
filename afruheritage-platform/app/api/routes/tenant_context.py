from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.tenant_context import TenantContextResponse
from app.services.tenant_context_service import get_tenant_context, resolve_tenant

router = APIRouter(prefix="/tenant-context", tags=["Tenant Context"])


@router.get("/{identifier}", response_model=TenantContextResponse)
def get_public_tenant_context(
    identifier: str,
    db: Session = Depends(get_db),
):
    """Public endpoint: fetch full tenant context by slug, subdomain, custom domain, or UUID.
    No authentication required — this is used by the storefront and public website."""
    context = get_tenant_context(db, identifier)
    if not context:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return context


@router.get("/resolve/host", response_model=TenantContextResponse)
def resolve_tenant_by_host(
    request: Request,
    db: Session = Depends(get_db),
):
    """Resolve tenant from the Host header (subdomain or custom domain).
    No authentication required."""
    host = request.headers.get("x-forwarded-host") or request.headers.get("host", "")
    host = host.split(":")[0].lower()

    if not host or host in ("localhost", "127.0.0.1", "0.0.0.0"):
        raise HTTPException(status_code=400, detail="Cannot resolve tenant from localhost")

    # Try custom domain first, then subdomain
    from app.models.tenant import Tenant
    tenant = db.query(Tenant).filter(Tenant.custom_domain == host).first()
    if not tenant:
        # Extract subdomain (e.g., "amooksco" from "amooksco.afruheritage.com")
        parts = host.split(".")
        if len(parts) >= 3:
            subdomain = parts[0]
            tenant = db.query(Tenant).filter(Tenant.subdomain == subdomain).first()

    if not tenant:
        raise HTTPException(status_code=404, detail="No tenant found for host: " + host)

    from app.services.tenant_context_service import build_tenant_context
    return build_tenant_context(db, tenant)
