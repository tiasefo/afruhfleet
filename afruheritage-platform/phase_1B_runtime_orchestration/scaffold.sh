cat > afruheritage_saas_engine_scaffold/phase_1B_runtime_orchestration/scaffold.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(pwd)"
APP_DIR="$ROOT_DIR/app"
BACKUP_DIR="$ROOT_DIR/.scaffold_backups/phase_1B_runtime_provisioner_$(date +%Y%m%d_%H%M%S)"

mkdir -p "$BACKUP_DIR" "$APP_DIR/models" "$APP_DIR/schemas" "$APP_DIR/services" "$APP_DIR/api/routes" "$ROOT_DIR/docs"

cp -a "$APP_DIR/main.py" "$BACKUP_DIR/main.py.bak"

cat > "$APP_DIR/models/saas_runtime.py" <<'PY'
from __future__ import annotations
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import DateTime, Enum, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

def enum_values(enum_cls):
    return [e.value for e in enum_cls]

class SaasRuntimeStatus(str, PyEnum):
    REQUESTED = "requested"
    CHECKING_RUNNER = "checking_runner"
    PROVISIONING = "provisioning"
    INSTALLING_FLEETBASE = "installing_fleetbase"
    ACTIVE = "active"
    FAILED = "failed"
    SUSPENDED = "suspended"

class SaasTenantRuntime(Base):
    __tablename__ = "saas_tenant_runtimes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    tenant_slug: Mapped[str] = mapped_column(String(150), nullable=False, unique=True, index=True)
    runner_host: Mapped[str] = mapped_column(String(255), nullable=False)
    runner_user: Mapped[str] = mapped_column(String(120), nullable=False)
    runner_port: Mapped[str] = mapped_column(String(20), nullable=False, default="22")
    runtime_root: Mapped[str] = mapped_column(String(500), nullable=False)
    workspace_path: Mapped[str] = mapped_column(String(500), nullable=False)
    fleetbase_path: Mapped[str] = mapped_column(String(500), nullable=False)
    runtime_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[SaasRuntimeStatus] = mapped_column(Enum(SaasRuntimeStatus, values_callable=enum_values), nullable=False, default=SaasRuntimeStatus.REQUESTED)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    install_log_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class SaasRuntimeEvent(Base):
    __tablename__ = "saas_runtime_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    runtime_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(120), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
PY

cat > "$APP_DIR/schemas/saas_runtime.py" <<'PY'
from pydantic import BaseModel

class ProvisionRuntimeRequest(BaseModel):
    tenant_id: str
    tenant_slug: str
    runner_host: str = "127.0.0.1"
    runner_user: str = "afruheritage"
    runner_port: int = 22
    runtime_root: str = "/srv/afruheritage/tenants"
    domain_base: str = "afruheritage.com"

class RuntimeResponse(BaseModel):
    id: str
    tenant_id: str
    tenant_slug: str
    runner_host: str
    workspace_path: str
    fleetbase_path: str
    runtime_url: str | None
    status: str
    last_error: str | None = None
PY

cat > "$APP_DIR/services/saas_runtime_provisioner.py" <<'PY'
from __future__ import annotations
import os, shlex, subprocess
from sqlalchemy.orm import Session
from app.models.saas_runtime import SaasTenantRuntime, SaasRuntimeEvent, SaasRuntimeStatus

SSH_KEY = os.getenv("RUNTIME_SSH_KEY_PATH", "/run/secrets/afruheritage_runner_key")

