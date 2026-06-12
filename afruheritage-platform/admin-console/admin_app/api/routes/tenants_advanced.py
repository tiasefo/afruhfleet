from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_

from admin_app.api.deps import get_current_admin, get_db
from app.models.tenant import Tenant, TenantStatus
from app.models.user import User
from app.models.billing import Subscription, WalletTransaction, SubscriptionStatus
from app.models.vendor import DeliveryVendor, VendorStatus
from app.models.rbac import UserActivityLog
from app.schemas.admin import TenantResponse, TenantUpdate, TenantStats
from app.services.tenant_service import TenantService

router = APIRouter(prefix="/tenants", tags=["tenants"])


@router.get("/", response_model=List[TenantResponse])
def list_tenants_advanced(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    plan: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("created_at"),
    sort_order: Optional[str] = Query("desc"),
) -> Any:
    """
    Get advanced tenant listing with filtering and sorting.
    """
    query = db.query(Tenant)
    
    # Apply filters
    if search:
        query = query.filter(
            or_(
                Tenant.name.ilike(f"%{search}%"),
                Tenant.subdomain.ilike(f"%{search}%"),
                Tenant.contact_email.ilike(f"%{search}%")
            )
        )
    
    if status:
        query = query.filter(Tenant.status == status)
    
    if plan:
        query = query.join(Subscription).filter(Subscription.plan_code == plan)
    
    # Apply sorting
    if sort_by == "created_at":
        query = query.order_by(desc(Tenant.created_at) if sort_order == "desc" else Tenant.created_at)
    elif sort_by == "name":
        query = query.order_by(desc(Tenant.name) if sort_order == "desc" else Tenant.name)
    elif sort_by == "status":
        query = query.order_by(desc(Tenant.status) if sort_order == "desc" else Tenant.status)
    
    # Apply pagination
    tenants = query.offset(skip).limit(limit).all()
    
    # Get stats for each tenant
    result = []
    for tenant in tenants:
        stats = get_tenant_stats(db, tenant.id)
        result.append(TenantResponse(
            id=tenant.id,
            name=tenant.name,
            subdomain=tenant.subdomain,
            status=tenant.status.value,
            created_at=tenant.created_at,
            plan_code=stats.get("plan_code", "free_trial"),
            stats=TenantStats(**stats)
        ))
    
    return result


@router.get("/{tenant_id}", response_model=TenantResponse)
def get_tenant_advanced(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    tenant_id: UUID,
) -> Any:
    """
    Get detailed tenant information.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    stats = get_tenant_stats(db, tenant.id)
    
    return TenantResponse(
        id=tenant.id,
        name=tenant.name,
        subdomain=tenant.subdomain,
        status=tenant.status.value,
        created_at=tenant.created_at,
        plan_code=stats.get("plan_code", "free_trial"),
        stats=TenantStats(**stats)
    )


@router.put("/{tenant_id}", response_model=TenantResponse)
def update_tenant_advanced(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    tenant_id: UUID,
    tenant_in: TenantUpdate,
    background_tasks: BackgroundTasks,
) -> Any:
    """
    Update tenant with advanced features.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Update fields
    update_data = tenant_in.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        if hasattr(tenant, field):
            setattr(tenant, field, value)
    
    # Handle status change
    if "status" in update_data:
        background_tasks.add_task(
            handle_tenant_status_change,
            tenant_id=tenant_id,
            old_status=tenant.status,
            new_status=update_data["status"],
            admin_id=current_admin.id
        )
    
    db.commit()
    db.refresh(tenant)
    
    # Log activity
    activity = UserActivityLog(
        user_id=current_admin.id,
        action="update_tenant",
        resource_type="tenant",
        resource_id=str(tenant_id),
        ip_address="admin",
        user_agent="admin_console"
    )
    db.add(activity)
    db.commit()
    
    # Get updated stats
    stats = get_tenant_stats(db, tenant.id)
    
    return TenantResponse(
        id=tenant.id,
        name=tenant.name,
        subdomain=tenant.subdomain,
        status=tenant.status.value,
        created_at=tenant.created_at,
        plan_code=stats.get("plan_code", "free_trial"),
        stats=TenantStats(**stats)
    )


