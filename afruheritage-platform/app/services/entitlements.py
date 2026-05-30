from __future__ import annotations

import json
from sqlalchemy.orm import Session
from app.models.saas_subscription import SaaSPlan, TenantSubscription


DEFAULT_PLAN_FEATURES = {
    "free": ["marketplace_basic", "tracking_basic"],
    "professional": ["marketplace_basic", "marketplace_gps", "tracking_basic", "ai_basic"],
    "business": ["marketplace_basic", "marketplace_gps", "tracking_basic", "ai_basic", "admin_controls"],
    "vendor_driver": ["driver_marketplace_search", "marketplace_gps", "tracking_basic"],
}


def seed_default_plans(db: Session) -> None:
    defaults = [
        ("free", "Free", 0, 50),
        ("professional", "Professional", 1000, 500),
        ("business", "Business", 2500, 1500),
        ("vendor_driver", "Vendor / Driver", 300, 100),
    ]

    for code, name, price, credits in defaults:
        existing = db.query(SaaSPlan).filter(SaaSPlan.code == code).first()
        if not existing:
            db.add(
                SaaSPlan(
                    code=code,
                    name=name,
                    monthly_price=price,
                    included_credits=credits,
                    features_json=json.dumps(DEFAULT_PLAN_FEATURES.get(code, [])),
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


def tenant_has_feature(db: Session, tenant_id: str, feature_code: str) -> bool:
    seed_default_plans(db)

    sub = db.query(TenantSubscription).filter(TenantSubscription.tenant_id == tenant_id).first()
    if not sub:
        return False

    if sub.status not in ["active", "trial"]:
        return False

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
                "error": "feature_not_available_for_subscription",
                "tenant_id": tenant_id,
                "required_feature": feature_code,
                "message": "Upgrade subscription or enable the required add-on.",
            },
        )
