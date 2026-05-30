from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.saas_subscription import TenantSubscription, FeatureUsage

CREDIT_COSTS = {
    "marketplace_post": 5,
    "marketplace_gps_ping": 1,
    "driver_search": 1,
    "ai_chat": 3,
    "runtime_provision": 20,
}

def consume_credits(db: Session, tenant_id: str, feature_code: str, units: int = 1):
    cost_per_unit = CREDIT_COSTS.get(feature_code, 1)
    total_cost = cost_per_unit * units

    sub = db.query(TenantSubscription).filter(TenantSubscription.tenant_id == tenant_id).first()

    if not sub:
        raise HTTPException(status_code=403, detail="tenant_subscription_not_found")

    if sub.status not in ["active", "trial"]:
        raise HTTPException(status_code=403, detail="subscription_not_active")

    if sub.credits_balance < total_cost:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "insufficient_credits",
                "tenant_id": tenant_id,
                "required": total_cost,
                "available": sub.credits_balance,
                "message": "Upgrade plan or top up credits.",
            },
        )

    sub.credits_balance -= total_cost

    usage = FeatureUsage(
        tenant_id=tenant_id,
        feature_code=feature_code,
        units_used=units,
    )

    db.add(sub)
    db.add(usage)
    db.commit()
    db.refresh(sub)

    return {
        "tenant_id": tenant_id,
        "feature_code": feature_code,
        "units": units,
        "credits_charged": total_cost,
        "credits_remaining": sub.credits_balance,
    }
