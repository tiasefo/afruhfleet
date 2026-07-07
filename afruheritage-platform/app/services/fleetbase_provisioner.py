"""
Fleetbase Provisioner (STUB - Single Shared Fleetbase Instance)

This is a stub implementation since Afruheritage uses a single shared Fleetbase instance
at http://10.0.0.115:8003 with org-level isolation (fleetbase_org_id), not per-tenant
container orchestration via SSH.

All functions here are no-ops to maintain API compatibility without SSH-based provisioning.
"""
from typing import Any
from sqlalchemy.orm import Session

class ProvisionResult:
    """Stub result for Fleetbase provisioning."""
    def __init__(self, install_path: str, console_url: str, api_url: str, detail: str):
        self.install_path = install_path
        self.console_url = console_url
        self.api_url = api_url
        self.detail = detail

class FleetbaseProvisioner:
    """Stub provisioner for single shared Fleetbase instance."""
    
    def __init__(self, runner: Any):
        """No-op: Single shared Fleetbase instance, no runner needed."""
        self.runner = runner
    
    def provision(self, tenant: Any) -> ProvisionResult:
        """No-op: Single shared Fleetbase instance, no SSH provisioning needed."""
        return ProvisionResult(
            install_path="/dev/null",
            console_url="http://10.0.0.115:8003",
            api_url="http://10.0.0.115:8003",
            detail="Single shared Fleetbase instance - no provisioning needed"
        )
