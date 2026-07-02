from app.core.config import settings
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.deps import get_current_user, require_superuser
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.models.kyc import KYCSubmission
from app.models.shipment import Shipment
from app.models.billing import Payment
from app.models.vendor import DeliveryVendor, VendorStatus
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

@router.get('/{tenant_id}/dashboard')
def tenant_analytics_dashboard(tenant_id: str, db: Session=Depends(get_db), current_user: User=Depends(get_current_user)):
    """Return tenant-scoped analytics dashboard data."""
    from app.models.tenant import LaunchStatus
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail='Tenant not found')

    shipments = db.query(Shipment).filter(Shipment.tenant_id == tenant_id).count()
    pending_shipments = db.query(Shipment).filter(
        Shipment.tenant_id == tenant_id,
        Shipment.status.in_(['draft', 'booked', 'picked_up', 'in_transit', 'at_customs', 'customs_cleared', 'out_for_delivery'])
    ).count()
    delivered_shipments = db.query(Shipment).filter(
        Shipment.tenant_id == tenant_id,
        Shipment.status == 'delivered'
    ).count()

    payments = db.query(Payment).filter(Payment.tenant_id == tenant_id).count()
    revenue_minor = db.query(Payment).filter(
        Payment.tenant_id == tenant_id
    ).with_entities(Payment.amount_minor).all()
    revenue_sum = (sum([p.amount_minor for p in revenue_minor]) / 100) if revenue_minor else 0

    vendors = db.query(DeliveryVendor).count()
    approved_vendors = db.query(DeliveryVendor).filter(
        DeliveryVendor.status == VendorStatus.APPROVED
    ).count()

    return {
        'tenant_id': tenant_id,
        'company_name': tenant.company_name,
        'shipments': {
            'total': shipments,
            'pending': pending_shipments,
            'delivered': delivered_shipments,
        },
        'payments': {
            'total': payments,
            'revenue': revenue_sum,
        },
        'vendors': {
            'total': vendors,
            'approved': approved_vendors,
        },
    }