# Sentinel Admin Console - API Audit

**Date:** 2026-06-14
**Purpose:** Cross-reference frontend API calls with backend implementation before making changes

---

## 1. Frontend Pages and Their API Calls

### Dashboard Pages

| Page | API Calls | Status |
|------|-----------|--------|
| `/dashboard` | `GET /sentinel/dashboard/stats`, `GET /sentinel/health`, `GET /sentinel/tenants`, `GET /sentinel/vendors` | ✅ All exist |
| `/dashboard/tenants` | `GET /sentinel/tenants`, `POST /sentinel/tenants`, `GET /sentinel/tenants/requests` | ⚠️ requests endpoint missing |
| `/dashboard/tenants/[id]` | `GET /sentinel/tenants`, `GET /sentinel/tenants/{id}/products`, `GET /sentinel/tenants/{id}/fleetbase/drivers` | ❌ products, drivers endpoints missing |
| `/dashboard/vendors` | `GET /sentinel/vendors`, `POST /sentinel/vendors`, `GET /sentinel/vendors/{id}` | ✅ All exist |
| `/dashboard/billing` | `GET /sentinel/billing/plans`, `GET /sentinel/billing/subscriptions/{id}`, `POST /sentinel/billing/assign` | ✅ All exist |
| `/dashboard/runners` | `GET /sentinel/runners`, `POST /sentinel/runners` | ✅ All exist |
| `/dashboard/users` | `GET /sentinel/users`, `POST /sentinel/users`, `PATCH /sentinel/users/{id}` | ✅ All exist |
| `/dashboard/domains` | `GET /sentinel/domains/tenant/{id}`, `POST /sentinel/domains/activate` | ✅ All exist |
| `/dashboard/kyc` | `GET /sentinel/kyc/list`, `POST /sentinel/kyc/approve/{id}`, `POST /sentinel/kyc/revoke/{id}` | ✅ All exist |
| `/dashboard/tickets` | `GET /sentinel/tickets`, `PATCH /sentinel/tickets/{id}/status` | ✅ All exist |
| `/dashboard/tracking` | `GET /sentinel/tracking/public` | ✅ Exists |
| `/dashboard/analytics` | `GET /sentinel/analytics/summary` | ✅ Exists |
| `/dashboard/runtimes` | `GET /sentinel/runtimes`, `POST /sentinel/runtimes/deploy` | ⚠️ endpoint is `/fleetbase-runtime` not `/runtimes` |
| `/dashboard/control-center` | `GET /sentinel/control-center/features` | ✅ Exists |
| `/dashboard/documentation` | No API calls (static) | ✅ N/A |
| `/dashboard/knowledge-base` | No API calls (static) | ✅ N/A |
| `/dashboard/architecture` | No API calls (static) | ✅ N/A |
| `/dashboard/blueprint` | No API calls (static) | ✅ N/A |
| `/dashboard/vendor-actions` | `GET /sentinel/vendors` | ✅ Exists |

---

## 2. Backend Routes (Sentinel Admin Console)

### Auth Routes (`/sentinel/auth`)
- `POST /login` - Admin login, returns access_token + control_plane_token
- `GET /me` - Get current admin user info
- `POST /bootstrap` - Create first admin user

### Dashboard Routes (`/sentinel/dashboard`)
- `GET /stats` - Dashboard statistics (users, tenants, vendors, revenue, system health)
- `GET /health` - System health check (returns `{status, service}`)

### Tenant Routes (`/sentinel/tenants`)
- `GET /` - List all tenants (proxies to control plane, requires `X-CP-Token` header)
- `POST /` - Create tenant (proxies to control plane)
- `POST /{id}/approve` - Approve tenant (proxies to control plane)
- `POST /{id}/launch` - Launch tenant (proxies to control plane)
- `GET /jobs/{job_id}` - Get provisioning job status (proxies to control plane)
- `GET /register-requests` - List tenant registration requests (proxies to control plane)
- `PATCH /register-requests/{id}` - Review tenant request (proxies to control plane)
- `POST /auto-provision` - Auto-provision tenant (proxies to control plane)
- `POST /{id}/resend-portal-url` - Resend portal URL (proxies to control plane)
- `POST /{id}/suspend` - Suspend tenant (proxies to control plane)
- `POST /{id}/activate` - Activate tenant (proxies to control plane)
- `DELETE /{id}` - Delete tenant (proxies to control plane)
- `POST /{id}/provision` - Provision Fleetbase for tenant (proxies to control plane)
- `GET /lookup` - Lookup tenant by email or slug (proxies to control plane)

