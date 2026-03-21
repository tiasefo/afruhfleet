from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.fleetbase_runtime import FleetbaseRuntime, FleetbaseRuntimeEvent, FleetbaseRunnerNode, RuntimeStatus
from app.services.runner_executor import RunnerExecutor


def pick_runner(db: Session, requested_runner_id: str | None = None) -> FleetbaseRunnerNode:
    if requested_runner_id:
        runner = db.query(FleetbaseRunnerNode).filter(FleetbaseRunnerNode.id == requested_runner_id).first()
        if not runner:
            raise ValueError("Runner not found")
        return runner

    runner = (
        db.query(FleetbaseRunnerNode)
        .filter(FleetbaseRunnerNode.status == "active")
        .order_by(FleetbaseRunnerNode.current_tenants.asc(), FleetbaseRunnerNode.created_at.asc())
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
    runner: FleetbaseRunnerNode,
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


def run_install(db: Session, runtime: FleetbaseRuntime, runner: FleetbaseRunnerNode) -> FleetbaseRuntime:
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
        f"cd {runtime.install_directory} && "
        "command -v node >/dev/null 2>&1 && "
        "command -v npm >/dev/null 2>&1 && "
        "command -v docker >/dev/null 2>&1 && "
        "npm install -g @fleetbase/cli && "
        f"flb install-fleetbase --directory {runtime.install_directory} --environment production "
        f">> {runtime.install_log_path} 2>&1"
    )

    rc, out, err = executor.run_remote(
        host=runner.hostname,
        port=runner.ssh_port,
        user=runner.ssh_user,
        command=install_cmd,
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
