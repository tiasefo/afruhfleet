---
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
- freight operations inside the allocated environment\n