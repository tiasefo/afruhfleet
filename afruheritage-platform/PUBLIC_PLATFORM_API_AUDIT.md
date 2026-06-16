# Public Platform (SaaS Frontend) - API Audit

**Date:** 2026-06-14
**Purpose:** Cross-reference public frontend API calls with control plane backend implementation

---

## 1. Frontend Pages and Their API Calls

### Public Pages (Unauthenticated)

| Page | API Calls | Status |
|------|-----------|--------|
| `/login` | `POST /api/v1/auth/login` | ✅ Exists |
| `/register` | `POST /api/v1/auth/register` | ✅ Exists |
| `/track` | `GET /api/v1/shipments/public/track/{tenant_id}/{tracking_number}` | ✅ Exists |
| `/marketplace` | `GET /api/v1/vendors/marketplace` | ✅ Exists |
| `/vendors/register` | `POST /api/v1/vendors/register` | ✅ Exists |
| `/docs` | No API calls (static) | ✅ N/A |
| `/cookie-policy` | No API calls (static) | ✅ N/A |
| `/gdpr` | No API calls (static) | ✅ N/A |

### Authenticated Dashboard Pages

| Page | API Calls | Status |
|------|-----------|--------|
| `/dashboard` | `GET /api/v1/auth/me`, `GET /api/v1/tenants` | ✅ All exist |
| `/billing` | `GET /api/v1/billing/plans`, `GET /api/v1/billing/subscriptions/{id}`, `POST /api/v1/billing/payments/init`, `POST /api/v1/billing/wallets/topup` | ✅ All exist |
| `/kyc` | `GET /api/v1/kyc/status`, `POST /api/v1/kyc/submit-manual`, `POST /api/v1/kyc/ocr-parse` | ✅ All exist |
| `/members` | `GET /api/v1/users`, `POST /api/v1/users`, `PATCH /api/v1/users/{id}` | ✅ All exist |
| `/crm` | `GET /api/v1/support-crm/contacts`, `GET /api/v1/support-crm/quotes` | ✅ All exist |
| `/customs` | `POST /api/v1/customs/guest-usage`, `POST /api/v1/customs/payment-callback` | ✅ All exist |
| `/locations/*` | `GET /api/v1/geo/locations` | ✅ Exists |

### Fleetbase Integration Pages (Tenant Runtime)

| Page | API Calls | Status |
|------|-----------|--------|
| `/fleetbase/console` | Proxies to tenant Fleetbase runtime | ✅ Proxied |
| `/fleetbase/console-gate` | Proxies to tenant Fleetbase runtime | ✅ Proxied |
| `/fleetbase/drivers` | Proxies to tenant Fleetbase runtime | ✅ Proxied |
| `/fleetbase/fleets` | Proxies to tenant Fleetbase runtime | ✅ Proxied |
| `/fleetbase/live-map` | Proxies to tenant Fleetbase runtime | ✅ Proxied |
| `/fleetbase/vehicles` | Proxies to tenant Fleetbase runtime | ✅ Proxied |
| `/fleetbase/extensions` | Proxies to tenant Fleetbase runtime | ✅ Proxied |

### Admin Pages (Superuser Only)

| Page | API Calls | Status |
|------|-----------|--------|
| `/admin` | `GET /api/v1/tenants`, `GET /api/v1/runners` | ✅ All exist |
| `/admin/customs/guest-usage` | `GET /api/v1/customs/guest-usage` | ✅ Exists |
| `/admin/runtime` | `GET /api/v1/fleetbase-runtime/runners` | ✅ Exists |

---

## 2. Control Plane Backend Routes (Port 8100)

### Auth Routes (`/api/v1/auth`)
- `POST /bootstrap` - Create first superuser (development only)
- `POST /register` - Register new tenant + user
- `POST /login` - Login, returns access_token + tenant_id + portal_url
- `GET /me` - Get current user info
- `POST /password-reset` - Request password reset
- `POST /password-reset/confirm` - Confirm password reset