### Vendor Routes (`/sentinel/vendors`)
- `GET /` - List vendors (proxies to control plane, supports status, q, page, page_size)
- `GET /{vendor_id}` - Get vendor details (proxies to control plane)
- `POST /{vendor_id}/review` - Review vendor (proxies to control plane)
- `POST /{vendor_id}/suspend` - Suspend vendor (proxies to control plane)

### Billing Routes (`/sentinel/billing`)
- `GET /plans` - List billing plans (proxies to control plane)
- `GET /subscriptions/{tenant_id}` - Get tenant subscription (proxies to control plane)
- `POST /admin/subscriptions/assign` - Assign plan to tenant (proxies to control plane)
- `POST /admin/credits/adjust` - Adjust tenant credits (proxies to control plane)
- `POST /admin/read-only` - Set tenant read-only mode (proxies to control plane)
- `GET /wallets/{tenant_id}` - Get tenant wallet (proxies to control plane)

### Runner Routes (`/sentinel/runners`)
- `GET /` - List runner nodes (proxies to control plane)
- `POST /` - Create runner node (proxies to control plane)

### User Routes (`/sentinel/users`)
- `GET /` - List users (local database, supports search, role, is_active, tenant_id filters)
- `POST /` - Create user (local database)
- `GET /{id}` - Get user details (local database)
- `PATCH /{id}` - Update user (local database)
- `DELETE /{id}` - Delete user (local database)
- `GET /roles` - List roles (local database)
- `POST /roles` - Create role (local database)
- `GET /permissions` - List permissions (local database)

### Domain Routes (`/sentinel/domains`)
- `GET /tenant/{tenant_id}` - List tenant domains (proxies to control plane)
- `POST /activate` - Activate custom domain (proxies to control plane)

### KYC Routes (`/sentinel/kyc`)
- `GET /list` - List KYC submissions (proxies to control plane)
- `POST /approve/{kyc_id}` - Approve KYC submission (proxies to control plane)
- `POST /revoke/{kyc_id}` - Revoke KYC submission (proxies to control plane)

### Ticket Routes (`/sentinel/tickets`)
- `GET /` - List support tickets (proxies to control plane, supports status, tenant_id, q, page, page_size)
- `PATCH /{ticket_id}/status` - Update ticket status (proxies to control plane)

### Tracking Routes (`/sentinel/tracking`)
- `GET /public` - Track public shipment (proxies to control plane, requires tenant_id, tracking_number)

### Analytics Routes (`/sentinel/analytics`)
- `GET /summary` - Get admin analytics summary (proxies to control plane)

### Runtime Routes (`/sentinel/fleetbase-runtime`)
- `POST /deploy` - Deploy Fleetbase runtime (proxies to control plane)
- `GET /tenant/{tenant_id}` - Get tenant runtime (proxies to control plane)
- `POST /suspend` - Suspend runtime (proxies to control plane)
- `POST /retry` - Retry failed deployment (proxies to control plane)

### Control Center Routes (`/sentinel/control-center`)
- `GET /features` - List feature flags (local database)

---

## 3. Critical Gap: Control Plane Token Required

**ROOT CAUSE OF "Not Found" ERRORS:**

Most Sentinel routes are **proxies to the Control Plane API** (port 8100). They require:
- `X-CP-Token` header with a valid control plane JWT token
- The control plane API must be running and accessible

**Current behavior:**
- Frontend calls `/sentinel/tenants` → Sentinel backend tries to proxy to control plane → **Fails if no X-CP-Token header**
- Frontend calls `/sentinel/vendors` → Same issue
- Frontend calls `/sentinel/billing/plans` → Same issue

