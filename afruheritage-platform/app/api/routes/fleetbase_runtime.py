from __future__ import annotations
from app.core.config import settings
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import require_superuser
from app.db.session import get_db
from app.models.fleetbase_runtime import FleetbaseRuntime, FleetbaseRuntimeEvent, FleetbaseRunnerNode
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.fleetbase_runtime import RunnerCreateRequest, RunnerResponse, RuntimeDeployRequest, RuntimeEventResponse, RuntimeResponse, RuntimeRetryRequest, RuntimeSuspendRequest
from app.services.billing_service import assert_tenant_launch_ready
from app.services.fleetbase_runtime_service import create_runtime_request, pick_runner, retry_runtime, run_install, suspend_runtime, sync_runtime_from_tenant
router = APIRouter(prefix='/fleetbase-runtime', tags=['Fleetbase Runtime'])


def _resolve_uuid(value: str):
    try:
        return uuid.UUID(str(value))
    except (TypeError, ValueError):
        return value

@router.post('/runners', response_model=RunnerResponse)
def create_runner(request: RunnerCreateRequest, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)):
    row = FleetbaseRunnerNode(name=request.name, hostname=request.hostname, ssh_port=request.ssh_port, ssh_user=request.ssh_user, root_runtime_path=request.root_runtime_path, max_tenants=request.max_tenants, supports_reference_install=request.supports_reference_install)
    db.add(row)
    db.commit()
    db.refresh(row)
    return RunnerResponse(id=str(row.id), name=row.name, hostname=row.hostname, ssh_port=row.ssh_port, ssh_user=row.ssh_user, root_runtime_path=row.root_runtime_path, status=row.status.value, max_tenants=row.max_tenants, current_tenants=row.current_tenants, supports_reference_install=row.supports_reference_install)

@router.get('/runners', response_model=list[RunnerResponse])
def list_runners(db: Session=Depends(get_db), current_user: User=Depends(require_superuser)):
    rows = db.query(FleetbaseRunnerNode).order_by(FleetbaseRunnerNode.created_at.asc()).all()
    return [RunnerResponse(id=str(x.id), name=x.name, hostname=x.hostname, ssh_port=x.ssh_port, ssh_user=x.ssh_user, root_runtime_path=x.root_runtime_path, status=x.status.value, max_tenants=x.max_tenants, current_tenants=x.current_tenants, supports_reference_install=x.supports_reference_install) for x in rows]

@router.post('/deploy', response_model=RuntimeResponse)
def deploy_runtime(tenant_id: str, request: RuntimeDeployRequest, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)):
    try:
        tenant = db.get(Tenant, _resolve_uuid(request.tenant_id))
        if not tenant:
            raise ValueError('Tenant not found')
        assert_tenant_launch_ready(db, str(tenant.id))
        runner = pick_runner(db, request.runner_id)
        runtime = create_runtime_request(db, tenant_id=str(tenant.id), tenant_slug=tenant.slug, runner=runner, is_reference_install=request.is_reference_install)
        runtime = run_install(db, runtime, runner)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return RuntimeResponse(id=str(runtime.id), tenant_id=str(runtime.tenant_id), tenant_slug=runtime.tenant_slug, runner_id=str(runtime.runner_id) if runtime.runner_id else None, status=runtime.status.value, install_directory=runtime.install_directory, runtime_url=runtime.runtime_url, console_url=runtime.console_url, api_url=runtime.api_url, fleetbase_version=runtime.fleetbase_version, last_error=runtime.last_error, is_reference_install=runtime.is_reference_install)

@router.get('/runtimes', response_model=list[RuntimeResponse])
def list_runtimes(db: Session=Depends(get_db), current_user: User=Depends(require_superuser)):
    rows = db.query(FleetbaseRuntime).order_by(FleetbaseRuntime.created_at.desc()).all()
    return [RuntimeResponse(id=str(x.id), tenant_id=str(x.tenant_id), tenant_slug=x.tenant_slug, runner_id=str(x.runner_id) if x.runner_id else None, status=x.status.value, install_directory=x.install_directory, runtime_url=x.runtime_url, console_url=x.console_url, api_url=x.api_url, fleetbase_version=x.fleetbase_version, last_error=x.last_error, is_reference_install=x.is_reference_install) for x in rows]

@router.get('/tenant/{tenant_id}', response_model=RuntimeResponse | None)
def get_runtime_by_tenant(tenant_id: str, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)):
    runtime = db.query(FleetbaseRuntime).filter(FleetbaseRuntime.tenant_id == _resolve_uuid(tenant_id)).first()
    if not runtime:
        tenant = db.get(Tenant, _resolve_uuid(tenant_id))
        if tenant:
            runtime = sync_runtime_from_tenant(db, tenant)
    if not runtime:
        return None
    return RuntimeResponse(id=str(runtime.id), tenant_id=str(runtime.tenant_id), tenant_slug=runtime.tenant_slug, runner_id=str(runtime.runner_id) if runtime.runner_id else None, status=runtime.status.value, install_directory=runtime.install_directory, runtime_url=runtime.runtime_url, console_url=runtime.console_url, api_url=runtime.api_url, fleetbase_version=runtime.fleetbase_version, last_error=runtime.last_error, is_reference_install=runtime.is_reference_install)

@router.post('/retry', response_model=RuntimeResponse | None)
def retry_runtime_route(tenant_id: str, request: RuntimeRetryRequest, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)):
    runtime = retry_runtime(db, request.runtime_id)
    if not runtime:
        return None
    return RuntimeResponse(id=str(runtime.id), tenant_id=str(runtime.tenant_id), tenant_slug=runtime.tenant_slug, runner_id=str(runtime.runner_id) if runtime.runner_id else None, status=runtime.status.value, install_directory=runtime.install_directory, runtime_url=runtime.runtime_url, console_url=runtime.console_url, api_url=runtime.api_url, fleetbase_version=runtime.fleetbase_version, last_error=runtime.last_error, is_reference_install=runtime.is_reference_install)

@router.post('/suspend', response_model=RuntimeResponse | None)
def suspend_runtime_route(tenant_id: str, request: RuntimeSuspendRequest, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)):
    runtime = suspend_runtime(db, request.runtime_id, request.reason)
    if not runtime:
        return None
    return RuntimeResponse(id=str(runtime.id), tenant_id=str(runtime.tenant_id), tenant_slug=runtime.tenant_slug, runner_id=str(runtime.runner_id) if runtime.runner_id else None, status=runtime.status.value, install_directory=runtime.install_directory, runtime_url=runtime.runtime_url, console_url=runtime.console_url, api_url=runtime.api_url, fleetbase_version=runtime.fleetbase_version, last_error=runtime.last_error, is_reference_install=runtime.is_reference_install)

@router.get('/{runtime_id}/events', response_model=list[RuntimeEventResponse])
def get_runtime_events(tenant_id: str, runtime_id: str, db: Session=Depends(get_db), current_user: User=Depends(require_superuser)):
    rows = db.query(FleetbaseRuntimeEvent).filter(FleetbaseRuntimeEvent.runtime_id == runtime_id).order_by(FleetbaseRuntimeEvent.created_at.asc()).all()
    return [RuntimeEventResponse(id=str(x.id), runtime_id=str(x.runtime_id), event_type=x.event_type, message=x.message, payload_json=x.payload_json) for x in rows]
