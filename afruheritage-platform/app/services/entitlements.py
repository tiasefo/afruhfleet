from __future__ import annotations

import json
from datetime import datetime, timedelta
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.models.saas_subscription import SaaSPlan, TenantSubscription
from app.models.tenant import Tenant


TRIAL_DURATION_DAYS = 14  # fallback; actual value comes from PlatformSettings DB row

TIER_FEATURES: dict[str, list[str]] = {
    "free_trial": [
        "tracking", "csv_import", "maps", "group_members",
        "fleetbase_full", "ai_basic", "ai_advanced",
        "custom_domain_preview", "shipping_estimator",
        "storage_fees", "bus_fleet",
        "marketplace_basic", "marketplace_gps", "whatsapp_channel",
    ],
    "starter": [
        "tracking", "csv_import", "maps", "group_members",
        "fleetbase_basic", "whatsapp_channel",
    ],
    "pro": [
        "tracking", "csv_import", "maps", "group_members",
        "fleetbase_full", "ai_basic",
        "custom_domain", "shipping_estimator", "storage_fees",
        "marketplace_basic", "admin_controls", "whatsapp_channel",
    ],
    "enterprise": [
        "tracking", "csv_import", "maps", "group_members",
        "fleetbase_full", "ai_basic", "ai_advanced",
        "custom_domain", "shipping_estimator", "storage_fees",
        "bus_fleet", "marketplace_basic", "marketplace_gps", "whatsapp_channel",
    ],
}

TIER_LIMITS: dict[str, dict[str, int]] = {
    "free_trial": {"max_group_members": 5000},
    "starter": {"max_group_members": 500},
    "pro": {"max_group_members": 5000},
    "enterprise": {"max_group_members": 50000},
}

PLAN_CODE_ALIASES: dict[str, str] = {
    "free": "free_trial",
    "professional": "pro",
    "business": "pro",
    "vendor_driver": "pro",
    "delivery_services": "enterprise",
    "free_trial": "free_trial",
    "starter": "starter",
    "pro": "pro",
    "enterprise": "enterprise",
}

DEFAULT_PLAN_FEATURES = {
    "free": ["marketplace_basic", "tracking_basic"],
    "professional": ["marketplace_basic", "marketplace_gps", "tracking_basic", "ai_basic"],
    "business": ["marketplace_basic", "marketplace_gps", "tracking_basic", "ai_basic", "admin_controls"],
    "vendor_driver": ["driver_marketplace_search", "marketplace_gps", "tracking_basic"],
}


def normalize_tier_code(plan_code: str | None) -> str:
    if not plan_code:
        return "free_trial"
    normalized = str(plan_code).strip().lower()
    return PLAN_CODE_ALIASES.get(normalized, normalized)


def get_tier_features(plan_code: str | None) -> list[str]:
    tier = normalize_tier_code(plan_code)
    return TIER_FEATURES.get(tier, TIER_FEATURES["free_trial"])


def get_tier_limit(plan_code: str | None, limit_key: str, default: int = 0) -> int:
    tier = normalize_tier_code(plan_code)
    return TIER_LIMITS.get(tier, {}).get(limit_key, default)


def seed_default_plans(db: Session) -> None:
    defaults = [
        ("free", "Free", 0, 50),
        ("professional", "Professional", 1000, 500),
        ("business", "Business", 2500, 1500),
        ("vendor_driver", "Vendor / Driver", 300, 100),
        ("free_trial", "Free Trial", 0, 120),
        ("starter", "Starter", 500, 200),
        ("pro", "Pro", 2000, 1000),
        ("enterprise", "Enterprise", 6000, 10000),
    ]

    for code, name, price, credits in defaults:
        existing = db.query(SaaSPlan).filter(SaaSPlan.code == code).first()
        if not existing:
            features = TIER_FEATURES.get(code) or DEFAULT_PLAN_FEATURES.get(code, [])
            db.add(
                SaaSPlan(
                    code=code,
                    name=name,
                    monthly_price=price,
                    included_credits=credits,
                    features_json=json.dumps(features),
                )
            )
    db.commit()