**How it should work:**
1. User logs into Sentinel → `POST /sentinel/auth/login` returns `access_token` (Sentinel) + `control_plane_token` (Control Plane)
2. Frontend stores both tokens
3. Frontend sends `Authorization: Bearer {access_token}` AND `X-CP-Token: {control_plane_token}` on proxy calls
4. Sentinel validates admin token, then forwards CP token to control plane

**Current problem:**
- Frontend's `token-manager.ts` stores CP token
- Frontend's `api.ts` gets auth headers from TokenManager
- **BUT** the TokenManager's `getAuthHeaders()` may not be sending `X-CP-Token` correctly

---

## 4. Feature Tier Distribution

Based on CODEBASE_INVENTORY.md:

### Shared Services (Tenant-Level)
- Shipments
- Group Members
- CSV Import
- Public Tracking
- Maps
- Storefront

### Phase 1 (Global - Control Plane)
- Role-Based Access Control
- Tenant Management
- Billing Engine

### Phase 2 (Global - Control Plane)
- Runner Management
- KYC Verification
- Custom Domain
- AI Chat

### Phase 3 (Global - Control Plane)
- Analytics Dashboard
- Vendor Marketplace
- Support CRM

---

## 5. Immediate Issues to Fix

### Issue 1: X-CP-Token Header Not Being Sent
**Location:** `sentinel/frontend/lib/token-manager.ts` - `getAuthHeaders()` method
**Fix:** Ensure `X-CP-Token` is included in the headers when making proxy calls

### Issue 2: Frontend Calling Wrong Runtime Endpoint
**Location:** `sentinel/frontend/app/dashboard/runtimes/page.tsx`
**Current:** Calls `/sentinel/runtimes`
**Should be:** Calls `/sentinel/fleetbase-runtime`

### Issue 3: Missing Tenant Detail Endpoints
**Location:** `sentinel/frontend/app/dashboard/tenants/[id]/tenant-detail-client.tsx`
**Calls:** `/sentinel/tenants/{id}/products`, `/sentinel/tenants/{id}/fleetbase/drivers`
**Status:** These endpoints don't exist in control plane API
**Action:** Either implement these endpoints or remove from frontend

### Issue 4: Dashboard Health Response Mismatch
**Location:** `sentinel/frontend/app/dashboard/page.tsx`
**Issue:** Frontend expects `cpu_usage`, `memory_usage` but API returns `{status, service}`
**Status:** Already fixed with conditional rendering

---

## 6. Recommended Action Plan

1. **Fix TokenManager** - Ensure `X-CP-Token` header is sent on all proxy calls
2. **Verify Control Plane Connection** - Test if control plane (port 8100) is accessible from Sentinel
3. **Fix Runtime Endpoint** - Update frontend to call `/sentinel/fleetbase-runtime` instead of `/sentinel/runtimes`
4. **Remove/Implement Missing Endpoints** - Decide on tenant products/drivers endpoints
5. **Test Each Page** - After fixes, test each dashboard page with real API calls

---

## 7. Control Plane API Endpoints (for reference)

Sentinel proxies to these control plane endpoints:

| Sentinel Route | Control Plane Route |
|----------------|---------------------|
| `/sentinel/tenants` | `/api/v1/tenants` |
| `/sentinel/vendors` | `/api/v1/vendors/admin` |
| `/sentinel/billing/plans` | `/api/v1/billing/plans` |
| `/sentinel/runners` | `/api/v1/runners` |
| `/sentinel/domains` | `/api/v1/domains` |
| `/sentinel/kyc` | `/api/v1/kyc/admin` |
| `/sentinel/tickets` | `/api/v1/support-crm/admin/tickets` |
| `/sentinel/tracking` | `/api/v1/shipments/public/track` |
| `/sentinel/analytics` | `/api/v1/analytics/admin/summary` |
| `/sentinel/fleetbase-runtime` | `/api/v1/fleetbase-runtime` |

**Control Plane Base URL:** Configured in `sentinel/.env` as `CONTROL_PLANE_BASE_URL`
**Control Plane API Prefix:** Configured as `CONTROL_PLANE_API_PREFIX` (default `/api/v1`)
