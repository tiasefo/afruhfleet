---
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
Provide freight forwarders with a fast, managed, white-labeled application launch experience without requiring them to self-host or manually deploy the underlying logistics platform.\n