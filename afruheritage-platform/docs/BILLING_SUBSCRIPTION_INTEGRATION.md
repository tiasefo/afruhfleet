# Billing & Subscription Integration Guide

## Policy Decisions
- enforcement mode: read-only when trial expires or credits are exhausted
- credits apply to: AI usage and document processing
- paystack flow: fully API-based

## Core Concepts
- plans: free trial, professional, business
- subscription controls access/entitlements
- wallet controls credit balance
- wallet transactions provide auditability
- payment verification activates subscriptions or tops up credits
- admin can force read-only, adjust credits, assign plans

## Routes
- `GET /api/v1/billing/plans`
- `POST /api/v1/billing/subscriptions/trial/{tenant_id}`
- `GET /api/v1/billing/subscriptions/{tenant_id}`
- `GET /api/v1/billing/wallets/{tenant_id}`
- `POST /api/v1/billing/payments/init`
- `POST /api/v1/billing/payments/verify/{reference}`
- `POST /api/v1/billing/credits/consume`
- `POST /api/v1/billing/admin/read-only`
- `POST /api/v1/billing/admin/credits/adjust`
- `POST /api/v1/billing/admin/subscriptions/assign`

## Important
This scaffold writes models and APIs, but you must still:
- create Alembic migrations
- connect trial/wallet creation to tenant onboarding
- enforce read-only on protected business actions
- verify Paystack webhook signatures if webhooks are added later
- localize plan labels for English and Chinese
