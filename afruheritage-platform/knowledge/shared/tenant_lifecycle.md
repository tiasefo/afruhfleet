---
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
Each lifecycle transition must generate an audit event and, where relevant, a deployment event.\n