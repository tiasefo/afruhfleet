# Afruheritage Control Plane

Production-grade FastAPI control plane for **Afruheritage powered by Infotech Freight Forwarding**.

This service onboards freight-forwarder tenants, approves them, assigns a dedicated runner node, and launches a hidden Fleetbase runtime underneath each tenant using the official Fleetbase CLI on the assigned runner.

## What this repository contains

- FastAPI admin API for tenant onboarding and lifecycle control
- PostgreSQL-backed state for tenants, runner nodes, jobs, and audit events
- Celery worker for durable provisioning jobs
- SSH-based provisioning service that executes `flb install-fleetbase` on dedicated runner nodes
- Deployment instructions, prerequisites, and runner bootstrap scripts
- `AGENT.md` at repository root with non-negotiable implementation rules

## Architectural stance

- **Afruheritage is the visible product**
- **Fleetbase is the hidden logistics runtime**
- **Each paying tenant gets an isolated Fleetbase deployment boundary**
- **No mock data, no simulated provisioning, no demo-only production paths**

## Quick start

1. Copy `.env.example` to `.env` and replace all placeholder values.
2. Place the SSH private key used for runner access at the path configured by `RUNNER_DEFAULT_SSH_KEY_PATH`.
3. Start the control plane: `docker compose up --build -d`.
4. Bootstrap the first superuser: `make bootstrap-admin`.
5. Register at least one runner node through the API.
6. Create a tenant, approve it, and launch it.

See `docs/DEPLOYMENT.md` for the full production setup.
