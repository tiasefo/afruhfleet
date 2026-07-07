"""
Fleetbase Runtime Service (STUB - Single Shared Fleetbase Instance)

This is a stub implementation since Afruheritage uses a single shared Fleetbase instance
at http://10.0.0.115:8003 with org-level isolation (fleetbase_org_id), not per-tenant
container orchestration.

All functions here are no-ops to maintain API compatibility without SSH-based provisioning.
"""
from typing import Any
from sqlalchemy.orm import Session

def sync_runtime_from_tenant(db: Session, tenant: Any, status: Any = None, last_error: str | None = None) -> None:
    """No-op: Single shared Fleetbase instance, no per-tenant runtime to sync."""
    pass

def pick_runner() -> Any:
    """No-op: Single shared Fleetbase instance, no runner selection needed."""
    return None

def create_runtime_request(tenant_id: str, runner_id: str) -> Any:
    """No-op: Single shared Fleetbase instance, no runtime creation needed."""
    return None

def run_install(runtime_id: str) -> Any:
    """No-op: Single shared Fleetbase instance, no install needed."""
    return None

def suspend_runtime(runtime_id: str) -> Any:
    """No-op: Single shared Fleetbase instance, no suspension needed."""
    return None

def retry_runtime(runtime_id: str) -> Any:
    """No-op: Single shared Fleetbase instance, no retry needed."""
    return None
