#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(pwd)"
APP_DIR="$ROOT_DIR/app"
BACKUP_DIR="$ROOT_DIR/.scaffold_backups/05_fleetbase_runtime_deployer_$(date +%Y%m%d_%H%M%S)"

require_file() {
  local path="$1"
  if [[ ! -e "$path" ]]; then
    echo "ERROR: Expected path not found: $path"
    exit 1
  fi
}

backup_if_exists() {
  local path="$1"
  if [[ -e "$path" ]]; then
    mkdir -p "$BACKUP_DIR/$(dirname "${path#$ROOT_DIR/}")"
    cp -a "$path" "$BACKUP_DIR/${path#$ROOT_DIR/}"
  fi
}

echo "==> Validating repo root"
require_file "$ROOT_DIR/requirements.txt"
require_file "$ROOT_DIR/docker-compose.yml"
require_file "$APP_DIR"
require_file "$APP_DIR/main.py"

mkdir -p "$BACKUP_DIR"
mkdir -p \
  "$APP_DIR/models" \
  "$APP_DIR/schemas" \
  "$APP_DIR/api/routes" \
  "$APP_DIR/services" \
  "$ROOT_DIR/docs" \
  "$ROOT_DIR/infra/runner" \
  "$ROOT_DIR/scripts/runtime"

echo "==> Backing up files that may change"
backup_if_exists "$APP_DIR/main.py"
backup_if_exists "$ROOT_DIR/requirements.txt"

echo "==> Writing Fleetbase runtime models"
cat > "$APP_DIR/models/fleetbase_runtime.py" <<'PY'
from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


def enum_values(enum_cls):
    return [e.value for e in enum_cls]


class RuntimeStatus(str, PyEnum):
    REQUESTED = "requested"
    QUEUED = "queued"
    PREPARING_RUNNER = "preparing_runner"
    INSTALLING = "installing"
    CONFIGURING = "configuring"
    HEALTH_CHECKING = "health_checking"
    ACTIVE = "active"
    FAILED = "failed"
    SUSPENDED = "suspended"
    DECOMMISSIONED = "decommissioned"


class RunnerStatus(str, PyEnum):
    ACTIVE = "active"
    DRAINING = "draining"
    DISABLED = "disabled"


class FleetbaseRuntime(Base):
    __tablename__ = "fleetbase_runtimes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, unique=True, index=True)
    tenant_slug: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    runner_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)

    status: Mapped[RuntimeStatus] = mapped_column(
        Enum(RuntimeStatus, values_callable=enum_values),
        nullable=False,
        default=RuntimeStatus.REQUESTED,
    )
    install_directory: Mapped[str] = mapped_column(String(500), nullable=False)
    runtime_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    console_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    api_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    fleetbase_version: Mapped[str | None] = mapped_column(String(120), nullable=True)
    install_log_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_reference_install: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class RunnerNode(Base):
    __tablename__ = "runner_nodes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    hostname: Mapped[str] = mapped_column(String(255), nullable=False)
    ssh_port: Mapped[int] = mapped_column(Integer, nullable=False, default=22)
    ssh_user: Mapped[str] = mapped_column(String(120), nullable=False, default="afruheritage")
    root_runtime_path: Mapped[str] = mapped_column(String(500), nullable=False, default="/srv/afruheritage/tenants")
    status: Mapped[RunnerStatus] = mapped_column(
        Enum(RunnerStatus, values_callable=enum_values),
        nullable=False,
        default=RunnerStatus.ACTIVE,
    )
    max_tenants: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    current_tenants: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    supports_reference_install: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class FleetbaseRuntimeEvent(Base):
    __tablename__ = "fleetbase_runtime_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    runtime_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(120), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    payload_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
PY

echo "==> Writing Fleetbase runtime schemas"
cat > "$APP_DIR/schemas/fleetbase_runtime.py" <<'PY'
from __future__ import annotations

from pydantic import BaseModel, Field


class RunnerCreateRequest(BaseModel):
    name: str
    hostname: str
    ssh_port: int = 22
    ssh_user: str = "afruheritage"
    root_runtime_path: str = "/srv/afruheritage/tenants"
    max_tenants: int = 50
    supports_reference_install: bool = True


