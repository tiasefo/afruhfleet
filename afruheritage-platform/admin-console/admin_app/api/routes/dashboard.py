from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from admin_app.api.deps import get_current_admin, get_db
from app.models.user import User
from app.models.tenant import Tenant, TenantStatus
from app.models.billing import WalletTransaction, Subscription, SubscriptionStatus
from app.models.vendor import DeliveryVendor, VendorStatus
from app.models.rbac import UserActivityLog
from app.schemas.admin import DashboardResponse, DashboardStats, SystemHealth, AlertItem, UserActivityLogResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
) -> Any:
    """
    Get real-time dashboard statistics.
    """
    # User statistics
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Tenant statistics
    total_tenants = db.query(Tenant).count()
    active_tenants = db.query(Tenant).filter(Tenant.status == TenantStatus.ACTIVE).count()
    
    # Vendor statistics
    total_vendors = db.query(DeliveryVendor).count()
    pending_vendors = db.query(DeliveryVendor).filter(
        DeliveryVendor.status == VendorStatus.PENDING
    ).count()
    
    # Revenue statistics
    total_revenue = db.query(func.sum(WalletTransaction.amount)).filter(
        WalletTransaction.transaction_type == "credit_purchase",
        WalletTransaction.created_at >= datetime.utcnow() - timedelta(days=365)
    ).scalar() or 0.0
    
    monthly_revenue = db.query(func.sum(WalletTransaction.amount)).filter(
        WalletTransaction.transaction_type == "credit_purchase",
        WalletTransaction.created_at >= datetime.utcnow() - timedelta(days=30)
    ).scalar() or 0.0
    
    # Shipment statistics (placeholder - would connect to real shipment data)
    total_shipments = 0  # TODO: Connect to shipment model
    active_shipments = 0  # TODO: Connect to shipment model
    
    return DashboardStats(
        total_users=total_users,
        active_users=active_users,
        total_tenants=total_tenants,
        active_tenants=active_tenants,
        total_vendors=total_vendors,
        pending_vendors=pending_vendors,
        total_revenue=float(total_revenue),
        monthly_revenue=float(monthly_revenue),
        total_shipments=total_shipments,
        active_shipments=active_shipments,
    )


@router.get("/health", response_model=SystemHealth)
def get_system_health(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
) -> Any:
    """
    Get system health metrics.
    """
    import psutil
    import time
    
    # System metrics
    cpu_usage = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # Database status
    try:
        db.execute("SELECT 1")
        database_status = "healthy"
    except Exception:
        database_status = "unhealthy"
    
    # Redis status (placeholder)
    redis_status = "healthy"  # TODO: Implement Redis health check
    
    # API status
    api_status = "healthy"
    
    # Uptime (placeholder - would track actual service uptime)
    uptime = "2d 14h 32m"
    
    return SystemHealth(
        cpu_usage=cpu_usage,
        memory_usage=memory.percent,
        disk_usage=disk.percent,
        database_status=database_status,
        redis_status=redis_status,
        api_status=api_status,
        uptime=uptime,
    )


@router.get("/alerts", response_model=List[AlertItem])
def get_alerts(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=100),
) -> Any:
    """
    Get system alerts and notifications.
    """
    # Generate alerts based on system conditions
    alerts = []
    
    # Check for critical alerts
    if db.query(User).filter(User.is_active == False).count() > 10:
        alerts.append(AlertItem(
            id=UUID(),
            type="business",
            severity="medium",
            title="High Number of Inactive Users",
            message="More than 10 users are currently inactive",
            created_at=datetime.utcnow(),
            is_read=False,
        ))
    
    # Check for pending vendors
    pending_count = db.query(DeliveryVendor).filter(
        DeliveryVendor.status == VendorStatus.PENDING
    ).count()
    
    if pending_count > 5:
        alerts.append(AlertItem(
            id=UUID(),
            type="business",
            severity="medium",
            title=f"{pending_count} Pending Vendor Applications",
            message="Several vendor applications are waiting for review",
            created_at=datetime.utcnow(),
            is_read=False,
        ))
    
    # Check system health alerts
    import psutil
    if psutil.cpu_percent() > 80:
        alerts.append(AlertItem(
            id=UUID(),
            type="system",
            severity="high",
            title="High CPU Usage",
            message="CPU usage is above 80%",
            created_at=datetime.utcnow(),
            is_read=False,
        ))
    
    memory = psutil.virtual_memory()
    if memory.percent > 85:
        alerts.append(AlertItem(
            id=UUID(),
            type="system",
            severity="high",
            title="High Memory Usage",
            message="Memory usage is above 85%",
            created_at=datetime.utcnow(),
            is_read=False,
        ))
    
    # Sort by severity and creation time
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    alerts.sort(key=lambda x: (severity_order.get(x.severity, 4), x.created_at), reverse=True)
    
    return alerts[:limit]


