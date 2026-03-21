---
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
- escalate when data or permissions are missing\n