class RuntimeDeployRequest(BaseModel):
    tenant_id: str
    tenant_slug: str = Field(..., min_length=2, max_length=120)
    runner_id: str | None = None
    is_reference_install: bool = False


class RuntimeRetryRequest(BaseModel):
    runtime_id: str


class RuntimeSuspendRequest(BaseModel):
    runtime_id: str
    reason: str | None = None


class RuntimeResponse(BaseModel):
    id: str
    tenant_id: str
    tenant_slug: str
    runner_id: str | None = None
    status: str
    install_directory: str
    runtime_url: str | None = None
    console_url: str | None = None
    api_url: str | None = None
    fleetbase_version: str | None = None
    last_error: str | None = None
    is_reference_install: bool


class RuntimeEventResponse(BaseModel):
    id: str
    runtime_id: str
    event_type: str
    message: str
    payload_json: str | None = None


class RunnerResponse(BaseModel):
    id: str
    name: str
    hostname: str
    ssh_port: int
    ssh_user: str
    root_runtime_path: str
    status: str
    max_tenants: int
    current_tenants: int
    supports_reference_install: bool
PY

echo "==> Writing runner executor"
cat > "$APP_DIR/services/runner_executor.py" <<'PY'
from __future__ import annotations

import os
import shlex
import subprocess
from pathlib import Path


class RunnerExecutor:
    def __init__(self, ssh_key_path: str | None = None) -> None:
        self.ssh_key_path = ssh_key_path or os.getenv(
            "RUNNER_DEFAULT_SSH_KEY_PATH",
            "/run/secrets/afruheritage_runner_key",
        )

    def _ssh_base(self, *, host: str, port: int, user: str) -> list[str]:
        cmd = [
            "ssh",
            "-o", "StrictHostKeyChecking=no",
            "-i", self.ssh_key_path,
            "-p", str(port),
            f"{user}@{host}",
        ]
        return cmd

    def run_remote(self, *, host: str, port: int, user: str, command: str) -> tuple[int, str, str]:
        full_cmd = self._ssh_base(host=host, port=port, user=user) + [command]
        proc = subprocess.run(full_cmd, capture_output=True, text=True)
        return proc.returncode, proc.stdout, proc.stderr

    def run_local(self, command: str, cwd: str | None = None) -> tuple[int, str, str]:
        proc = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
        )
        return proc.returncode, proc.stdout, proc.stderr

    def ensure_remote_dir(self, *, host: str, port: int, user: str, path: str) -> tuple[int, str, str]:
        cmd = f"mkdir -p {shlex.quote(path)}"
        return self.run_remote(host=host, port=port, user=user, command=cmd)
PY

echo "==> Writing Fleetbase runtime service"
cat > "$APP_DIR/services/fleetbase_runtime_service.py" <<'PY'
from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.fleetbase_runtime import FleetbaseRuntime, FleetbaseRuntimeEvent, RunnerNode, RuntimeStatus
from app.services.runner_executor import RunnerExecutor


def pick_runner(db: Session, requested_runner_id: str | None = None) -> RunnerNode:
    if requested_runner_id:
        runner = db.query(RunnerNode).filter(RunnerNode.id == requested_runner_id).first()
        if not runner:
            raise ValueError("Runner not found")
        return runner

    runner = (
        db.query(RunnerNode)
        .filter(RunnerNode.status == "active")
        .order_by(RunnerNode.current_tenants.asc(), RunnerNode.created_at.asc())
        .first()
    )
    if not runner:
        raise ValueError("No active runner available")
    return runner


def create_runtime_request(
    db: Session,
    *,
    tenant_id: str,
    tenant_slug: str,
    runner: RunnerNode,
    is_reference_install: bool = False,
) -> FleetbaseRuntime:
    install_dir = f"{runner.root_runtime_path}/{tenant_slug}/fleetbase"
    runtime = db.query(FleetbaseRuntime).filter(FleetbaseRuntime.tenant_id == tenant_id).first()
    if runtime:
        return runtime

    runtime = FleetbaseRuntime(
        tenant_id=tenant_id,
        tenant_slug=tenant_slug,
        runner_id=runner.id,
        status=RuntimeStatus.QUEUED,
        install_directory=install_dir,
        runtime_url=f"https://{tenant_slug}.afruheritage.com",
        console_url=f"https://{tenant_slug}.afruheritage.com/console",
        api_url=f"https://{tenant_slug}.afruheritage.com/api",
        is_reference_install=is_reference_install,
        install_log_path=f"{install_dir}/logs/install.log",
    )
    db.add(runtime)
    db.commit()
    db.refresh(runtime)
    log_event(db, runtime.id, "runtime_requested", f"Runtime queued on runner {runner.name}")
    return runtime