@router.get("/activities", response_model=List[UserActivityLogResponse])
def get_recent_activities(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    limit: int = Query(20, ge=1, le=100),
    action_filter: str | None = Query(None),
) -> Any:
    """
    Get recent user activities.
    """
    query = db.query(UserActivityLog)
    
    if action_filter:
        query = query.filter(UserActivityLog.action == action_filter)
    
    activities = query.order_by(desc(UserActivityLog.created_at)).limit(limit).all()
    
    return [UserActivityLogResponse.from_orm(activity) for activity in activities]


@router.get("/overview", response_model=DashboardResponse)
def get_dashboard_overview(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
) -> Any:
    """
    Get complete dashboard overview.
    """
    stats = get_dashboard_stats(db=db, current_admin=current_admin)
    health = get_system_health(db=db, current_admin=current_admin)
    alerts = get_alerts(db=db, current_admin=current_admin, limit=10)
    activities = get_recent_activities(db=db, current_admin=current_admin, limit=10)
    
    return DashboardResponse(
        stats=stats,
        health=health,
        alerts=alerts,
        recent_activities=activities,
    )


# Analytics endpoints
@router.get("/analytics/users")
def get_user_analytics(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    days: int = Query(30, ge=1, le=365),
) -> Any:
    """
    Get user growth analytics.
    """
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Daily user registrations
    daily_registrations = db.query(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('count')
    ).filter(
        User.created_at >= start_date
    ).group_by(func.date(User.created_at)).all()
    
    # User role distribution
    role_distribution = db.query(
        User.role,
        func.count(User.id).label('count')
    ).group_by(User.role).all()
    
    # Active vs inactive users
    active_inactive = db.query(
        func.sum(func.case([(User.is_active == True, 1)], else_=0)).label('active'),
        func.sum(func.case([(User.is_active == False, 1)], else_=0)).label('inactive')
    ).first()
    
    return {
        "daily_registrations": [
            {"date": str(date), "count": count} 
            for date, count in daily_registrations
        ],
        "role_distribution": [
            {"role": role, "count": count} 
            for role, count in role_distribution
        ],
        "active_inactive": {
            "active": int(active_inactive.active or 0),
            "inactive": int(active_inactive.inactive or 0)
        }
    }


@router.get("/analytics/revenue")
def get_revenue_analytics(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
    days: int = Query(30, ge=1, le=365),
) -> Any:
    """
    Get revenue analytics.
    """
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Daily revenue
    daily_revenue = db.query(
        func.date(WalletTransaction.created_at).label('date'),
        func.sum(WalletTransaction.amount).label('revenue')
    ).filter(
        WalletTransaction.transaction_type == "credit_purchase",
        WalletTransaction.created_at >= start_date
    ).group_by(func.date(WalletTransaction.created_at)).all()
    
    # Revenue by plan
    revenue_by_plan = db.query(
        Subscription.plan_code,
        func.sum(WalletTransaction.amount).label('revenue')
    ).join(
        Subscription, WalletTransaction.tenant_id == Subscription.tenant_id
    ).filter(
        WalletTransaction.transaction_type == "credit_purchase",
        WalletTransaction.created_at >= start_date
    ).group_by(Subscription.plan_code).all()
    
    return {
        "daily_revenue": [
            {"date": str(date), "revenue": float(revenue)} 
            for date, revenue in daily_revenue
        ],
        "revenue_by_plan": [
            {"plan": plan, "revenue": float(revenue)} 
            for plan, revenue in revenue_by_plan
        ]
    }


@router.get("/analytics/tenants")
def get_tenant_analytics(
    *,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
) -> Any:
    """
    Get tenant analytics.
    """
    # Tenant status distribution
    status_distribution = db.query(
        Tenant.status,
        func.count(Tenant.id).label('count')
    ).group_by(Tenant.status).all()
    
    # Tenant plan distribution
    plan_distribution = db.query(
        Subscription.plan_code,
        func.count(Subscription.tenant_id).label('count')
    ).filter(
        Subscription.status == SubscriptionStatus.ACTIVE
    ).group_by(Subscription.plan_code).all()
    
    # Monthly tenant growth
    monthly_growth = db.query(
        func.date_trunc('month', Tenant.created_at).label('month'),
        func.count(Tenant.id).label('count')
    ).group_by(func.date_trunc('month', Tenant.created_at)).order_by(
        func.date_trunc('month', Tenant.created_at)
    ).all()
    
    return {
        "status_distribution": [
            {"status": status, "count": count} 
            for status, count in status_distribution
        ],
        "plan_distribution": [
            {"plan": plan, "count": count} 
            for plan, count in plan_distribution
        ],
        "monthly_growth": [
            {"month": str(month), "count": count} 
            for month, count in monthly_growth
        ]
    }
