from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional, Any
from app.db.session import get_db

router = APIRouter(prefix="/admin/billing-config", tags=["Admin Billing Config"])

class PlanPriceUpdate(BaseModel):
    monthly_price: float
    annual_price: float = 0
    display_equivalent: Optional[str] = None

class FeatureUpdate(BaseModel):
    enabled: bool
    limit_value: Optional[int] = None
    limit_unit: Optional[str] = None
    requires_credits: bool = False
    credits_per_use: int = 0

class CreditPackUpdate(BaseModel):
    name: str
    credits: int
    bonus_credits: int = 0
    currency: str = "USD"
    price: float
    display_equivalent: Optional[str] = None
    is_active: bool = True

class ProviderUpdate(BaseModel):
    enabled: bool
    supported_currencies: list[str] = []

class ExchangeRateUpdate(BaseModel):
    rate: float

@router.get("/plans")
def list_plans(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT bp.id, bp.code, bp.name, bp.description, bp.price_amount, bp.currency,
               bp.billing_interval, bp.is_active,
               COALESCE(json_agg(DISTINCT jsonb_build_object(
                   'currency', bpp.currency,
                   'monthly_price', bpp.monthly_price,
                   'annual_price', bpp.annual_price,
                   'display_equivalent', bpp.display_equivalent
               )) FILTER (WHERE bpp.id IS NOT NULL), '[]') AS prices
        FROM billing_plans bp
        LEFT JOIN billing_plan_prices bpp ON bpp.plan_id = bp.id
        GROUP BY bp.id
        ORDER BY bp.price_amount
    """)).mappings().all()
    return [dict(r) for r in rows]

@router.get("/features/{plan_code}")
def list_plan_features(plan_code: str, db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT bpf.*
        FROM billing_plan_features bpf
        JOIN billing_plans bp ON bp.id=bpf.plan_id
        WHERE bp.code=:plan_code
        ORDER BY bpf.feature_code
    """), {"plan_code": plan_code}).mappings().all()
    return [dict(r) for r in rows]

@router.put("/plans/{plan_code}/price/{currency}")
def update_plan_price(plan_code: str, currency: str, payload: PlanPriceUpdate, db: Session = Depends(get_db)):
    plan = db.execute(text("SELECT id FROM billing_plans WHERE code=:code"), {"code": plan_code}).mappings().first()
    if not plan:
        raise HTTPException(404, "Plan not found")

    db.execute(text("""
        INSERT INTO billing_plan_prices (plan_id,currency,monthly_price,annual_price,display_equivalent,is_primary)
        VALUES (:plan_id,:currency,:monthly,:annual,:equiv,true)
        ON CONFLICT (plan_id,currency) DO UPDATE SET
          monthly_price=EXCLUDED.monthly_price,
          annual_price=EXCLUDED.annual_price,
          display_equivalent=EXCLUDED.display_equivalent
    """), {
        "plan_id": plan["id"],
        "currency": currency.upper(),
        "monthly": payload.monthly_price,
        "annual": payload.annual_price,
        "equiv": payload.display_equivalent,
    })

    if currency.upper() == "USD":
        db.execute(text("""
            UPDATE billing_plans
            SET price_amount=:monthly, currency='USD', billing_interval='monthly'
            WHERE id=:plan_id
        """), {"monthly": payload.monthly_price, "plan_id": plan["id"]})

    db.commit()
    return {"status": "updated"}

@router.put("/plans/{plan_code}/features/{feature_code}")
def update_feature(plan_code: str, feature_code: str, payload: FeatureUpdate, db: Session = Depends(get_db)):
    plan = db.execute(text("SELECT id FROM billing_plans WHERE code=:code"), {"code": plan_code}).mappings().first()
    if not plan:
        raise HTTPException(404, "Plan not found")

    db.execute(text("""
        INSERT INTO billing_plan_features (
            plan_id, feature_code, enabled, limit_value, limit_unit,
            requires_credits, credits_per_use
        )
        VALUES (:plan_id,:feature,:enabled,:limit_value,:limit_unit,:requires_credits,:credits_per_use)
        ON CONFLICT (plan_id,feature_code) DO UPDATE SET
          enabled=EXCLUDED.enabled,
          limit_value=EXCLUDED.limit_value,
          limit_unit=EXCLUDED.limit_unit,
          requires_credits=EXCLUDED.requires_credits,
          credits_per_use=EXCLUDED.credits_per_use
    """), {
        "plan_id": plan["id"],
        "feature": feature_code,
        "enabled": payload.enabled,
        "limit_value": payload.limit_value,
        "limit_unit": payload.limit_unit,
        "requires_credits": payload.requires_credits,
        "credits_per_use": payload.credits_per_use,
    })
    db.commit()
    return {"status": "updated"}

@router.get("/credit-packs")
def list_credit_packs(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT * FROM billing_credit_packs
        ORDER BY sort_order, credits
    """)).mappings().all()
    return [dict(r) for r in rows]

@router.put("/credit-packs/{code}")
def upsert_credit_pack(code: str, payload: CreditPackUpdate, db: Session = Depends(get_db)):
    db.execute(text("""
        INSERT INTO billing_credit_packs (
            code,name,credits,bonus_credits,currency,price,display_equivalent,is_active
        )
        VALUES (:code,:name,:credits,:bonus,:currency,:price,:equiv,:active)
        ON CONFLICT (code) DO UPDATE SET
          name=EXCLUDED.name,
          credits=EXCLUDED.credits,
          bonus_credits=EXCLUDED.bonus_credits,
          currency=EXCLUDED.currency,
          price=EXCLUDED.price,
          display_equivalent=EXCLUDED.display_equivalent,
          is_active=EXCLUDED.is_active
    """), {
        "code": code,
        "name": payload.name,
        "credits": payload.credits,
        "bonus": payload.bonus_credits,
        "currency": payload.currency,
        "price": payload.price,
        "equiv": payload.display_equivalent,
        "active": payload.is_active,
    })
    db.commit()
    return {"status": "updated"}

@router.get("/payment-providers")
def list_payment_providers(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT provider_code, provider_name, enabled, supported_currencies, config
        FROM billing_payment_providers
        ORDER BY provider_code
    """)).mappings().all()
    return [dict(r) for r in rows]

@router.put("/payment-providers/{provider_code}")
def update_payment_provider(provider_code: str, payload: ProviderUpdate, db: Session = Depends(get_db)):
    db.execute(text("""
        UPDATE billing_payment_providers
        SET enabled=:enabled, supported_currencies=:currencies
        WHERE provider_code=:provider_code
    """), {
        "provider_code": provider_code,
        "enabled": payload.enabled,
        "currencies": payload.supported_currencies,
    })
    db.commit()
    return {"status": "updated"}

@router.get("/exchange-rates")
def list_exchange_rates(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT base_currency, target_currency, rate, source, is_active, updated_at
        FROM billing_exchange_rates
        ORDER BY target_currency
    """)).mappings().all()
    return [dict(r) for r in rows]

@router.put("/exchange-rates/USD/{target_currency}")
def update_exchange_rate(target_currency: str, payload: ExchangeRateUpdate, db: Session = Depends(get_db)):
    db.execute(text("""
        INSERT INTO billing_exchange_rates (base_currency,target_currency,rate,source,is_active,updated_at)
        VALUES ('USD',:target,:rate,'admin_configured',true,now())
        ON CONFLICT (base_currency,target_currency) DO UPDATE SET
          rate=EXCLUDED.rate,
          updated_at=now(),
          is_active=true
    """), {"target": target_currency.upper(), "rate": payload.rate})
    db.commit()
    return {"status": "updated"}
