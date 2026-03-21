from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
shared = ROOT / "knowledge" / "shared"
shared.mkdir(parents=True, exist_ok=True)

files = {
    "product_overview.md": """---
doc_id: shared-product-overview-001
scope: shared
product: afruheritage
title: Afruheritage Product Overview
version: 1.0
last_reviewed: 2026-03-18
owner: Product Office
tags:
  - overview
  - afruheritage
  - fleetbase
  - platform
---

# Afruheritage Product Overview

## Purpose
Afruheritage powered by Infotech Freight Forwarding is a control-plane platform that allows freight forwarders to launch and operate dedicated freight forwarding applications on infrastructure managed by Afruheritage.

## Core Platform Model
Afruheritage is the customer-facing platform.
Fleetbase is the underlying runtime engine deployed underneath each tenant environment.
Each tenant receives an isolated Fleetbase-backed runtime provisioned by the Afruheritage control plane.

## What Afruheritage Does
- accepts tenant applications
- manages tenant onboarding and review
- provisions one isolated runtime per approved tenant
- assigns Afruheritage subdomains
- supports future custom domain onboarding
- manages deployment status and operational visibility
- provides support and platform-level administration

## What Tenants See
Tenants interact with Afruheritage-branded workflows and their own freight forwarding application.
Tenants do not manually install Fleetbase and should not be exposed to internal deployment mechanics.

## What Fleetbase Does
Fleetbase provides the freight/logistics engine beneath each tenant runtime.
Its installation and lifecycle are automated by Afruheritage through the provisioning layer.

## Product Principles
- production-grade only
- no mock data in live environments
- no simulated provisioning success
- isolated runtime per tenant
- white-labeled delivery under Afruheritage
- auditability of operational actions
- security-first tenant separation

## High-Level Components
1. FastAPI control plane
2. background provisioning workers
3. runner nodes
4. reverse proxy / SSL layer
5. tenant Fleetbase runtimes
6. platform support and audit services

## Primary Business Goal
Provide freight forwarders with a fast, managed, white-labeled application launch experience without requiring them to self-host or manually deploy the underlying logistics platform.
""",

    "tenant_lifecycle.md": """---
doc_id: shared-tenant-lifecycle-001
scope: shared
product: afruheritage
title: Tenant Lifecycle
version: 1.0
last_reviewed: 2026-03-18
owner: Product Office
tags:
  - tenant
  - lifecycle
  - provisioning
  - operations
---

# Tenant Lifecycle

## Purpose
Defines the lifecycle of a tenant from initial application through active deployment and operational management.

## Lifecycle States
- draft
- submitted
- under_review
- approved
- rejected
- queued_for_deploy
- provisioning
- domain_configuring
- healthy
- failed
- suspended
- decommissioned

## State Definitions

### draft
Tenant record exists but has not been formally submitted for review.

### submitted
Tenant application has been sent for internal review.

### under_review
Internal operations or product team is evaluating the tenant request and business details.

### approved
Tenant is approved for deployment but not yet launched.

### rejected
Tenant application was rejected and cannot proceed until corrected and resubmitted.

### queued_for_deploy
Tenant has been approved and is waiting for a worker/runner assignment.

### provisioning
The provisioning workflow is actively creating the tenant runtime.

### domain_configuring
The runtime exists and domain or routing configuration is being finalized.

### healthy
The tenant runtime is deployed, reachable, and passed readiness checks.

### failed
Provisioning or a critical operational task failed and requires intervention or retry.

### suspended
Tenant access is intentionally paused due to administrative or commercial reasons.

### decommissioned
Tenant runtime has been retired according to decommissioning policy.

## Lifecycle Rules
- a tenant cannot be deployed unless approved
- a tenant cannot be marked healthy before readiness checks pass
- failed deployments must retain diagnostic logs
- retries must create auditable deployment events
- suspension must not delete deployment history
- decommissioning must follow backup and retention policy

## Required Operational Events
Each lifecycle transition must generate an audit event and, where relevant, a deployment event.
""",

    "deployment_architecture.md": """---
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
- no unsanitized shell input may be used
""",

    "fleetbase_usage_guide.md": """---
doc_id: shared-fleetbase-usage-guide-001
scope: shared
product: afruheritage
title: Fleetbase Usage Guide Within Afruheritage
version: 1.0
last_reviewed: 2026-03-18
owner: Product Office
tags:
  - fleetbase
  - usage
  - tenant
  - guide
---

# Fleetbase Usage Guide Within Afruheritage

## Purpose
Explains how Fleetbase is used inside Afruheritage.

## Core Principle
Fleetbase is the underlying logistics engine used to power each tenant runtime.
Tenants consume the platform as an Afruheritage-delivered application and do not manually install Fleetbase.

## How Fleetbase Is Used
Afruheritage automates Fleetbase deployment during tenant provisioning.
The platform treats Fleetbase as a managed runtime component under the control plane.

## What Developers Must Do
- automate Fleetbase installation through provisioning services
- keep Fleetbase deployment behind Afruheritage workflows
- prefer configuration and extension-first customization over deep core forks
- preserve upgrade paths where possible
- validate licensing impact before heavy proprietary white-label modifications

## What Support Must Understand
- tenant runtime issues may originate in provisioning, routing, configuration, or the Fleetbase runtime itself
- support responses must use Afruheritage language while remaining technically accurate
- deployment state must be checked before assuming application-level failure

## Operational Guardrails
- do not expose internal install commands to tenants
- do not claim a runtime is live before real health checks pass
- do not bypass audit logging for deploy, retry, or suspend actions
- do not mix tenant data across runtimes

## Usage Boundaries
Afruheritage owns:
- control plane
- deployment orchestration
- hosting operations
- routing and environment management

Tenant runtime owns:
- tenant application usage
- tenant users and workflows
- freight operations inside the allocated environment
""",

    "support_playbooks.md": """---
doc_id: shared-support-playbooks-001
scope: shared
product: afruheritage
title: Support Playbooks
version: 1.0
last_reviewed: 2026-03-18
owner: Support Operations
tags:
  - support
  - troubleshooting
  - playbook
  - operations
---

# Support Playbooks

## Purpose
Provides standard first-response guidance for common operational issues.

## Playbook: API Container Down

### Symptoms
- control plane unavailable
- health endpoint failing
- API container exited

### Actions
1. check container status
2. inspect recent API logs
3. verify environment variables
4. verify database connectivity
5. verify import and startup command integrity
6. restart only after root cause is identified
7. document findings in support log

## Playbook: Worker Not Processing Jobs

### Symptoms
- deployments remain queued
- no new deployment events
- worker container is unhealthy or idle

### Actions
1. verify worker container status
2. inspect worker logs
3. verify Redis connectivity
4. verify queue configuration
5. verify worker startup command
6. replay or retry only after issue is corrected

## Playbook: Deployment Stuck in Provisioning

### Symptoms
- deployment status remains provisioning beyond expected threshold
- runner activity incomplete
- no health check completion

### Actions
1. inspect deployment events
2. inspect runner logs
3. verify workspace creation
4. verify Fleetbase installation step output
5. verify reverse proxy configuration step
6. verify readiness probe execution
7. fail the deployment explicitly if timeout threshold is reached

## Playbook: Domain Not Resolving

### Symptoms
- tenant subdomain unreachable
- DNS mismatch
- SSL certificate missing or invalid

### Actions
1. verify DNS entry
2. verify reverse proxy route
3. verify host mapping
4. verify certificate issuance
5. test HTTP and HTTPS connectivity
6. record final root cause

## Playbook: Tenant Cannot Log In

### Symptoms
- admin cannot access tenant runtime
- login appears invalid
- bootstrap access unknown

### Actions
1. verify deployment health
2. verify bootstrap admin creation event
3. verify correct runtime URL
4. verify tenant status is not suspended
5. rotate credentials through admin flow if required
6. log remediation steps

## Support Rules
- never claim a fix before validation
- never use mock explanations in production incidents
- always record the exact failing layer
- escalate when data or permissions are missing
""",

    "domain_setup.md": """---
doc_id: shared-domain-setup-001
scope: shared
product: afruheritage
title: Domain Setup
version: 1.0
last_reviewed: 2026-03-18
owner: Platform Engineering
tags:
  - domain
  - dns
  - ssl
  - routing
---

# Domain Setup

## Purpose
Defines how tenant domains and subdomains are assigned and activated.

## MVP Standard
The first production milestone uses Afruheritage-managed subdomains:

<tenant-slug>.afruheritage.com

## Current Domain Rules
- tenant slug must be unique
- tenant slug must be DNS-safe
- only approved tenants may receive an active subdomain
- subdomain activation is complete only after routing and health checks succeed

## Subdomain Activation Flow
1. validate slug
2. reserve subdomain
3. create runtime route
4. apply reverse proxy configuration
5. reload reverse proxy
6. verify DNS and routing
7. verify HTTPS reachability
8. mark runtime healthy only after success

## Future Custom Domain Flow
Custom domains may be added later with:
- customer DNS ownership verification
- SSL issuance
- hostname routing validation
- fallback to Afruheritage subdomain until full success

## Failure Modes
- duplicate slug
- missing DNS record
- reverse proxy route mismatch
- SSL issuance failure
- runtime target unavailable

## Operational Rules
- do not promise a live domain until tested
- keep the Afruheritage subdomain available as fallback during migration
- domain events must be recorded in deployment logs
""",

    "security_policies.md": """---
doc_id: shared-security-policies-001
scope: shared
product: afruheritage
title: Security Policies
version: 1.0
last_reviewed: 2026-03-18
owner: Security Office
tags:
  - security
  - policy
  - tenant
  - secrets
---

# Security Policies

## Purpose
Defines minimum security expectations for the Afruheritage platform and tenant runtimes.

## Core Principles
- least privilege
- tenant isolation
- auditable operations
- secure secret handling
- no plaintext credential exposure
- no cross-tenant data leakage

## Access Control
The control plane must enforce role-based access at minimum for:
- super admin
- internal operations/admin
- tenant admin
- support operator with restricted scope

## Secrets Management
- no secrets in source control
- no plaintext secrets in logs
- no hardcoded credentials
- secrets must be injected securely into runtime environments
- bootstrap credentials must be handled with controlled exposure

## Command Execution Safety
- never pass unsanitized tenant input into shell commands
- validate slug, domain, and filesystem inputs strictly
- execute deployment commands under controlled service accounts
- capture stdout/stderr without leaking secrets

## Logging and Audit
The platform must log:
- tenant approval actions
- deploy actions
- retries
- suspend/resume actions
- security-sensitive administrative actions

## Tenant Isolation
Each tenant runtime must have:
- isolated deployment workspace
- isolated configuration
- isolated runtime credentials
- isolated operational logs where practical

## Incident Response Rules
- identify affected layer quickly
- preserve logs
- avoid destructive cleanup until evidence is captured
- document remediation outcome
"""
}

for filename, content in files.items():
    path = shared / filename
    path.write_text(content.strip() + "\\n", encoding="utf-8")
    print(f"created: {path}")

print("knowledge base scaffold complete")
