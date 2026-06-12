"""Admin endpoints for DNS record management (PowerDNS integration)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import require_superuser
from app.models.user import User
from app.services.dns_provisioning import (
    ensure_wildcard_record,
    list_tenant_records,
    provision_tenant_subdomain,
    remove_tenant_subdomain,
)

router = APIRouter(prefix="/admin/dns", tags=["Admin DNS"])


@router.get("/records")
def get_dns_records(_: User = Depends(require_superuser)):
    """List all per-tenant A records in the PowerDNS zone."""
    return {"records": list_tenant_records()}


@router.post("/provision/{slug}")
def provision_dns(slug: str, _: User = Depends(require_superuser)):
    """Manually create/refresh the A record for a tenant slug."""
    ok = provision_tenant_subdomain(slug)
    if not ok:
        raise HTTPException(status_code=502, detail="DNS provisioning failed — check PDNS_API_KEY and PDNS_API_URL")
    return {"status": "ok", "record": f"{slug}.afruheritage.com"}


@router.delete("/provision/{slug}")
def remove_dns(slug: str, _: User = Depends(require_superuser)):
    """Remove the A record for a deactivated tenant slug."""
    ok = remove_tenant_subdomain(slug)
    return {"status": "ok" if ok else "failed", "record": f"{slug}.afruheritage.com"}


@router.post("/ensure-wildcard")
def ensure_wildcard(_: User = Depends(require_superuser)):
    """Re-create the wildcard *.afruheritage.com A record if missing."""
    ok = ensure_wildcard_record()
    if not ok:
        raise HTTPException(status_code=502, detail="Wildcard DNS update failed")
    return {"status": "ok", "record": "*.afruheritage.com"}
