# API Reference

Complete reference for the Afruheritage Control Plane API.

**Base URL:** `http://<host>:8100/api/v1`  
**Auth:** Bearer token (JWT) via `Authorization: Bearer <token>`  
**Docs:** `http://<host>:8100/api/docs` (non-production only)

---

## Authentication

### POST /auth/login
Authenticate and receive JWT token.

```json
// Request
{
  "username": "admin@afruheritage.com",
  "password": "your-password"
}

// Response 200
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_at": "2026-07-12T08:00:00Z"
}
```

**Rate limited:** 5 attempts per minute per IP.

### POST /auth/bootstrap
Create the first superuser account. Only works when `ENABLE_BOOTSTRAP_ADMIN=true`.

```json
// Request
{
  "email": "admin@yourcompany.com",
  "password": "YourStrongPassword!",
  "full_name": "Platform Admin"
}
```

### GET /auth/me
Get current authenticated user profile. Requires Bearer token.

### POST /auth/register
Register a new tenant customer account.

---

## Tenant Management

### GET /tenants
List all tenants. **Requires superuser.**

**Response:** Array of tenant objects with id, slug, company_name, status, template_code.

### POST /tenants
Create a new tenant. **Requires superuser.**

```json
{
  "company_name": "AMOOKSCO Logistics",
  "contact_email": "admin@amooksco.com",
  "slug": "amooksco-logistics",
  "template_code": "freight"
}
```

### GET /tenants/{tenant_id}
Get a single tenant by UUID.

### PATCH /tenants/{tenant_id}
Update tenant details (name, status, etc.).

### POST /tenants/{tenant_id}/approve
Approve a pending tenant. **Requires superuser.**

### POST /tenants/{tenant_id}/launch
Queue tenant provisioning job (installs Fleetbase on runner). **Requires superuser.**

### GET /tenants/jobs/{job_id}
Get provisioning job status.

---

## Branding

### GET /branding/public/{tenant_slug_or_id}
Get public branding for a tenant (resolves by slug or UUID). **No auth required.**

**Response:**
```json
{
  "company_name": "AMOOKSCO LOGISTICS",
  "tagline": "Freight & Customs Services",
  "theme": {
    "primary_color": "#1f5d72",
    "secondary_color": "#3aa6b9",
    "accent_color": "#eef6f8",
    "font_family": "Inter, sans-serif"
  },
  "contact": {
    "support_email": "admin@amooksco.com",
    "notification_from_name": "Amooksco Logistics"
  },
  "features": {
    "maps_enabled": true,
    "public_tracking_enabled": true,
    "csv_import_enabled": true,
    "ai_enabled": true
  }
}
```

### GET /branding/{tenant_id}
Get branding for a specific tenant. **Requires auth.**

### POST /branding/{tenant_id}
Create branding configuration. **Requires auth.**

### PATCH /branding/{tenant_id}
Update branding (colors, logo, contact info, etc.). **Requires auth.**

---

## Fleetbase Runtime

### GET /fleetbase-runtime/runners
List all registered runner nodes. **Requires auth.**

**Response:** Array of runner objects:
```json
[
  {
    "id": "uuid",
    "name": "local-runner-01",
    "hostname": "10.0.0.115",
    "ssh_port": 22,
    "status": "active",
    "max_tenants": 10,
    "current_tenants": 0
  }
]
```

### POST /fleetbase-runtime/runners
Register a new runner node. **Requires superuser.**

```json
{
  "name": "runner-02",
  "hostname": "10.0.0.116",
  "ssh_port": 22,
  "ssh_user": "deploy",
  "root_runtime_path": "/mnt/storage/runtimes",
  "max_tenants": 10
}
```

### GET /fleetbase-runtime/runtimes
List all Fleetbase runtimes (tenant deployments). **Requires auth.**

**Response:** Array of runtime objects with status (queued, requested, installing, active, failed).

### POST /fleetbase-runtime/runtimes
Deploy a new runtime for a tenant. **Requires superuser.**

```json
{
  "tenant_id": "uuid",
  "runner_id": "uuid"
}
```

### GET /fleetbase-runtime/runtimes/tenant/{tenant_id}
Get runtime for a specific tenant.

---

## Fleetbase Tenant Proxy

Proxy endpoints to Fleetbase API using per-tenant admin tokens.

### GET /fleetbase-tenant/positions
Get all live driver positions for the authenticated tenant.

### GET /fleetbase-tenant/drivers/{driver_id}/position
Get position for a specific driver.

