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
