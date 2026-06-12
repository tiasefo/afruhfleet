from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime

from admin_app.api.deps import get_current_admin
from admin_app.db.session import get_db
from admin_app.models.admin_user import AdminUser
from admin_app.schemas.proxy import ProxyRunnerCreate
from admin_app.services.audit_service import record_admin_audit

router = APIRouter(prefix="/runners", tags=["Admin – Runners"])

# Mock runner data for now - in production this would connect to actual runner infrastructure
MOCK_RUNNERS = [
    {
        "id": "runner-001",
        "name": "Ghana Runner 1",
        "status": "online",
        "ip_address": "10.0.0.100",
        "region": "gh-accra",
        "capacity": 50,
        "active_tenants": 12,
        "last_heartbeat": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "cpu_usage": 25.5,
        "memory_usage": 60.2,
        "disk_usage": 45.8
    },
    {
        "id": "runner-002", 
        "name": "Ghana Runner 2",
        "status": "offline",
        "ip_address": "10.0.0.101",
        "region": "gh-kumasi",
        "capacity": 30,
        "active_tenants": 0,
        "last_heartbeat": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "cpu_usage": 0.0,
        "memory_usage": 0.0,
        "disk_usage": 0.0
    }
]

@router.get("")
def list_runners(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """List all runner nodes with their status and metrics."""
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="runners.listed",
        entity_type="runner",
    )
    return MOCK_RUNNERS

@router.post("")
def create_runner(
    payload: ProxyRunnerCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Create a new runner node."""
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="runner.created",
        entity_type="runner",
        details=f"Created runner: {payload.name}",
    )
    
    new_runner = {
        "id": f"runner-{len(MOCK_RUNNERS) + 1:03d}",
        "name": payload.name,
        "status": "initializing",
        "ip_address": payload.ip_address,
        "region": payload.region or "default",
        "capacity": payload.capacity or 25,
        "active_tenants": 0,
        "last_heartbeat": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "cpu_usage": 0.0,
        "memory_usage": 0.0,
        "disk_usage": 0.0
    }
    
    MOCK_RUNNERS.append(new_runner)
    return new_runner

@router.get("/{runner_id}")
def get_runner(
    runner_id: str,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get detailed information about a specific runner."""
    runner = next((r for r in MOCK_RUNNERS if r["id"] == runner_id), None)
    if not runner:
        raise HTTPException(status_code=404, detail="Runner not found")
    
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="runner.viewed",
        entity_type="runner",
        entity_id=runner_id,
    )
    
    return runner

@router.post("/{runner_id}/restart")
def restart_runner(
    runner_id: str,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    """Restart a runner node."""
    runner = next((r for r in MOCK_RUNNERS if r["id"] == runner_id), None)
    if not runner:
        raise HTTPException(status_code=404, detail="Runner not found")
    
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="runner.restarted",
        entity_type="runner",
        entity_id=runner_id,
    )
    
    # In a real implementation, this would send a restart command to the runner
    runner["status"] = "restarting"
    return {"message": f"Runner {runner_id} restart initiated"}

@router.post("/{runner_id}/shutdown")
def shutdown_runner(
    runner_id: str,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    """Shutdown a runner node."""
    runner = next((r for r in MOCK_RUNNERS if r["id"] == runner_id), None)
    if not runner:
        raise HTTPException(status_code=404, detail="Runner not found")
    
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="runner.shutdown",
        entity_type="runner",
        entity_id=runner_id,
    )
    
    # In a real implementation, this would send a shutdown command to the runner
    runner["status"] = "offline"
    return {"message": f"Runner {runner_id} shutdown initiated"}

@router.delete("/{runner_id}")
def delete_runner(
    runner_id: str,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    """Delete a runner node."""
    global MOCK_RUNNERS
    runner_index = next((i for i, r in enumerate(MOCK_RUNNERS) if r["id"] == runner_id), None)
    if runner_index is None:
        raise HTTPException(status_code=404, detail="Runner not found")
    
    record_admin_audit(
        db,
        admin_email=current_admin.email,
        action="runner.deleted",
        entity_type="runner",
        entity_id=runner_id,
    )
    
    del MOCK_RUNNERS[runner_index]
    return {"message": f"Runner {runner_id} deleted"}

@router.get("/{runner_id}/metrics")
def get_runner_metrics(
    runner_id: str,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get detailed metrics for a specific runner."""
    runner = next((r for r in MOCK_RUNNERS if r["id"] == runner_id), None)
    if not runner:
        raise HTTPException(status_code=404, detail="Runner not found")
    
    # Return detailed metrics
    return {
        "runner_id": runner_id,
        "timestamp": datetime.utcnow().isoformat(),
        "cpu_usage": runner["cpu_usage"],
        "memory_usage": runner["memory_usage"],
        "disk_usage": runner["disk_usage"],
        "network_io": {
            "bytes_in": 1024000,
            "bytes_out": 512000
        },
        "tenant_count": runner["active_tenants"],
        "uptime": "5d 12h 30m",
        "load_average": [1.2, 1.5, 1.8]
    }