def run_install(db: Session, runtime: FleetbaseRuntime, runner: RunnerNode) -> FleetbaseRuntime:
    executor = RunnerExecutor()

    runtime.status = RuntimeStatus.PREPARING_RUNNER
    db.add(runtime)
    db.commit()
    db.refresh(runtime)
    log_event(db, runtime.id, "runner_preparing", f"Preparing runner {runner.name}")

    rc, out, err = executor.ensure_remote_dir(
        host=runner.hostname,
        port=runner.ssh_port,
        user=runner.ssh_user,
        path=runtime.install_directory,
    )
    if rc != 0:
        runtime.status = RuntimeStatus.FAILED
        runtime.last_error = err or out or "Failed to create install directory"
        db.add(runtime)
        db.commit()
        db.refresh(runtime)
        log_event(db, runtime.id, "prepare_failed", runtime.last_error)
        return runtime

    runtime.status = RuntimeStatus.INSTALLING
    db.add(runtime)
    db.commit()
    db.refresh(runtime)
    log_event(db, runtime.id, "install_started", "Fleetbase installation started")

    install_cmd = (
        f"({build_fleetbase_install_script(install_path=runtime.install_directory, host=settings.fleetbase_default_install_host, environment='production')}) "
        f">> {runtime.install_log_path} 2>&1"
    )

    rc, out, err = executor.run_remote(
        host=runner.hostname,
        port=runner.ssh_port,
        user=runner.ssh_user,
        command=install_cmd,
        timeout=settings.provisioning_timeout_seconds,
    )

    if rc != 0:
        runtime.status = RuntimeStatus.FAILED
        runtime.last_error = err or out or "Fleetbase installation failed"
        db.add(runtime)
        db.commit()
        db.refresh(runtime)
        log_event(db, runtime.id, "install_failed", runtime.last_error, {"stdout": out, "stderr": err})
        return runtime

    runtime.status = RuntimeStatus.CONFIGURING
    db.add(runtime)
    db.commit()
    db.refresh(runtime)
    log_event(db, runtime.id, "install_complete", "Fleetbase installation completed")

    # Placeholder: runtime health is set active after the install command succeeds.
    runtime.status = RuntimeStatus.ACTIVE
    db.add(runtime)
    runner.current_tenants += 1
    db.add(runner)
    db.commit()
    db.refresh(runtime)
    log_event(db, runtime.id, "runtime_active", "Fleetbase runtime marked active")
    return runtime


def suspend_runtime(db: Session, runtime_id: str, reason: str | None = None) -> FleetbaseRuntime | None:
    runtime = db.query(FleetbaseRuntime).filter(FleetbaseRuntime.id == runtime_id).first()
    if not runtime:
        return None
    runtime.status = RuntimeStatus.SUSPENDED
    runtime.last_error = reason
    db.add(runtime)
    db.commit()
    db.refresh(runtime)
    log_event(db, runtime.id, "runtime_suspended", reason or "Runtime suspended")
    return runtime


def retry_runtime(db: Session, runtime_id: str) -> FleetbaseRuntime | None:
    runtime = db.query(FleetbaseRuntime).filter(FleetbaseRuntime.id == runtime_id).first()
    if not runtime:
        return None
    runtime.status = RuntimeStatus.QUEUED
    runtime.last_error = None
    db.add(runtime)
    db.commit()
    db.refresh(runtime)
    log_event(db, runtime.id, "runtime_retry_queued", "Runtime re-queued for install")
    return runtime


def log_event(db: Session, runtime_id, event_type: str, message: str, payload: dict | None = None) -> None:
    row = FleetbaseRuntimeEvent(
        runtime_id=runtime_id,
        event_type=event_type,
        message=message,
        payload_json=json.dumps(payload) if payload else None,
    )
    db.add(row)
    db.commit()
PY

