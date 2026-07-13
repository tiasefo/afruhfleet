from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.saas_subscription import TenantSubscription, FeatureUsage
from app.services.billing_service import consume_wallet_credits

CREDIT_COSTS = {
    "marketplace_post": 5,
    "marketplace_gps_ping": 1,
    "driver_search": 1,
    "ai_chat": 3,
    "runtime_provision": 20,
}


def consume_credits(db: Session, tenant_id: str, feature_code: str, units: int = 1):
    """Debit credits from the tenant's wallet, not from TenantSubscription.credits_balance.

    The wallet (billing_wallets.balance_credits) is the single source of truth for
    credit balance. TenantSubscription.credits_balance is deprecated for consumption
    purposes -- evaluate_subscription_state reads the wallet, so consume_credits
    must also debit the wallet to stay consistent.
    """
    cost_per_unit = CREDIT_COSTS.get(feature_code, 1)
    total_cost = cost_per_unit * units

    sub = db.query(TenantSubscription).filter(TenantSubscription.tenant_id == tenant_id).first()

    if not sub:
        raise HTTPException(status_code=403, detail="tenant_subscription_not_found")

    if sub.status not in ["active", "trial"]:
        raise HTTPException(status_code=403, detail="subscription_not_active")

    try:
        wallet = consume_wallet_credits(
            db,
            tenant_id=tenant_id,
            usage_type=feature_code,
            credits=total_cost,
            memo=f"Credit consumption for {feature_code}",
        )
    except ValueError:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "insufficient_credits",
                "tenant_id": tenant_id,
                "required": total_cost,
                "message": "Upgrade plan or top up credits.",
            },
        )

    usage = FeatureUsage(
        tenant_id=tenant_id,
        feature_code=feature_code,
        units_used=units,
    )

    db.add(usage)
    db.commit()

    return {
        "tenant_id": tenant_id,
        "feature_code": feature_code,
        "units": units,
        "credits_charged": total_cost,
        "credits_remaining": wallet.balance_credits,
    }
