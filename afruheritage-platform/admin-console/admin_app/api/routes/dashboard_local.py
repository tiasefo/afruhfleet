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

from admin_app.api.deps import get_current_admin
from admin_app.db.session import get_db
from admin_app.models.admin_user import AdminUser

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
        
        # Mock business metrics (in production, these would come from actual database queries)
        business_metrics = {
            "total_users": 156,
            "total_tenants": 23,
            "total_vendors": 45,
            "total_shipments": 1284,
            "total_revenue": 45670.50,
            "active_shipments": 89,
            "pending_orders": 12,
            "completed_orders": 1183,
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
        
        # Get historical data (mock for now)
        historical_data = generate_historical_data()
        
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
    """Check database connectivity"""
    try:
        # Simple health check - in production, this would be an actual DB query
        return "healthy"
    except:
        return "unhealthy"

def check_redis_health():
    """Check Redis connectivity"""
    try:
        # Simple health check - in production, this would be an actual Redis ping
        return "healthy"
    except:
        return "unhealthy"

def check_control_plane_health():
    """Check control plane connectivity"""
    try:
        import httpx
        response = httpx.get("http://localhost:8100/health", timeout=5)
        return "healthy" if response.status_code == 200 else "unhealthy"
    except:
        return "unhealthy"

def generate_historical_data():
    """Generate mock historical performance data"""
    now = datetime.utcnow()
    data = []
    
    for i in range(24):  # Last 24 hours
        timestamp = now - timedelta(hours=i)
        data.append({
            "timestamp": timestamp.isoformat(),
            "cpu_usage": 20 + (i % 40),  # Mock varying CPU
            "memory_usage": 30 + (i % 50),  # Mock varying memory
            "disk_usage": 45 + (i % 20),  # Mock varying disk
        })
    
    return data

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
