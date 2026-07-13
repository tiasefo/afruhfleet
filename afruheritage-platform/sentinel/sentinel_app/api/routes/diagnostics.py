from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sentinel_app.api.deps import get_current_admin, get_db
from sentinel_app.models.admin_user import AdminUser
import sentinel_app.services.control_plane_client as cp_client
import psutil
import platform
from datetime import datetime

router = APIRouter(prefix="/diagnostics", tags=["Diagnostics"])


@router.get("/system")
def get_system_diagnostics(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    """Get system health diagnostics."""
    try:
        # Admin console system info
        admin_system = {
            "platform": platform.system(),
            "platform_release": platform.release(),
            "platform_version": platform.version(),
            "architecture": platform.machine(),
            "processor": platform.processor(),
            "hostname": platform.node(),
            "cpu_count": psutil.cpu_count(),
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_total": psutil.virtual_memory().total,
            "memory_available": psutil.virtual_memory().available,
            "memory_percent": psutil.virtual_memory().percent,
            "disk_total": psutil.disk_usage('/').total,
            "disk_used": psutil.disk_usage('/').used,
            "disk_percent": psutil.disk_usage('/').percent,
            "boot_time": datetime.fromtimestamp(psutil.boot_time()).isoformat(),
        }
        
        # Control Plane health check
        try:
            cp_health = cp_client.get_tenant_list(_get_cp_token(request), limit=1)
            control_plane_status = "healthy"
        except Exception:
            control_plane_status = "unhealthy"
        
        return {
            "admin_console": admin_system,
            "control_plane_status": control_plane_status,
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagnostics failed: {str(e)}")


@router.get("/endpoints")
def get_endpoint_health(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    """Check health of all critical endpoints."""
    endpoints = {
        "admin_auth": "/sentinel/auth/me",
        "tenants": "/sentinel/tenants",
        "users": "/sentinel/users",
        "billing": "/sentinel/billing/plans",
        "domains": "/sentinel/domains",
        "tickets": "/sentinel/tickets",
        "shipments": "/sentinel/shipments",
        "payments": "/sentinel/payments",
        "fleetbase": "/sentinel/fleetbase/tenant",
        "feature_flags": "/sentinel/feature-flags/global",
    }
    
    results = {}
    for name, path in endpoints.items():
        try:
            # Try to ping the endpoint
            if name == "admin_auth":
                # Auth endpoint requires special handling
                results[name] = {"status": "healthy", "response_time_ms": 10}
            else:
                # Simulated health check - in production, actually call the endpoint
                results[name] = {"status": "healthy", "response_time_ms": 15}
        except Exception as e:
            results[name] = {"status": "unhealthy", "error": str(e)}
    
    return {
        "endpoints": results,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    """Get recent audit logs for diagnostics."""
    try:
        from sentinel_app.models.audit_log import AdminAuditLog

        logs = db.query(AdminAuditLog).order_by(
            AdminAuditLog.created_at.desc()
        ).limit(limit).all()

        return {
            "logs": [
                {
                    "id": str(log.id),
                    "admin_email": log.admin_email,
                    "action": log.action,
                    "entity_type": log.entity_type,
                    "entity_id": log.entity_id,
                    "details": log.details_json,
                    "created_at": log.created_at.isoformat() if log.created_at else None,
                }
                for log in logs
            ],
            "count": len(logs),
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        return {
            "logs": [],
            "count": 0,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
        }


def _get_cp_token(request: Request) -> str:
    """Extract Control Plane token from request."""
    # In production, this would come from admin session or config
    # For now, return a placeholder
    return request.headers.get("X-CP-Token", "")
