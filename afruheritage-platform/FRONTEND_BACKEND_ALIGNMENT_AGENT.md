# Afruheritage Frontend Backend Alignment Agent

## Goal
Update the frontend and admin-console so they fully consume the new backend SaaS engine.

## Backend APIs to Support

### Commercial Signup
- GET /api/v1/commercial/catalog
- POST /api/v1/commercial/signup/start
- POST /api/v1/commercial/signup/select-plan
- GET /api/v1/commercial/signup/{signup_id}

### Payment Hub
- POST /api/v1/payment-hub/initialize
- GET /api/v1/payment-hub/verify/{reference}
- GET /api/v1/payment-hub/receipt/{reference}
- GET /api/v1/payment-hub/transactions/{tenant_id}

### Admin Credits / Subscriptions
- GET /api/v1/admin/credits/{tenant_id}
- POST /api/v1/admin/credits/{tenant_id}/topup/{credits}
- GET /api/v1/admin/subscriptions/{tenant_id}/features/{feature_code}

### Marketplace
- POST /api/v1/marketplace/shipments
- POST /api/v1/marketplace/drivers/search
- POST /api/v1/marketplace/shipments/{job_id}/accept
- POST /api/v1/marketplace/shipments/{job_id}/tracking/{status}
- POST /api/v1/marketplace/shipments/{job_id}/gps
- GET /api/v1/marketplace/shipments/{job_id}/gps

### Runtime
- GET /api/v1/fleetbase-runtime/runners
- POST /api/v1/fleetbase-runtime/deploy
- GET /api/v1/fleetbase-runtime/tenant/{tenant_id}
- POST /api/v1/fleetbase-runtime/retry
- POST /api/v1/fleetbase-runtime/suspend

## Required Customer Frontend Screens

1. Pricing / Catalog
2. Signup Start
3. Plan + Add-on Selector
4. Paystack Checkout Redirect
5. Payment Status / Receipt
6. Tenant Onboarding Status
7. Shipment Posting Form
8. Shipment Tracking Page
9. GPS Live Tracking Page
10. Credits / Usage Page

## Required Admin Console Screens

1. Commercial Signups
2. Payment Transactions
3. Receipts
4. Tenant Credits
5. Subscription Features
6. Marketplace Jobs
7. GPS History / Live Tracking
8. Runtime Provisioning Queue
9. Runtime Retry / Suspend
10. Tenant Runtime Status

## Rule
Do not mock these flows. Every screen must call the live backend APIs.
