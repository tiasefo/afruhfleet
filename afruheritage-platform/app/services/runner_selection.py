"""
Runner Selection Service (STUB - Single Shared Fleetbase Instance)

This is a stub implementation since Afruheritage uses a single shared Fleetbase instance
at http://10.0.0.115:8003 with org-level isolation (fleetbase_org_id), not per-tenant
container orchestration.

All functions here are no-ops to maintain API compatibility without runner selection logic.
"""
from typing import Any
from sqlalchemy.orm import Session

def select_runner_for_tenant(db: Session, tenant: Any) -> Any:
    """No-op: Single shared Fleetbase instance, no runner selection needed."""
    return None
