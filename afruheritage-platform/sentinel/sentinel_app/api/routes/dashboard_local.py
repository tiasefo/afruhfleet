from __future__ import annotations

try:
    import psutil
except ImportError:
    psutil = None
import time
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from sentinel_app.api.deps import get_current_admin
from sentinel_app.db.session import get_db
from sentinel_app.models.admin_user import AdminUser

router = APIRouter(prefix="/dashboard", tags=["Admin Dashboard"])

def get_system_metrics():
    """Get real system performance metrics"""
    if psutil is None:
        return {
            "cpu_usage": 0,
            "cpu_cores": 0,
            "memory_usage": 0,
            "memory_used_gb": 0,
            "memory_total_gb": 0,
            "disk_usage": 0,
            "disk_used_gb": 0,
            "disk_total_gb": 0,
            "network_bytes_sent": 0,
            "network_bytes_recv": 0,
            "uptime_hours": 0,
            "error": "psutil not installed"
        }
    try:
        # CPU metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_count = psutil.cpu_count()
        
        # Memory metrics
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        memory_used_gb = memory.used / (1024**3)
        memory_total_gb = memory.total / (1024**3)
        
        # Disk metrics
        disk = psutil.disk_usage('/')
        disk_percent = disk.percent
        disk_used_gb = disk.used / (1024**3)
        disk_total_gb = disk.total / (1024**3)
        
        # Network metrics
        network = psutil.net_io_counters()
        bytes_sent = network.bytes_sent
        bytes_recv = network.bytes_recv
        
        return {
            "cpu_usage": round(cpu_percent, 2),
            "cpu_cores": cpu_count,
            "memory_usage": round(memory_percent, 2),
            "memory_used_gb": round(memory_used_gb, 2),
            "memory_total_gb": round(memory_total_gb, 2),
            "disk_usage": round(disk_percent, 2),
            "disk_used_gb": round(disk_used_gb, 2),
            "disk_total_gb": round(disk_total_gb, 2),
            "network_bytes_sent": bytes_sent,
            "network_bytes_recv": bytes_recv,
            "uptime_hours": round(time.time() - psutil.boot_time(), 2) / 3600
        }
    except Exception as e:
        return {
            "cpu_usage": 0,
            "cpu_cores": 0,
            "memory_usage": 0,
            "memory_used_gb": 0,
            "memory_total_gb": 0,
            "disk_usage": 0,
            "disk_used_gb": 0,
            "disk_total_gb": 0,
            "network_bytes_sent": 0,
            "network_bytes_recv": 0,
            "uptime_hours": 0,
            "error": str(e)
        }