echo "==> Writing Fleetbase runtime routes"
cat > "$APP_DIR/api/routes/fleetbase_runtime.py" <<'PY'
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.models.fleetbase_runtime import FleetbaseRuntime, FleetbaseRuntimeEvent, RunnerNode
from app.schemas.fleetbase_runtime import (
    RunnerCreateRequest,
    RunnerResponse,
    RuntimeDeployRequest,
    RuntimeEventResponse,
    RuntimeResponse,
    RuntimeRetryRequest,
    RuntimeSuspendRequest,
)
from app.services.fleetbase_runtime_service import (
    create_runtime_request,
    pick_runner,
    retry_runtime,
    run_install,
    suspend_runtime,
)

router = APIRouter(prefix="/fleetbase-runtime", tags=["Fleetbase Runtime"])

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def _db() -> Session:
    return SessionLocal()


@router.post("/runners", response_model=RunnerResponse)
def create_runner(request: RunnerCreateRequest):
    db = _db()
    try:
        row = RunnerNode(
            name=request.name,
            hostname=request.hostname,
            ssh_port=request.ssh_port,
            ssh_user=request.ssh_user,
            root_runtime_path=request.root_runtime_path,
            max_tenants=request.max_tenants,
            supports_reference_install=request.supports_reference_install,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return RunnerResponse(
            id=str(row.id),
            name=row.name,
            hostname=row.hostname,
            ssh_port=row.ssh_port,
            ssh_user=row.ssh_user,
            root_runtime_path=row.root_runtime_path,
            status=row.status.value,
            max_tenants=row.max_tenants,
            current_tenants=row.current_tenants,
            supports_reference_install=row.supports_reference_install,
        )
    finally:
        db.close()


@router.get("/runners", response_model=list[RunnerResponse])
def list_runners():
    db = _db()
    try:
        rows = db.query(RunnerNode).order_by(RunnerNode.created_at.asc()).all()
        return [
            RunnerResponse(
                id=str(x.id),
                name=x.name,
                hostname=x.hostname,
                ssh_port=x.ssh_port,
                ssh_user=x.ssh_user,
                root_runtime_path=x.root_runtime_path,
                status=x.status.value,
                max_tenants=x.max_tenants,
                current_tenants=x.current_tenants,
                supports_reference_install=x.supports_reference_install,
            )
            for x in rows
        ]
    finally:
        db.close()


@router.post("/deploy", response_model=RuntimeResponse)
def deploy_runtime(request: RuntimeDeployRequest):
    db = _db()
    try:
        runner = pick_runner(db, request.runner_id)
        runtime = create_runtime_request(
            db,
            tenant_id=request.tenant_id,
            tenant_slug=request.tenant_slug,
            runner=runner,
            is_reference_install=request.is_reference_install,
        )
        runtime = run_install(db, runtime, runner)
        return RuntimeResponse(
            id=str(runtime.id),
            tenant_id=str(runtime.tenant_id),
            tenant_slug=runtime.tenant_slug,
            runner_id=str(runtime.runner_id) if runtime.runner_id else None,
            status=runtime.status.value,
            install_directory=runtime.install_directory,
            runtime_url=runtime.runtime_url,
            console_url=runtime.console_url,
            api_url=runtime.api_url,
            fleetbase_version=runtime.fleetbase_version,
            last_error=runtime.last_error,
            is_reference_install=runtime.is_reference_install,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        db.close()


@router.get("/tenant/{tenant_id}", response_model=RuntimeResponse | None)
def get_runtime_by_tenant(tenant_id: str):
    db = _db()
    try:
        runtime = db.query(FleetbaseRuntime).filter(FleetbaseRuntime.tenant_id == tenant_id).first()
        if not runtime:
            return None
        return RuntimeResponse(
            id=str(runtime.id),
            tenant_id=str(runtime.tenant_id),
            tenant_slug=runtime.tenant_slug,
            runner_id=str(runtime.runner_id) if runtime.runner_id else None,
            status=runtime.status.value,
            install_directory=runtime.install_directory,
            runtime_url=runtime.runtime_url,
            console_url=runtime.console_url,
            api_url=runtime.api_url,
            fleetbase_version=runtime.fleetbase_version,
            last_error=runtime.last_error,
            is_reference_install=runtime.is_reference_install,
        )
    finally:
        db.close()


@router.post("/retry", response_model=RuntimeResponse | None)
def retry_runtime_route(request: RuntimeRetryRequest):
    db = _db()
    try:
        runtime = retry_runtime(db, request.runtime_id)
        if not runtime:
            return None
        return RuntimeResponse(
            id=str(runtime.id),
            tenant_id=str(runtime.tenant_id),
            tenant_slug=runtime.tenant_slug,
            runner_id=str(runtime.runner_id) if runtime.runner_id else None,
            status=runtime.status.value,
            install_directory=runtime.install_directory,
            runtime_url=runtime.runtime_url,
            console_url=runtime.console_url,
            api_url=runtime.api_url,
            fleetbase_version=runtime.fleetbase_version,
            last_error=runtime.last_error,
            is_reference_install=runtime.is_reference_install,
        )
    finally:
        db.close()


@router.post("/suspend", response_model=RuntimeResponse | None)
def suspend_runtime_route(request: RuntimeSuspendRequest):
    db = _db()
    try:
        runtime = suspend_runtime(db, request.runtime_id, request.reason)
        if not runtime:
            return None
        return RuntimeResponse(
            id=str(runtime.id),
            tenant_id=str(runtime.tenant_id),
            tenant_slug=runtime.tenant_slug,
            runner_id=str(runtime.runner_id) if runtime.runner_id else None,
            status=runtime.status.value,
            install_directory=runtime.install_directory,
            runtime_url=runtime.runtime_url,
            console_url=runtime.console_url,
            api_url=runtime.api_url,
            fleetbase_version=runtime.fleetbase_version,
            last_error=runtime.last_error,
            is_reference_install=runtime.is_reference_install,
        )
    finally:
        db.close()


@router.get("/{runtime_id}/events", response_model=list[RuntimeEventResponse])
def get_runtime_events(runtime_id: str):
    db = _db()
    try:
        rows = (
            db.query(FleetbaseRuntimeEvent)
            .filter(FleetbaseRuntimeEvent.runtime_id == runtime_id)
            .order_by(FleetbaseRuntimeEvent.created_at.asc())
            .all()
        )
        return [
            RuntimeEventResponse(
                id=str(x.id),
                runtime_id=str(x.runtime_id),
                event_type=x.event_type,
                message=x.message,
                payload_json=x.payload_json,
            )
            for x in rows
        ]
    finally:
        db.close()
PY

echo "==> Writing runner prereq script"
cat > "$ROOT_DIR/infra/runner/bootstrap_runner.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail

echo "Installing runner prerequisites..."
sudo apt update
sudo apt install -y curl ca-certificates gnupg lsb-release openssh-server jq

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER" || true
fi

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi

sudo mkdir -p /srv/afruheritage/tenants
sudo chown -R "$USER":"$USER" /srv/afruheritage

if ! command -v flb >/dev/null 2>&1; then
  sudo npm install -g @fleetbase/cli
fi

echo "Runner bootstrap complete."
echo "Verify:"
echo "  docker --version"
echo "  node --version"
echo "  npm --version"
echo "  flb --version"
SH
chmod +x "$ROOT_DIR/infra/runner/bootstrap_runner.sh"

echo "==> Writing runtime docs"
cat > "$ROOT_DIR/docs/FLEETBASE_RUNTIME_DEPLOYER.md" <<'MD'
# Fleetbase Runtime Deployer Guide

## Purpose
This module scaffolds the Afruheritage control-plane integration for provisioning one Fleetbase runtime per tenant on runner nodes.

## What this module adds
- runner node registry
- runtime deployment model
- runtime event logs
- runner executor using SSH
- Fleetbase CLI install wrapper
- deploy/retry/suspend/status APIs
- runner bootstrap script

## Important architecture rule
Fleetbase is not deployed inside the Afruheritage control-plane compose stack.
Each tenant gets a separate Fleetbase runtime installed on a runner node.

## API routes
- `POST /api/v1/fleetbase-runtime/runners`
- `GET /api/v1/fleetbase-runtime/runners`
- `POST /api/v1/fleetbase-runtime/deploy`
- `GET /api/v1/fleetbase-runtime/tenant/{tenant_id}`
- `POST /api/v1/fleetbase-runtime/retry`
- `POST /api/v1/fleetbase-runtime/suspend`
- `GET /api/v1/fleetbase-runtime/{runtime_id}/events`

## Runner prerequisites
Run:

```bash
bash infra/runner/bootstrap_runner.sh