@router.post("/{tenant_id}/clone")
def clone_tenant(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    tenant_id: UUID,
    new_name: str,
    new_subdomain: str,
    background_tasks: BackgroundTasks,
) -> Any:
    """
    Clone tenant configuration.
    """
    source_tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not source_tenant:
        raise HTTPException(status_code=404, detail="Source tenant not found")
    
    # Check if subdomain already exists
    existing = db.query(Tenant).filter(Tenant.subdomain == new_subdomain).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subdomain already exists")
    
    # Create tenant clone
    tenant_service = TenantService(db)
    cloned_tenant = tenant_service.clone_tenant(
        source_tenant_id=tenant_id,
        new_name=new_name,
        new_subdomain=new_subdomain,
        created_by=current_admin.id
    )
    
    # Log activity
    activity = UserActivityLog(
        user_id=current_admin.id,
        action="clone_tenant",
        resource_type="tenant",
        resource_id=str(cloned_tenant.id),
        ip_address="admin",
        user_agent="admin_console"
    )
    db.add(activity)
    db.commit()
    
    return {"detail": f"Tenant {source_tenant.name} cloned successfully as {new_name}"}


@router.post("/{tenant_id}/export")
def export_tenant_data(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    tenant_id: UUID,
    include_users: bool = Query(True),
    include_billing: bool = Query(True),
    include_vendors: bool = Query(True),
    background_tasks: BackgroundTasks,
) -> Any:
    """
    Export tenant data.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Queue export task
    background_tasks.add_task(
        export_tenant_data_task,
        tenant_id=tenant_id,
        include_users=include_users,
        include_billing=include_billing,
        include_vendors=include_vendors,
        admin_id=current_admin.id
    )
    
    return {"detail": "Tenant data export started. You will receive a notification when complete."}


@router.post("/{tenant_id}/suspend")
def suspend_tenant(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    tenant_id: UUID,
    reason: str,
    background_tasks: BackgroundTasks,
) -> Any:
    """
    Suspend tenant.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    if tenant.status == TenantStatus.SUSPENDED:
        raise HTTPException(status_code=400, detail="Tenant is already suspended")
    
    # Suspend tenant
    tenant.status = TenantStatus.SUSPENDED
    tenant.suspension_reason = reason
    tenant.suspended_at = datetime.utcnow()
    tenant.suspended_by = current_admin.id
    
    # Deactivate all tenant users
    db.query(User).filter(User.tenant_id == tenant_id).update({"is_active": False})
    
    db.commit()
    
    # Handle suspension tasks
    background_tasks.add_task(
        handle_tenant_suspension,
        tenant_id=tenant_id,
        reason=reason,
        admin_id=current_admin.id
    )
    
    # Log activity
    activity = UserActivityLog(
        user_id=current_admin.id,
        action="suspend_tenant",
        resource_type="tenant",
        resource_id=str(tenant_id),
        ip_address="admin",
        user_agent="admin_console"
    )
    db.add(activity)
    db.commit()
    
    return {"detail": f"Tenant {tenant.name} has been suspended. Reason: {reason}"}