@router.get("/stats")
def get_dashboard_stats(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get dashboard statistics with real performance metrics"""
    try:
        # Get system metrics
        system_metrics = get_system_metrics()

        # Real business metrics from the shared control-plane database.
        # (The sentinel container does not mount the `app` package, so raw SQL is used.)
        total_shipments = db.execute(text("SELECT COUNT(*) FROM shipments")).scalar() or 0
        active_shipments = db.execute(
            text("SELECT COUNT(*) FROM shipments WHERE status NOT IN ('DELIVERED','RETURNED','CANCELLED')")
        ).scalar() or 0
        pending_orders = db.execute(
            text("SELECT COUNT(*) FROM shipments WHERE status IN ('DRAFT','BOOKED')")
        ).scalar() or 0
        completed_orders = db.execute(
            text("SELECT COUNT(*) FROM shipments WHERE status = 'DELIVERED'")
        ).scalar() or 0
        total_revenue = db.execute(
            text("SELECT COALESCE(SUM(amount_minor), 0) FROM billing_payments WHERE status = 'PAID'")
        ).scalar() or 0
        monthly_revenue = db.execute(
            text("SELECT COALESCE(SUM(amount_minor), 0) FROM billing_payments WHERE status = 'PAID' AND created_at >= now() - interval '30 days'")
        ).scalar() or 0
        business_metrics = {
            "total_users": db.execute(text("SELECT COUNT(*) FROM users")).scalar() or 0,
            "active_users": db.execute(text("SELECT COUNT(*) FROM users WHERE is_active IS TRUE")).scalar() or 0,
            "total_tenants": db.execute(text("SELECT COUNT(*) FROM tenants")).scalar() or 0,
            "active_tenants": db.execute(text("SELECT COUNT(*) FROM tenants WHERE launch_status = 'active'")).scalar() or 0,
            "total_vendors": db.execute(text("SELECT COUNT(*) FROM delivery_vendors")).scalar() or 0,
            "pending_vendors": db.execute(text("SELECT COUNT(*) FROM delivery_vendors WHERE status = 'pending'")).scalar() or 0,
            "total_shipments": total_shipments,
            "total_revenue": round(float(total_revenue) / 100.0, 2),
            "monthly_revenue": round(float(monthly_revenue) / 100.0, 2),
            "total_payments": db.execute(text("SELECT COUNT(*) FROM billing_payments")).scalar() or 0,
            "active_shipments": active_shipments,
            "pending_orders": pending_orders,
            "completed_orders": completed_orders,
            "system_health": "healthy",
            "last_updated": datetime.utcnow().isoformat()
        }
        
        # Combine metrics
        stats = {
            **business_metrics,
            **system_metrics,
            "performance_score": calculate_performance_score(system_metrics)
        }
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load dashboard stats: {str(e)}")

@router.get("/health")
def get_system_health(
    current_admin: AdminUser = Depends(get_current_admin),
):
    """Get detailed system health information"""
    try:
        metrics = get_system_metrics()
        
        # Determine health status
        health_status = "healthy"
        issues = []
        
        if metrics["cpu_usage"] > 80:
            health_status = "warning"
            issues.append("High CPU usage")
            
        if metrics["memory_usage"] > 85:
            health_status = "critical"
            issues.append("High memory usage")
            
        if metrics["disk_usage"] > 90:
            health_status = "critical"
            issues.append("Low disk space")
        
        # Service health checks
        services = {
            "database": check_database_health(),
            "redis": check_redis_health(),
            "admin_backend": "healthy",
            "control_plane": check_control_plane_health()
        }
        
        overall_health = "healthy" if all(s == "healthy" for s in services.values()) else "degraded"
        
        return {
            "overall_status": overall_health,
            "status": "ok" if overall_health == "healthy" else "degraded",
            "database_status": services["database"],
            "redis_status": services["redis"],
            "api_status": services["control_plane"],
            "cpu_usage": metrics.get("cpu_usage", 0),
            "memory_usage": metrics.get("memory_usage", 0),
            "disk_usage": metrics.get("disk_usage", 0),
            "system_metrics": metrics,
            "services": services,
            "issues": issues,
            "last_check": datetime.utcnow().isoformat(),
            "uptime": metrics.get("uptime_hours", 0)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get system health: {str(e)}")

@router.get("/performance")
def get_performance_metrics(
    current_admin: AdminUser = Depends(get_current_admin),
):
    """Get detailed performance metrics"""
    try:
        metrics = get_system_metrics()
        
        # Calculate performance score (0-100)
        performance_score = calculate_performance_score(metrics)
        
        # Historical metrics are not persisted; return current metrics only.
        historical_data = []
        
        return {
            "current_metrics": metrics,
            "performance_score": performance_score,
            "historical_data": historical_data,
            "recommendations": generate_recommendations(metrics),
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute measure performance: {str(e)}")

def calculate_performance_score(metrics):
    """Calculate overall performance score (0-100)"""
    score = 100
    
    # CPU impact
    if metrics["cpu_usage"] > 80:
        score -= 20
    elif metrics["cpu_usage"] > 60:
        score -= 10
    
    # Memory impact
    if metrics["memory_usage"] > 85:
        score -= 20
    elif metrics["memory_usage"] > 70:
        score -= 10
    
    # Disk impact
    if metrics["disk_usage"] > 90:
        score -= 15
    elif metrics["disk_usage"] > 80:
        score -= 5
    
    return max(0, score)

def check_database_health():
    """Check database connectivity with a real query"""
    try:
        from sentinel_app.db.session import engine
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return "healthy"
    except Exception:
        return "unhealthy"

def check_redis_health():
    """Check Redis connectivity via a real ping"""
    try:
        import os
        import socket
        from urllib.parse import urlparse
        redis_url = os.environ.get("REDIS_URL", "redis://redis:6379/0")
        parsed = urlparse(redis_url)
        with socket.create_connection((parsed.hostname or "redis", parsed.port or 6379), timeout=3) as sock:
            sock.sendall(b"PING\r\n")
            reply = sock.recv(64)
        return "healthy" if reply.startswith(b"+PONG") else "unhealthy"
    except Exception:
        return "unhealthy"

def check_control_plane_health():
    """Check control plane connectivity"""
    try:
        import httpx
        from sentinel_app.core.config import admin_settings
        response = httpx.get(f"{admin_settings.control_plane_base_url}/health", timeout=5)
        return "healthy" if response.status_code == 200 else "unhealthy"
    except Exception:
        return "unhealthy"

def generate_recommendations(metrics):
    """Generate performance recommendations"""
    recommendations = []
    
    if metrics["cpu_usage"] > 80:
        recommendations.append("Consider scaling CPU resources")
    
    if metrics["memory_usage"] > 85:
        recommendations.append("Consider adding more RAM")
    
    if metrics["disk_usage"] > 80:
        recommendations.append("Clean up disk space or add storage")
    
    if metrics["uptime_hours"] > 168:  # 7 days
        recommendations.append("Consider scheduled restart for maintenance")
    
    return recommendations
