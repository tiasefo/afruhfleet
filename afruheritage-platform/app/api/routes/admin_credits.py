from fastapi import APIRouter, Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.saas_subscription import TenantSubscription, FeatureUsage
from app.api.deps import require_superuser
from app.models.user import User

router = APIRouter(prefix="/admin/credits", tags=["Admin Credits"])

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

@router.get("/{tenant_id}")
def tenant_credits(tenant_id: str, _: User = Depends(require_superuser)):
    db = SessionLocal()
    try:
        sub = db.query(TenantSubscription).filter(TenantSubscription.tenant_id == tenant_id).first()
        usage = (
            db.query(FeatureUsage)
            .filter(FeatureUsage.tenant_id == tenant_id)
            .order_by(FeatureUsage.created_at.desc())
            .limit(100)
            .all()
        )

        return {
            "tenant_id": tenant_id,
            "subscription": {
                "plan_code": sub.plan_code if sub else None,
                "status": sub.status if sub else None,
                "credits_balance": sub.credits_balance if sub else 0,
            },
            "usage": [
                {
                    "feature_code": x.feature_code,
                    "units_used": x.units_used,
                    "created_at": x.created_at.isoformat(),
                }
                for x in usage
            ],
        }
    finally:
        db.close()

@router.post("/{tenant_id}/topup/{credits}")
def topup_credits(tenant_id: str, credits: int, _: User = Depends(require_superuser)):
    db = SessionLocal()
    try:
        sub = db.query(TenantSubscription).filter(TenantSubscription.tenant_id == tenant_id).first()
        if not sub:
            return {"error": "tenant_subscription_not_found"}

        sub.credits_balance += credits
        db.add(sub)
        db.commit()
        db.refresh(sub)

        return {
            "tenant_id": tenant_id,
            "credits_added": credits,
            "credits_balance": sub.credits_balance,
        }
    finally:
        db.close()