@router.post("/{tenant_id}/reactivate")
def reactivate_tenant(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    tenant_id: UUID,
    background_tasks: BackgroundTasks,
) -> Any:
    """
    Reactivate suspended tenant.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    if tenant.status != TenantStatus.SUSPENDED:
        raise HTTPException(status_code=400, detail="Tenant is not suspended")
    
    # Reactivate tenant
    tenant.status = TenantStatus.ACTIVE
    tenant.suspension_reason = None
    tenant.suspended_at = None
    tenant.suspended_by = None
    tenant.reactivated_at = datetime.utcnow()
    tenant.reactivated_by = current_admin.id
    
    # Reactivate tenant users
    db.query(User).filter(User.tenant_id == tenant_id).update({"is_active": True})
    
    db.commit()
    
    # Handle reactivation tasks
    background_tasks.add_task(
        handle_tenant_reactivation,
        tenant_id=tenant_id,
        admin_id=current_admin.id
    )
    
    # Log activity
    activity = UserActivityLog(
        user_id=current_admin.id,
        action="reactivate_tenant",
        resource_type="tenant",
        resource_id=str(tenant_id),
        ip_address="admin",
        user_agent="admin_console"
    )
    db.add(activity)
    db.commit()
    
    return {"detail": f"Tenant {tenant.name} has been reactivated"}


@router.get("/{tenant_id}/analytics")
def get_tenant_analytics(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    tenant_id: UUID,
    days: int = Query(30, ge=1, le=365),
) -> Any:
    """
    Get detailed tenant analytics.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # User activity
    user_activity = db.query(
        func.date(UserActivityLog.created_at).label('date'),
        func.count(UserActivityLog.id).label('count')
    ).join(User).filter(
        User.tenant_id == tenant_id,
        UserActivityLog.created_at >= start_date
    ).group_by(func.date(UserActivityLog.created_at)).all()
    
    # Billing activity
    billing_activity = db.query(
        func.date(WalletTransaction.created_at).label('date'),
        func.sum(WalletTransaction.amount).label('amount'),
        func.count(WalletTransaction.id).label('count')
    ).filter(
        WalletTransaction.tenant_id == tenant_id,
        WalletTransaction.created_at >= start_date
    ).group_by(func.date(WalletTransaction.created_at)).all()
    
    # Vendor activity
    vendor_stats = db.query(
        func.count(DeliveryVendor.id).label('total'),
        func.sum(func.case([(DeliveryVendor.status == VendorStatus.APPROVED, 1)], else_=0)).label('approved'),
        func.sum(func.case([(DeliveryVendor.status == VendorStatus.PENDING, 1)], else_=0)).label('pending')
    ).filter(DeliveryVendor.tenant_id == tenant_id).first()
    
    return {
        "user_activity": [
            {"date": str(date), "count": count} 
            for date, count in user_activity
        ],
        "billing_activity": [
            {"date": str(date), "amount": float(amount), "count": count} 
            for date, amount, count in billing_activity
        ],
        "vendor_stats": {
            "total": int(vendor_stats.total or 0),
            "approved": int(vendor_stats.approved or 0),
            "pending": int(vendor_stats.pending or 0)
        }
    }


# Helper functions
def get_tenant_stats(db: Session, tenant_id: UUID) -> dict:
    """Get tenant statistics."""
    # User count
    total_users = db.query(User).filter(User.tenant_id == tenant_id).count()
    active_users = db.query(User).filter(
        User.tenant_id == tenant_id,
        User.is_active == True
    ).count()
    
    # Active shipments (placeholder)
    active_shipments = 0  # TODO: Connect to shipment model
    
    # Monthly revenue
    monthly_revenue = db.query(func.sum(WalletTransaction.amount)).filter(
        WalletTransaction.tenant_id == tenant_id,
        WalletTransaction.transaction_type == "credit_purchase",
        WalletTransaction.created_at >= datetime.utcnow() - timedelta(days=30)
    ).scalar() or 0.0
    
    # Storage used (placeholder)
    storage_used = 0.0  # TODO: Implement storage tracking
    
    # API calls (placeholder)
    api_calls = 0  # TODO: Implement API call tracking
    
    # Current plan
    subscription = db.query(Subscription).filter(
        Subscription.tenant_id == tenant_id,
        Subscription.status == SubscriptionStatus.ACTIVE
    ).first()
    
    plan_code = subscription.plan_code if subscription else "free_trial"
    
    return {
        "total_users": total_users,
        "active_shipments": active_shipments,
        "monthly_revenue": float(monthly_revenue),
        "storage_used": storage_used,
        "api_calls": api_calls,
        "plan_code": plan_code
    }


async def handle_tenant_status_change(
    tenant_id: UUID,
    old_status: TenantStatus,
    new_status: str,
    admin_id: UUID
) -> None:
    """Handle tenant status change background tasks."""
    # TODO: Implement status change logic
    pass


async def handle_tenant_suspension(
    tenant_id: UUID,
    reason: str,
    admin_id: UUID
) -> None:
    """Handle tenant suspension background tasks."""
    # TODO: Implement suspension logic (notify users, stop services, etc.)
    pass


async def handle_tenant_reactivation(
    tenant_id: UUID,
    admin_id: UUID
) -> None:
    """Handle tenant reactivation background tasks."""
    # TODO: Implement reactivation logic (notify users, restart services, etc.)
    pass


async def export_tenant_data_task(
    tenant_id: UUID,
    include_users: bool,
    include_billing: bool,
    include_vendors: bool,
    admin_id: UUID
) -> None:
    """Export tenant data background task."""
    # TODO: Implement data export logic
    pass