def ensure_demo_subscription(db: Session, tenant_id: str, plan_code: str = "business") -> TenantSubscription:
    seed_default_plans(db)

    sub = db.query(TenantSubscription).filter(TenantSubscription.tenant_id == tenant_id).first()
    if sub:
        return sub

    plan = db.query(SaaSPlan).filter(SaaSPlan.code == plan_code).first()
    credits = plan.included_credits if plan else 0

    sub = TenantSubscription(
        tenant_id=tenant_id,
        plan_code=plan_code,
        status="active",
        trial=False,
        selected_addons_json=json.dumps(["marketplace", "gps_tracking"]),
        credits_balance=credits,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


def _platform_feature_locked(db: Session, feature_code: str) -> bool:
    """A feature the platform has explicitly disabled at global level.

    Only an existing global_feature_flags row with enabled_globally=False
    constitutes a lock — features Sentinel has not registered are treated
    as un-locked (existing behavior preserved).
    """
    try:
        row = db.execute(
            text("SELECT enabled_globally FROM global_feature_flags WHERE feature_code = :c"),
            {"c": feature_code},
        ).first()
    except Exception:
        return False  # table may not exist yet on older deployments
    return row is not None and not row[0]


def _tenant_feature_override(db: Session, tenant_id: str, feature_code: str) -> bool | None:
    """Governed per-tenant grant/revoke (Sentinel tenant_feature_assignments).

    Returns True for a grant, False for a revoke, None when no live override
    exists. Expired assignments (enabled_until in the past) are ignored.
    """
    try:
        # Match the tenant by UUID or slug — Sentinel stores the string id.
        candidates = {str(tenant_id)}
        tenant = db.query(Tenant).filter(
            (Tenant.slug == str(tenant_id)) | (Tenant.subdomain == str(tenant_id))
        ).first()
        if tenant:
            candidates.update({str(tenant.id), tenant.slug or "", tenant.subdomain or ""})
        else:
            try:
                import uuid as _uuid
                tid = _uuid.UUID(str(tenant_id))
                t2 = db.query(Tenant).filter(Tenant.id == tid).first()
                if t2:
                    candidates.update({str(t2.id), t2.slug or "", t2.subdomain or ""})
            except (ValueError, TypeError):
                pass
        tenant_rows = db.execute(
            text(
                "SELECT enabled FROM tenant_feature_assignments "
                "WHERE tenant_id = ANY(:tids) AND feature_code = :c "
                "AND (enabled_until IS NULL OR enabled_until > now())"
            ),
            {"tids": list(candidates), "c": feature_code},
        ).all()
        if tenant_rows:
            return bool(tenant_rows[0][0])
    except Exception:
        return None  # table may not exist yet on older deployments
    return None


def tenant_has_feature(db: Session, tenant_id: str, feature_code: str) -> bool:
    """Effective feature resolution — PO D-12 precedence:

    1. Platform safety lock (global_feature_flags.enabled_globally=False)
       → disabled for every tenant, overrides cannot bypass it.
    2. Tenant override (tenant_feature_assignments, audited grant/revoke
       with optional expiry) → wins over plan entitlement.
    3. Subscription plan + add-on entitlement → the default.

    An override never bypasses an inactive subscription — that is an
    explicit commercial-entitlement restriction.
    """
    seed_default_plans(db)

    sub = db.query(TenantSubscription).filter(TenantSubscription.tenant_id == tenant_id).first()
    if not sub:
        return False

    if sub.status not in ["active", "trialing"]:
        return False

    if _platform_feature_locked(db, feature_code):
        return False

    override = _tenant_feature_override(db, tenant_id, feature_code)
    if override is not None:
        return override

    tier = normalize_tier_code(sub.plan_code)
    tier_features = TIER_FEATURES.get(tier, [])

    if feature_code in tier_features:
        return True

    plan = db.query(SaaSPlan).filter(SaaSPlan.code == sub.plan_code).first()
    plan_features = json.loads(plan.features_json or "[]") if plan else []
    addons = json.loads(sub.selected_addons_json or "[]")

    addon_feature_map = {
        "marketplace": ["marketplace_basic", "driver_marketplace_search"],
        "gps_tracking": ["marketplace_gps"],
        "ai": ["ai_basic"],
        "admin_controls": ["admin_controls"],
    }

    addon_features = []
    for addon in addons:
        addon_features.extend(addon_feature_map.get(addon, []))

    return feature_code in set(plan_features + addon_features)


def require_feature_or_raise(db: Session, tenant_id: str, feature_code: str):
    from fastapi import HTTPException

    if not tenant_has_feature(db, tenant_id, feature_code):
        raise HTTPException(
            status_code=403,
            detail={
                "error": "feature_not_available_on_plan",
                "tenant_id": tenant_id,
                "required_feature": feature_code,
                "message": "Upgrade your subscription to access this feature.",
            },
        )


def downgrade_expired_trial(db: Session, sub: TenantSubscription) -> bool:
    if not sub.trial or sub.status != "trialing":
        return False
    now = datetime.utcnow()
    if sub.trial_ends_at and now >= sub.trial_ends_at:
        sub.plan_code = "starter"
        sub.status = "active"
        sub.trial = False
        db.add(sub)

        # Sync Tenant.plan_code so admin console and tenant context reflect the downgrade
        from app.models.tenant import Tenant
        import uuid as _uuid
        tenant = db.query(Tenant).filter(Tenant.slug == sub.tenant_id).first()
        if not tenant:
            try:
                tenant = db.query(Tenant).filter(Tenant.id == _uuid.UUID(sub.tenant_id)).first()
            except (ValueError, TypeError):
                pass
        if tenant:
            tenant.plan_code = "starter"
            db.add(tenant)

        db.commit()
        return True
    return False

