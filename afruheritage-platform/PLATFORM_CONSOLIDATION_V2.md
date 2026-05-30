# Afruheritage Platform Consolidation v2

## Decision

Afruheritage will standardize on the new SaaS orchestration architecture.

## Canonical v2 API Groups

These are the preferred APIs for UAT and future frontend work:

- `/api/v1/commercial/*`
- `/api/v1/payment-hub/*`
- `/api/v1/marketplace/*`
- `/api/v1/admin/*`
- `/api/v1/fleetbase-runtime/*`

## Deprecated / Legacy API Groups

These may still exist but should not be used as the primary UAT success criteria:

- `/api/v1/vendors/register`
- `/api/v1/navigator/*`
- old `/api/v1/tenants` creation flow
- old billing wallet flow where replaced by `/admin/credits` and `/payment-hub`

## Current Confirmed Working Capabilities

- Commercial catalog
- Customer signup
- Plan/add-on selection
- Paystack checkout initialization
- Payment verification
- Paystack webhook processing
- Webhook idempotency
- Subscription activation
- Credit issuance
- Feature entitlement check
- Payment receipt
- Marketplace shipment posting
- Driver job search
- Driver job acceptance
- Tracking lifecycle update
- GPS ping ingestion
- GPS history retrieval
- Admin credit visibility
- Runtime API presence

## Remaining Work

1. Cloudflare Tunnel routing
2. Billing callback public receipt/status flow
3. Runtime provisioning from paid signup
4. Admin console parity
5. Frontend customer dashboard parity
6. Legacy API deprecation or compatibility wrappers
7. v2 UAT suite
