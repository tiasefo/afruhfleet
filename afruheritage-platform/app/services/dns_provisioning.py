"""
dns_provisioning.py
===================
DNS provisioning stub for tenant subdomains.

Architecture (Cloudflare Tunnel)
─────────────────────────────────
The platform uses a Cloudflare Tunnel with a wildcard ingress rule:

    *.afruheritage.com  →  localhost:3002  (via tunnel)

This means EVERY new tenant subdomain is automatically publicly reachable the
moment the slug is stored in the database — no per-tenant DNS action required.

This module is intentionally a no-op.  It logs at DEBUG level so it can be
called freely from onboarding / company_registration code without side effects.

If the platform is ever migrated to a self-hosted DNS server (e.g. PowerDNS
with registrar NS delegation), set PDNS_API_KEY + SERVER_PUBLIC_IP in .env and
the code below can be re-enabled.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

BASE_DOMAIN: str = os.getenv("BASE_DOMAIN", "afruheritage.com")

# PowerDNS integration is disabled — Cloudflare wildcard tunnel handles routing.
_ENABLED: bool = False


# ── Public API (no-ops) ───────────────────────────────────────────────────────

def provision_tenant_subdomain(slug: str, ip: Optional[str] = None) -> bool:
    """
    No-op: Cloudflare Tunnel wildcard (*.afruheritage.com) already routes all
    tenant subdomains automatically. The slug just needs to exist in the DB.
    """
    logger.debug(
        "dns_provisioning: subdomain %s.%s is handled by Cloudflare wildcard tunnel — no action needed",
        slug, BASE_DOMAIN,
    )
    return True


def remove_tenant_subdomain(slug: str) -> bool:
    """No-op: Cloudflare wildcard is not per-tenant; access control is at the app layer."""
    logger.debug("dns_provisioning: remove %s — no-op (Cloudflare wildcard)", slug)
    return True


def list_tenant_records() -> list[dict]:
    """Returns empty list; DNS is managed by Cloudflare, not a local server."""
    return []


def ensure_wildcard_record(ip: Optional[str] = None) -> bool:
    """No-op: wildcard is configured in Cloudflare Tunnel ingress rules."""
    return True
