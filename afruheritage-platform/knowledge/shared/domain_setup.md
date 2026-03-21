---
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
- domain events must be recorded in deployment logs\n