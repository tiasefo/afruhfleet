"""
Fleetbase feature-inheritance gating (P1.4 fix).

Maps Fleetbase ``/int/v1/{path}`` prefixes to the per-plan boolean feature flags
on the billing ``Plan`` model, so paid-tier Fleetbase capabilities are gated by
the tenant's subscription plan.

Core / structural features (drivers, vehicles, orders, fleets, basic tracking)
are ALWAYS inherited by every tenant org and are intentionally NOT listed here —
anything not matched falls through and is allowed.
"""
from __future__ import annotations

import logging

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.billing import Plan
from app.models.tenant import Tenant
from app.services.billing_service import normalize_plan_code, seed_default_plans

logger = logging.getLogger("afruheritage.fleetbase_entitlements")

# Fleetbase first path-segment -> Plan boolean attribute.
# ONLY paid features are listed. Anything not matched is core inheritance.
FLEETBASE_FEATURE_GATES: dict[str, str] = {
    "service-rates": "service_rates_enabled",
    "service_rates": "service_rates_enabled",
    "routes": "route_planning_enabled",
    "route-plans": "route_planning_enabled",
    "route_plans": "route_planning_enabled",
    "webhook-endpoints": "webhooks_enabled",
    "webhooks": "webhooks_enabled",
    "optimize": "route_optimization_enabled",
    "optimization": "route_optimization_enabled",
    "vrp": "vrp_enabled",
    "notifications": "notifications_enabled",
    "fuel-reports": "fuel_tracking_enabled",
    "fuel": "fuel_tracking_enabled",
    "maintenance": "maintenance_enabled",
    "extensions": "extensions_enabled",
}


def resolve_feature_gate(fleetbase_path: str) -> str | None:
    """Return the ``Plan`` attribute gating this path, or ``None`` if it is a core
    feature that every plan inherits."""
    p = fleetbase_path.lstrip("/")
    for prefix in ("int/v1/", "int/v1", "v1/"):
        if p.startswith(prefix):
            p = p[len(prefix):]
            break
    p = p.lstrip("/")
    first = p.split("/", 1)[0].split("?", 1)[0].strip().lower()
    if not first:
        return None
    return FLEETBASE_FEATURE_GATES.get(first)


def check_fleetbase_access(db: Session, tenant: Tenant, fleetbase_path: str) -> None:
    """Raise HTTP 402 if the tenant's plan does not include the requested Fleetbase
    feature. Core features (not in the gate map) pass through untouched."""
    gate_attr = resolve_feature_gate(fleetbase_path)
    if gate_attr is None:
        return  # core / structural feature — always inherited

    seed_default_plans(db)
    plan_code = normalize_plan_code(getattr(tenant, "plan_code", None))
    plan = db.query(Plan).filter(Plan.code == plan_code).first()

    allowed = bool(getattr(plan, gate_attr, False)) if plan else False
    if not allowed:
        logger.info(
            "Fleetbase feature denied: tenant=%s plan=%s feature=%s path=%s",
            getattr(tenant, "id", None), plan_code.value, gate_attr, fleetbase_path,
        )
        raise HTTPException(
            status_code=402,
            detail={
                "error": "feature_not_in_plan",
                "required_feature": gate_attr,
                "current_plan": plan_code.value,
                "message": "This feature is not included in your current plan. "
                           "Upgrade your subscription to enable it.",
            },
        )