def run_ssh(host: str, user: str, port: int, command: str) -> tuple[int, str, str]:
    cmd = [
        "ssh", "-o", "StrictHostKeyChecking=no",
        "-i", SSH_KEY,
        "-p", str(port),
        f"{user}@{host}",
        command,
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    return proc.returncode, proc.stdout, proc.stderr

def log_event(db: Session, runtime_id, event_type: str, message: str):
    db.add(SaasRuntimeEvent(runtime_id=runtime_id, event_type=event_type, message=message))
    db.commit()

def provision_runtime(
    db: Session,
    *,
    tenant_id: str,
    tenant_slug: str,
    runner_host: str,
    runner_user: str,
    runner_port: int,
    runtime_root: str,
    domain_base: str,
) -> SaasTenantRuntime:
    existing = db.query(SaasTenantRuntime).filter(SaasTenantRuntime.tenant_slug == tenant_slug).first()
    if existing:
        return existing

    workspace = f"{runtime_root.rstrip('/')}/{tenant_slug}"
    fleetbase_path = f"{workspace}/fleetbase"
    install_log = f"{workspace}/install.log"
    runtime_url = f"https://{tenant_slug}.{domain_base}"

    runtime = SaasTenantRuntime(
        tenant_id=tenant_id,
        tenant_slug=tenant_slug,
        runner_host=runner_host,
        runner_user=runner_user,
        runner_port=str(runner_port),
        runtime_root=runtime_root,
        workspace_path=workspace,
        fleetbase_path=fleetbase_path,
        runtime_url=runtime_url,
        status=SaasRuntimeStatus.REQUESTED,
        install_log_path=install_log,
    )
    db.add(runtime)
    db.commit()
    db.refresh(runtime)
    log_event(db, runtime.id, "runtime_requested", "Runtime provisioning requested")

    runtime.status = SaasRuntimeStatus.CHECKING_RUNNER
    db.add(runtime); db.commit()
    log_event(db, runtime.id, "checking_runner", "Checking runner prerequisites")

    prereq = "command -v docker && command -v node && command -v npm && command -v flb"
    rc, out, err = run_ssh(runner_host, runner_user, runner_port, prereq)
    if rc != 0:
        runtime.status = SaasRuntimeStatus.FAILED
        runtime.last_error = f"Runner prerequisite check failed: {err or out}"
        db.add(runtime); db.commit(); db.refresh(runtime)
        log_event(db, runtime.id, "runner_check_failed", runtime.last_error)
        return runtime

    runtime.status = SaasRuntimeStatus.PROVISIONING
    db.add(runtime); db.commit()
    log_event(db, runtime.id, "creating_workspace", workspace)

    setup_cmd = (
        f"mkdir -p {shlex.quote(workspace)} {shlex.quote(fleetbase_path)} && "
        f"echo TENANT_ID={shlex.quote(tenant_id)} > {shlex.quote(workspace)}/tenant.env && "
        f"echo TENANT_SLUG={shlex.quote(tenant_slug)} >> {shlex.quote(workspace)}/tenant.env && "
        f"echo RUNTIME_URL={shlex.quote(runtime_url)} >> {shlex.quote(workspace)}/tenant.env"
    )
    rc, out, err = run_ssh(runner_host, runner_user, runner_port, setup_cmd)
    if rc != 0:
        runtime.status = SaasRuntimeStatus.FAILED
        runtime.last_error = f"Workspace setup failed: {err or out}"
        db.add(runtime); db.commit(); db.refresh(runtime)
        log_event(db, runtime.id, "workspace_failed", runtime.last_error)
        return runtime

    runtime.status = SaasRuntimeStatus.INSTALLING_FLEETBASE
    db.add(runtime); db.commit()
    log_event(db, runtime.id, "fleetbase_install_started", "Running Fleetbase CLI install")

    install_cmd = (
        f"cd {shlex.quote(workspace)} && "
        f"flb install-fleetbase --directory {shlex.quote(fleetbase_path)} "
        f"--environment production >> {shlex.quote(install_log)} 2>&1"
    )
    rc, out, err = run_ssh(runner_host, runner_user, runner_port, install_cmd)
    if rc != 0:
        runtime.status = SaasRuntimeStatus.FAILED
        runtime.last_error = f"Fleetbase install failed. Check {install_log}. Error: {err or out}"
        db.add(runtime); db.commit(); db.refresh(runtime)
        log_event(db, runtime.id, "fleetbase_install_failed", runtime.last_error)
        return runtime

    runtime.status = SaasRuntimeStatus.ACTIVE
    runtime.last_error = None
    db.add(runtime); db.commit(); db.refresh(runtime)
    log_event(db, runtime.id, "runtime_active", "Fleetbase runtime provisioned and marked active")
    return runtime
PY

cat > "$APP_DIR/api/routes/saas_runtime.py" <<'PY'
from fastapi import APIRouter
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.saas_runtime import SaasTenantRuntime
from app.schemas.saas_runtime import ProvisionRuntimeRequest, RuntimeResponse
from app.services.saas_runtime_provisioner import provision_runtime

router = APIRouter(prefix="/saas-runtime", tags=["SaaS Runtime Provisioner"])

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def to_response(x: SaasTenantRuntime) -> RuntimeResponse:
    return RuntimeResponse(
        id=str(x.id),
        tenant_id=x.tenant_id,
        tenant_slug=x.tenant_slug,
        runner_host=x.runner_host,
        workspace_path=x.workspace_path,
        fleetbase_path=x.fleetbase_path,
        runtime_url=x.runtime_url,
        status=x.status.value,
        last_error=x.last_error,
    )

@router.post("/provision", response_model=RuntimeResponse)
def provision(request: ProvisionRuntimeRequest):
    db = SessionLocal()
    try:
        runtime = provision_runtime(db, **request.model_dump())
        return to_response(runtime)
    finally:
        db.close()

@router.get("/{tenant_slug}", response_model=RuntimeResponse | None)
def get_runtime(tenant_slug: str):
    db = SessionLocal()
    try:
        runtime = db.query(SaasTenantRuntime).filter(SaasTenantRuntime.tenant_slug == tenant_slug).first()
        return to_response(runtime) if runtime else None
    finally:
        db.close()
PY

python3 - <<'PY'
from pathlib import Path
p = Path("app/main.py")
text = p.read_text()
imp = "from app.api.routes.saas_runtime import router as saas_runtime_router"
route = 'app.include_router(saas_runtime_router, prefix="/api/v1")'
if imp not in text:
    text = imp + "\n" + text
if route not in text:
    text += "\n" + route + "\n"
p.write_text(text)
print("main.py patched")
PY

cat > "$ROOT_DIR/docs/PHASE_1B_REAL_RUNTIME_PROVISIONER.md" <<'MD'
# Phase 1B Real Runtime Provisioner

This creates a real runtime provisioning endpoint.

It does not claim success unless:
- SSH works
- runner has docker/node/npm/flb
- workspace is created
- Fleetbase CLI install command completes

Endpoint:
- `POST /api/v1/saas-runtime/provision`
- `GET /api/v1/saas-runtime/{tenant_slug}`

This is the first real bridge from tenant contract to isolated runtime.
MD

echo "Phase 1B real runtime provisioner scaffold complete."
echo "Rebuild:"
echo "  sudo docker compose down && sudo docker compose up -d --build"
echo "Test:"
echo "  curl -X POST http://localhost:8000/api/v1/saas-runtime/provision -H 'Content-Type: application/json' -d '{\"tenant_id\":\"test-001\",\"tenant_slug\":\"test-logistics\",\"runner_host\":\"127.0.0.1\",\"runner_user\":\"afruheritage\",\"runner_port\":22}'"
SH

chmod +x afruheritage_saas_engine_scaffold/phase_1B_runtime_orchestration/scaffold.sh
