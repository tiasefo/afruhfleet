from app.core.config import settings
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_superuser
from app.models.tenant import Tenant
from app.models.user import User
from app.models.kyc import KYCSubmission
from app.models.shipment import Shipment
from app.models.billing import Payment
router = APIRouter(prefix='/analytics', tags=['analytics'])

@router.get('/admin/summary')
def admin_analytics_summary(db: Session=Depends(get_db), current_user: User=Depends(require_superuser)):
    """Return summary analytics for admin dashboard"""
    tenants = db.query(Tenant).count()
    users = db.query(User).count()
    kyc_total = db.query(KYCSubmission).count()
    kyc_approved = db.query(KYCSubmission).filter_by(status='approved').count()
    shipments = db.query(Shipment).count()
    payments = db.query(Payment).count()
    revenue_minor = db.query(Payment).with_entities(Payment.amount_minor).all()
    revenue_sum = (sum([p.amount_minor for p in revenue_minor]) / 100) if revenue_minor else 0
    return {'tenants': tenants, 'users': users, 'kyc_total': kyc_total, 'kyc_approved': kyc_approved, 'shipments': shipments, 'payments': payments, 'revenue': revenue_sum}