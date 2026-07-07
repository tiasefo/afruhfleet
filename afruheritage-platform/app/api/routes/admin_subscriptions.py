from fastapi import APIRouter, Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.services.entitlements import ensure_demo_subscription, tenant_has_feature
from app.api.deps import require_superuser
from app.models.user import User

router = APIRouter(prefix="/admin/subscriptions", tags=["Admin Subscriptions"])

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@router.post("/demo/activate/{tenant_id}/{plan_code}")
def activate_demo_subscription(tenant_id: str, plan_code: str, _: User = Depends(require_superuser)):
    db = SessionLocal()
    try:
        sub = ensure_demo_subscription(db, tenant_id, plan_code)
        return {
            "tenant_id": sub.tenant_id,
            "plan_code": sub.plan_code,
            "status": sub.status,
            "credits_balance": sub.credits_balance,
            "selected_addons_json": sub.selected_addons_json,
        }
    finally:
        db.close()


@router.get("/{tenant_id}/features/{feature_code}")
def check_feature(tenant_id: str, feature_code: str, _: User = Depends(require_superuser)):
    db = SessionLocal()
    try:
        return {
            "tenant_id": tenant_id,
            "feature_code": feature_code,
            "allowed": tenant_has_feature(db, tenant_id, feature_code),
        }
    finally:
        db.close()