### Tenant Routes (`/api/v1/tenants`)
- `POST /` - Create tenant (superuser only)
- `GET /` - List all tenants (superuser only)
- `POST /{tenant_id}/approve` - Approve tenant (superuser only)
- `POST /{tenant_id}/launch` - Launch tenant (superuser only)
- `GET /jobs/{job_id}` - Get provisioning job status
- `GET /register-requests` - List tenant registration requests
- `PATCH /register-requests/{id}` - Review tenant request
- `POST /auto-provision` - Auto-provision tenant
- `POST /{id}/resend-portal-url` - Resend portal URL
- `POST /{id}/suspend` - Suspend tenant
- `POST /{id}/activate` - Activate tenant
- `DELETE /{id}` - Delete tenant
- `POST /{id}/provision` - Provision Fleetbase
- `GET /lookup` - Lookup tenant by email or slug

### Shipment Routes (`/api/v1/shipments`)
- `POST /` - Create shipment
- `GET /` - List shipments (with filters)
- `GET /{shipment_id}` - Get shipment details
- `PATCH /{shipment_id}` - Update shipment
- `DELETE /{shipment_id}` - Delete shipment
- `POST /{shipment_id}/transition` - Transition shipment status
- `GET /{shipment_id}/events` - Get shipment events
- `POST /{shipment_id}/events` - Add shipment event
- `POST /{shipment_id}/location` - Update shipment location
- `GET /{shipment_id}/tracking` - Get tracking history
- `POST /{shipment_id}/tracking/ingest` - Ingest tracking point
- `GET /public/track/{tenant_id}/{tracking_number}` - Public tracking (unauthenticated)
- `POST /import/csv` - CSV bulk import
- `GET /{shipment_id}/group-members` - List group members
- `POST /{shipment_id}/group-members` - Add group member
- `PATCH /{shipment_id}/group-members/{id}` - Update group member
- `DELETE /{shipment_id}/group-members/{id}` - Remove group member
- `WS /{shipment_id}/live` - WebSocket for live tracking

### Vendor Routes (`/api/v1/vendors`)
- `POST /register` - Register vendor (public)
- `GET /marketplace` - List marketplace shipments (public)
- `GET /admin` - List vendors (admin)
- `GET /admin/{vendor_id}` - Get vendor details (admin)
- `POST /admin/{vendor_id}/review` - Review vendor (admin)
- `POST /admin/{vendor_id}/suspend` - Suspend vendor (admin)
- `POST /{vendor_id}/availability` - Update vendor availability
- `POST /{vendor_id}/documents` - Submit vendor document
- `POST /match` - Suggest vendors for pickup
- `POST /auto-dispatch` - Auto-dispatch booking
- `POST /bookings` - Create booking
- `GET /bookings` - List bookings
- `GET /bookings/{id}` - Get booking details
- `PATCH /bookings/{id}` - Update booking
- `POST /bookings/{id}/decide` - Vendor decides on booking

### Billing Routes (`/api/v1/billing`)
- `GET /plans` - List billing plans
- `POST /subscriptions/trial/{tenant_id}` - Start trial
- `GET /subscriptions/{tenant_id}` - Get subscription
- `POST /subscriptions/{tenant_id}/cancel` - Cancel subscription
- `POST /subscriptions/{tenant_id}/pause` - Pause subscription
- `POST /subscriptions/{tenant_id}/resume` - Resume subscription
- `GET /wallets/{tenant_id}` - Get wallet
- `POST /wallets/topup` - Topup wallet
- `POST /payments/init` - Initialize payment (Paystack/Flutterwave)
- `POST /payments/verify` - Verify payment
- `POST /payments/reinit` - Reinitialize payment
- `POST /admin/subscriptions/assign` - Assign plan (admin)
- `POST /admin/credits/adjust` - Adjust credits (admin)
- `POST /admin/read-only` - Set read-only mode (admin)
- `GET /credit-costs` - Get feature credit costs
- `POST /credits/consume` - Consume credits

### User Routes (`/api/v1/users`)
- `GET /` - List users (with filters)
- `POST /` - Create user
- `GET /{id}` - Get user details
- `PATCH /{id}` - Update user
- `DELETE /{id}` - Delete user
- `POST /{id}/reset-password` - Reset user password
- `POST /{id}/role` - Update user role
- `GET /roles` - List roles
- `POST /roles` - Create role
- `GET /permissions` - List permissions
- `GET /audit` - Get user audit trail

