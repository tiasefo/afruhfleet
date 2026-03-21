---
doc_id: shared-deployment-architecture-001
scope: shared
product: afruheritage
title: Deployment Architecture
version: 1.0
last_reviewed: 2026-03-18
owner: Platform Engineering
tags:
  - architecture
  - deployment
  - runner
  - fleetbase
---

# Deployment Architecture

## Purpose
Describes how Afruheritage provisions and operates tenant runtimes.

## Core Design
Afruheritage uses an instance-per-tenant deployment model.
Each approved tenant receives a dedicated Fleetbase-backed runtime on Afruheritage-managed infrastructure.

## Main Components

### 1. Control Plane
The FastAPI application manages:
- tenant onboarding
- approvals
- deployment requests
- deployment status tracking
- operational visibility
- audit logs

### 2. Provisioning Worker
Background workers execute deployment jobs asynchronously.
They must not perform fake or simulated deployment updates.

### 3. Runner Nodes
Runner nodes host actual tenant deployments and must be prepared with:
- Linux
- Docker
- Docker Compose
- Node.js
- npm
- Fleetbase CLI

### 4. Reverse Proxy Layer
The edge layer routes traffic from tenant subdomains to the correct runtime and terminates SSL.

### 5. Tenant Runtime
Each tenant runtime includes:
- Fleetbase application stack
- tenant-specific configuration
- isolated secrets
- isolated runtime URL
- deployment metadata

## Workspace Layout
Recommended runner path layout:

/srv/afruheritage/tenants/<tenant-slug>/
- deployment/
- config/
- secrets/
- logs/
- data/

## Provisioning Sequence
1. validate tenant approval
2. reserve tenant slug and subdomain
3. assign runner
4. prepare workspace
5. execute Fleetbase installation
6. apply Afruheritage-specific config
7. configure reverse proxy
8. run health checks
9. create bootstrap admin
10. mark runtime healthy on verified success

## Hard Rules
- provisioning must be asynchronous
- status must reflect real execution state
- no success without health verification
- all failures must be logged with actionable reason
- no unsanitized shell input may be used\n