### GET /fleetbase-tenant/tracking-statuses
Get tracking statuses for the authenticated tenant.

### GET /fleetbase-tenant/live-tracking
Unified endpoint: drivers + positions + tracking statuses.

### GET /fleetbase-tenant/orders/{order_id}/track
Get order tracking info (order + driver position + tracking statuses).

---

## Billing

### GET /billing/plans
List available subscription plans.

### GET /billing/subscriptions
List subscriptions. **Requires auth.**

### POST /billing/subscriptions
Create a subscription for a tenant.

### GET /billing/wallets/{tenant_id}
Get wallet balance for a tenant.

### POST /billing/payments/paystack/init
Initialize a Paystack payment.

```json
{
  "tenant_id": "uuid",
  "amount": 50000,
  "currency": "GHS",
  "email": "customer@example.com"
}
```

### POST /billing/payments/paystack/verify
Verify a Paystack payment after callback.

---

## Custom Domains

### GET /domains/resolve?domain={domain}
Resolve a custom domain to a tenant.

### GET /domains/my-domains
List domains for the authenticated tenant.

### POST /domains/request
Request a new custom domain for a tenant.

### POST /domains/request-simple
Simplified domain request (tenant_id + domain).

### GET /domains/{id}/dns-instructions
Get DNS records to configure for domain verification.

### POST /domains/{id}/verify
Verify domain DNS records.

### GET /domains/{id}/events
Get domain event history (audit trail).

---

## AI Chat

### POST /ai/chat
Send a message to the AI assistant. **Requires auth.**

```json
{
  "message": "How do I track my shipment?",
  "tenant_id": "uuid"
}
```

### GET /ai/widget/config
Get AI widget configuration for a tenant (public, resolved from headers).

---

## Support / CRM

### POST /support-crm/public/tickets
Submit a public support ticket (no auth required).

```json
{
  "tenant_id": "uuid",
  "subject": "Cannot track my shipment",
  "message": "My tracking number TRK123 shows no results.",
  "email": "customer@example.com",
  "name": "John Doe"
}
```

### GET /support-crm/tickets
List support tickets. **Requires auth.**

---

## Public Tracking

### GET /shipments/public/track/{tenant_id}/{tracking_number}
Track a shipment by tracking number. **No auth required.**

Returns shipment status, origin, destination, ETA.

---

## Vendor Registration

### POST /vendors/register
Register as a delivery vendor (public, no auth). 4-step form.

```json
{
  "business_name": "Fast Delivery Co",
  "business_type": "registered",
  "vehicle_types": ["truck", "motorbike"],
  "service_areas": ["Accra", "Kumasi"],
  "contact_name": "John Doe",
  "contact_phone": "+233...",
  "contact_email": "john@fastdelivery.com"
}
```

### GET /vendors/marketplace
Search approved vendors (requires auth, tenant-scoped).

---

## Gallery

### POST /gallery/upload
Upload media file to gallery. **Requires auth.**

Multipart form data with file upload. Files stored locally under `/static/gallery/`.

---

## WhatsApp Bot

### GET /whatsapp/webhook
WhatsApp webhook verification (Meta API verification flow).

**Query params:** `hub.mode`, `hub.verify_token`, `hub.challenge`

### POST /whatsapp/webhook
Receive WhatsApp messages. Parses incoming messages and echoes response.

---

## Storefront Templates

### GET /storefront-templates
List all available storefront templates (freight, fleet, ecommerce, mall, bookings, realestate, restaurant).

### GET /storefront-templates/{code}
Get a specific template manifest with features, required endpoints, and fallbacks.

---

## Error Responses

All endpoints return standard HTTP error codes:

| Code | Meaning |
|---|---|
| 400 | Bad request — invalid input |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — insufficient permissions |
| 404 | Not found |
| 422 | Validation error — malformed request body |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

Error response format:
```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## Rate Limits

| Category | Endpoint | Limit |
|---|---|---|
| Public | Login | 5/minute per IP |
| Public | Registration | 3/hour per IP |
| Public | Tracking | 100/minute per IP |
| Public | Vendor registration | 2/hour per IP |
| Public | Support tickets | 10/hour per IP |
| Auth | General | 1000/minute |
| Auth | Shipments | 200/minute |
| Auth | Billing | 50/minute |
| Auth | AI chat | 60/minute |
| Auth | File uploads | 10/minute |
| Admin | General | 2000/minute |
| Admin | Provisioning | 10/minute |
| Admin | Bulk operations | 5/minute |

---

## Security Headers

All API responses include:

| Header | Value |
|---|---|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` (production only) |