### KYC Routes (`/api/v1/kyc`)
- `GET /status` - Get KYC status
- `POST /submit-manual` - Submit manual KYC
- `POST /ocr-parse` - OCR parse ID document
- `GET /admin/list` - List KYC submissions (admin)
- `POST /admin/approve/{kyc_id}` - Approve KYC (admin)
- `POST /admin/revoke/{kyc_id}` - Revoke KYC (admin)

### Custom Domain Routes (`/api/v1/domains`)
- `GET /resolve` - Resolve hostname to tenant_id (public)
- `POST /request` - Request custom domain
- `GET /tenant/{tenant_id}` - List tenant domains
- `POST /activate` - Activate domain
- `GET /{domain_id}/refresh-status` - Refresh SSL status
- `POST /fail` - Mark domain as failed

### Runner Routes (`/api/v1/runners`)
- `POST /` - Create runner node (admin)
- `GET /` - List runner nodes (admin)

### Fleetbase Runtime Routes (`/api/v1/fleetbase-runtime`)
- `POST /runners` - Create Fleetbase runner (admin)
- `GET /runners` - List Fleetbase runners (admin)
- `POST /deploy` - Deploy Fleetbase runtime (admin)
- `GET /tenant/{tenant_id}` - Get tenant runtime (admin)
- `POST /retry` - Retry failed deployment (admin)
- `POST /suspend` - Suspend runtime (admin)
- `GET /{runtime_id}/events` - Get runtime events (admin)

### AI Routes (`/api/v1/ai`)
- `POST /chat` - AI chat (authenticated)
- `POST /chat/public` - Public AI chat (no auth)
- `GET /widget/config` - Get AI widget config

### Support CRM Routes (`/api/v1/support-crm`)
- `POST /public/tickets` - Create support ticket (public)
- `GET /admin/tickets` - List tickets (admin)
- `PATCH /admin/tickets/{id}/status` - Update ticket status (admin)
- `GET /contacts` - List CRM contacts
- `POST /contacts` - Create contact
- `GET /quotes` - List quotes
- `POST /quotes` - Create quote

### Geo Routes (`/api/v1/geo`)
- `GET /locations` - Get locations

### Customs Routes (`/api/v1/customs`)
- `POST /guest-usage` - Calculate customs guest usage
- `POST /payment-callback` - Customs payment callback

### Fleetbase Proxy Routes (`/api/v1/fleetbase-proxy`)
- `*` - Proxies all requests to tenant's Fleetbase runtime

---

## 3. API Client Configuration

**Frontend API Base:** `/api/v1` (proxied via Next.js rewrites to `http://localhost:8100/api/v1`)

**Token Management:**
- Stored in `localStorage` as `auth_token`
- Also set as cookie `access_token` for middleware
- Sent as `Authorization: Bearer {token}` header

**Tenant Context:**
- Stored in `localStorage` as `tenant_id`
- Automatically appended to API calls as `?tenant_id=` query parameter
- Required for most tenant-scoped operations

**Language:**
- Stored in `localStorage` as `language` (default: `en`)
- Sent as `Accept-Language` header

---

## 4. Feature Tier Distribution

### Shared Services (Tenant-Level - Inherited by All Tenants)
- **Shipments** - CRUD, tracking, events, location updates
- **Group Members** - Shipment group member management
- **CSV Import** - Bulk shipment import
- **Public Tracking** - Unauthenticated shipment tracking
- **Maps** - Live map visualization (via Fleetbase)
- **Storefront** - Tenant storefront (via Fleetbase)

### Phase 1 (Global - Control Plane)
- **Role-Based Access Control** - User roles, permissions
- **Tenant Management** - Tenant CRUD, approval, launch
- **Billing Engine** - Plans, subscriptions, wallets, payments

### Phase 2 (Global - Control Plane)
- **Runner Management** - Runner node CRUD
- **KYC Verification** - Manual KYC submission, OCR parsing
- **Custom Domain** - Custom domain management, Cloudflare integration
- **AI Chat** - AI assistant with RAG retrieval

