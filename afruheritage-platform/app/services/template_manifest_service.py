from __future__ import annotations

import json
import logging
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.storefront_template import StorefrontTemplate
from app.models.tenant import Tenant
from app.plugins import get_all_plugins, get_plugin
from app.services.tenant_branding_service import ensure_tenant_branding

logger = logging.getLogger(__name__)


def check_template_endpoints(tenant_id: str, template_code: str, db: Session) -> dict[str, Any]:
    """Check all required endpoints for a template and return health status.

    Returns:
        {
            "template_code": str,
            "all_healthy": bool,
            "checks": [{"plugin": str, "healthy": bool, "details": str}],
            "missing": [str],  # plugin names that failed
        }
    """
    template = db.scalar(
        select(StorefrontTemplate).where(StorefrontTemplate.template_code == template_code)
    )
    if not template:
        return {"template_code": template_code, "all_healthy": False, "checks": [], "missing": []}

    preset = json.loads(template.preset) if isinstance(template.preset, str) else template.preset
    features = preset.get("features", [])

    checks = []
    missing = []

    for plugin in get_all_plugins():
        if plugin.name not in features:
            continue
        try:
            healthy = plugin.check(tenant_id, db)
            details = plugin.get_health(tenant_id, db).get("details", "")
        except Exception as exc:
            logger.warning("Plugin %s check failed for tenant %s: %s", plugin.name, tenant_id, exc)
            healthy = False
            details = str(exc)
        checks.append({
            "plugin": plugin.name,
            "healthy": healthy,
            "details": details,
        })
        if not healthy:
            missing.append(plugin.name)

    return {
        "template_code": template_code,
        "all_healthy": len(missing) == 0,
        "checks": checks,
        "missing": missing,
    }


def auto_fix_template_endpoints(tenant_id: str, template_code: str, db: Session) -> dict[str, Any]:
    """Run auto-fix plugins for a template. Automatic, no admin approval.

    Returns:
        {
            "template_code": str,
            "auto_fixed": [{"plugin": str, "success": bool, "message": str}],
            "still_failing": [str],
        }
    """
    template = db.scalar(
        select(StorefrontTemplate).where(StorefrontTemplate.template_code == template_code)
    )
    if not template:
        return {"template_code": template_code, "auto_fixed": [], "still_failing": []}

    preset = json.loads(template.preset) if isinstance(template.preset, str) else template.preset
    features = preset.get("features", [])

    auto_fixed = []
    still_failing = []

    for plugin in get_all_plugins():
        if plugin.name not in features:
            continue
        try:
            if plugin.check(tenant_id, db):
                continue
        except Exception as exc:
            logger.warning("Plugin %s check() failed for tenant %s: %s", plugin.name, tenant_id, exc)
            still_failing.append(plugin.name)
            continue

        try:
            success, message = plugin.auto_fix(tenant_id, db)
        except Exception as exc:
            logger.warning("Plugin %s auto_fix() failed for tenant %s: %s", plugin.name, tenant_id, exc)
            success, message = False, str(exc)

        auto_fixed.append({
            "plugin": plugin.name,
            "success": success,
            "message": message,
        })
        if not success:
            still_failing.append(plugin.name)

    # Also apply storage_fees_enabled from template manifest
    storage_fees_enabled = preset.get("storage_fees_enabled", False)
    try:
        branding = ensure_tenant_branding(db, tenant_id, "", "")
        branding.storage_fees_enabled = storage_fees_enabled
        db.add(branding)
        db.commit()
    except Exception as exc:
        logger.warning("Failed to apply storage_fees_enabled for tenant %s: %s", tenant_id, exc)
        db.rollback()

    logger.info(
        "Auto-fix for tenant %s template %s: %d fixed, %d still failing",
        tenant_id, template_code, len([f for f in auto_fixed if f["success"]]), len(still_failing),
    )

    return {
        "template_code": template_code,
        "auto_fixed": auto_fixed,
        "still_failing": still_failing,
    }


def get_endpoint_health_all_tenants(db: Session) -> list[dict[str, Any]]:
    """Get endpoint health for all tenants. Used by admin console health monitor."""
    tenants = db.scalars(select(Tenant)).all()
    results = []
    for tenant in tenants:
        branding = ensure_tenant_branding(db, str(tenant.id), tenant.company_name, tenant.contact_email)
        template_code = branding.template_code or "freight"
        health = check_template_endpoints(str(tenant.id), template_code, db)
        results.append({
            "tenant_id": str(tenant.id),
            "tenant_name": tenant.company_name,
            "template_code": template_code,
            "all_healthy": health["all_healthy"],
            "missing": health["missing"],
            "checks": health["checks"],
        })
    return results