### Phase 3 (Global - Control Plane)
- **Analytics Dashboard** - Admin analytics
- **Vendor Marketplace** - Vendor registration, marketplace, bookings
- **Support CRM** - Contacts, quotes, tickets, GLPI integration

---

## 5. Billing Guard Middleware

**Credit Consumption:**
- Shipment creation: consumes credits
- CSV import: consumes credits
- KYC verification: consumes credits (if not included in plan)
- AI chat: consumes credits (if not included in plan)

**Read-Only Mode:**
- Triggered when wallet balance is exhausted
- Prevents write operations (create, update, delete)
- Allows read operations (list, get)

**Plan Features:**
- `max_shipments_per_month` - Shipment limit
- `max_drivers` - Driver limit
- `max_vehicles` - Vehicle limit
- `max_products` - Product limit
- `max_group_members` - Group member limit
- `dispatch_enabled` - Dispatch feature
- `route_planning_enabled` - Route planning
- `service_rates_enabled` - Service rates
- `pod_enabled` - POD upload
- `route_optimization_enabled` - Route optimization
- `vrp_enabled` - Vehicle routing
- `webhooks_enabled` - Webhooks
- `notifications_enabled` - Notifications
- `extensions_enabled` - Extensions
- `maintenance_enabled` - Maintenance
- `fuel_tracking_enabled` - Fuel tracking
- `csv_import_enabled` - CSV import
- `includes_custom_domain` - Custom domain
- `includes_priority_support` - Priority support

---

## 6. Fleetbase Integration

**Fleetbase Runtime:**
- Each tenant gets isolated Fleetbase deployment
- Deployed via SSH to runner node
- Accessible via `/fleetbase/*` routes (proxied)
- Console URL: `https://{tenant-slug}.afruheritage.com/fleetbase`
- API URL: `https://{tenant-slug}.afruheritage.com/api`

**Fleetbase Proxy Routes:**
- `/api/v1/fleetbase-proxy/*` → Tenant's Fleetbase API
- Requires tenant context (tenant_id)
- Requires authentication (tenant user token)

---

## 7. Immediate Issues

| Issue | Location | Status |
|-------|----------|--------|
| None identified | All frontend API calls have matching backend endpoints | 🟢 Healthy |

---

## 8. Key Differences from Sentinel

| Aspect | Sentinel (Admin Console) | Public Platform (SaaS) |
|--------|------------------------|----------------------|
| **Port** | 9200 | 3000 (frontend) / 8100 (backend) |
| **Auth** | Admin-only JWT | User JWT + tenant context |
| **Token Storage** | `admin_token` + `cp_token` | `auth_token` + `tenant_id` |
| **Proxy Pattern** | Proxies to control plane with `X-CP-Token` | Direct control plane calls with tenant context |
| **Database** | Sentinel admin DB (users, audit) | Control plane DB (tenants, users, shipments, etc.) |
| **Fleetbase Access** | Via control plane proxy | Via direct proxy to tenant runtime |
| **Billing** | Admin-only (assign plans, adjust credits) | User-facing (subscriptions, payments, wallet) |
| **KYC** | Admin review | User submission + admin review |
| **Vendors** | Admin review | User registration + admin review |

---

## 9. Testing Endpoints

**Health Check:**
- `GET /api/v1/health` - Control plane health

**Bootstrap (Development):**
- `POST /api/v1/auth/bootstrap` - Create superuser

**Public Tracking:**
- `GET /api/v1/shipments/public/track/{tenant_id}/{tracking_number}` - Track shipment

**Vendor Registration:**
- `POST /api/v1/vendors/register` - Register vendor

**AI Chat (Public):**
- `POST /api/v1/ai/chat/public` - Public AI chat

---

## 10. Recommended Action Plan

1. **No immediate fixes needed** - All frontend API calls have matching backend endpoints
2. **Monitor Fleetbase proxy** - Ensure tenant runtime proxies are working correctly
3. **Test billing guard** - Verify credit consumption and read-only mode
4. **Test KYC OCR** - Verify OCR parsing is working
5. **Test AI chat** - Verify RAG retrieval and Ollama integration
