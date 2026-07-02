# Smoketest: End-to-End Tenant Lifecycle for "Efie ne Fie"

## Tenant Lifecycle States & Flow

```
draft → pending_verification → approved → queued → provisioning → active
                                                                ↘ failed → (retry) → queued
                                                          suspended → (activate) → active
                                                          deleted → (restore) → active
```

## Two Registration Paths

### Path A: Public Company Self-Registration (frontend `/register` → `POST /api/v1/companies/register`)
- Creates Tenant (status=`draft`) + admin User + branding + AI settings
- No subscription created yet — user must select plan and pay
- After subscription + payment → admin approves → launch → provisioning → active

### Path B: Admin-Created Tenant (`POST /api/v1/tenants`)
- Creates Tenant (status=`pending_verification`) + branding + trial subscription + wallet
- Admin approves → launch → provisioning → active

### Path C: Registration Request → Admin Auto-Provision
- Public submits `POST /api/v1/tenants/register-request` → creates TenantRequest
- Admin calls `POST /api/v1/tenants/auto-provision?request_id=...` → creates Tenant + auto-approves + queues provisioning

---

## Smoketest Steps (Path A — Frontend Registration)

### Step 1: Register Company via Frontend
- **Frontend:** Go to `http://localhost:3002/register`
- **Fill form:** Full Name, Email, Company Name = "Efie ne Fie", Password
- **API call:** `POST /api/v1/auth/register` with `{email, full_name, password, company_name: "Efie ne Fie", plan_code: null}`
- **Backend flow:** `auth.py:register()` → `ensure_user_tenant_context()` → `SignupOnboardingService.ensure_user_tenant()` → creates Tenant (status=`draft`), User (tenant_admin), branding, AI settings, DNS
- **Expected response:** `200` with `{access_token, tenant_id, subdomain: "efie-ne-fie", portal_url, requires_subscription: true}`
- **PASS:** Token returned, tenant_id present, subdomain = "efie-ne-fie"
- **FAIL:** 422 (validation), 409 (duplicate), 500 (server error)

### Step 2: Verify Tenant Context Resolution
- **API call:** `GET /api/v1/tenant-context/efie-ne-fie` (no auth)
- **Expected:** `200` with tenant context including `company_name: "Efie ne Fie"`, `slug: "efie-ne-fie"`, `theme` with colors, `subscription` info
- **PASS:** 200, company_name matches, theme populated
- **FAIL:** 404 (tenant not found), 500 (missing branding/theme fields)

### Step 3: Login as Tenant Admin
- **API call:** `POST /api/v1/auth/login` with `{email, password}`
- **Expected:** `200` with `{access_token, tenant_id, subdomain, requires_subscription: true}`
- **PASS:** Token returned, tenant_id matches Step 1
- **FAIL:** 401 (wrong credentials), 500

### Step 4: Check Auth Context
- **API call:** `GET /api/v1/auth/me` with `Authorization: Bearer {token}`
- **Expected:** `200` with `{id, email, tenant_id, is_tenant_admin: true, is_superuser: false}`
- **PASS:** tenant_id matches, is_tenant_admin = true
- **FAIL:** 401 (bad token), 500 (uuid.UUID bug)

### Step 5: Admin Login + Approve Tenant
- **API call:** `POST /api/v1/auth/bootstrap` (if no admin exists) or `POST /api/v1/auth/login` with admin creds
- **API call:** `POST /api/v1/tenants/{tenant_id}/approve` with admin token, body: `{"verification_notes": "Approved via smoketest"}`
- **Expected:** `200` with tenant `launch_status: "approved"`
- **PASS:** Status changes to approved
- **FAIL:** 403 (not superuser), 404 (tenant not found), 500

### Step 6: Launch Tenant (Queue Provisioning)
- **API call:** `POST /api/v1/tenants/{tenant_id}/launch` with admin token, body: `{"runner_id": null}`
- **Backend flow:** `assert_tenant_launch_ready()` → checks subscription (free_trial passes) → `select_runner_for_tenant()` → creates ProvisioningJob → `provision_tenant.delay()` (Celery)
- **Expected:** `200` with `{id, tenant_id, status: "queued", task_id}`
- **PASS:** Job created, status = queued, task_id present
- **FAIL:** 409 (not approved, or billing not ready), 500 (missing imports, no runner, Celery down)

### Step 7: Check Provisioning Job Status
- **API call:** `GET /api/v1/tenants/jobs/{job_id}` with admin token
- **Expected:** `200` with `{status: "queued" | "provisioning" | "active" | "failed"}`
- **PASS:** Job exists, status is one of valid values
- **FAIL:** 404 (job not found), 500

### Step 8: Get Tenant Status
- **API call:** `GET /api/v1/tenants/{tenant_id}/status` with admin token
- **Expected:** `200` with `{tenant_id, subdomain, company_name, launch_status, portal_url, console_url, api_url}`
- **PASS:** All fields present, launch_status reflects current state
- **FAIL:** 404, 500

### Step 9: Get Tenant Portal URL
- **API call:** `GET /api/v1/tenants/{tenant_id}/portal-url` with admin token
- **Expected:** `200` with `{tenant_id, subdomain, portal_url, custom_domain, custom_domain_verified}`
- **PASS:** portal_url = `https://efie-ne-fie.{DEFAULT_SUBDOMAIN_BASE}`
- **FAIL:** 404, 500

### Step 10: Manually Activate Tenant (if Celery not running)
- **API call:** `POST /api/v1/tenants/{tenant_id}/activate` with admin token
- **Expected:** `200` with `launch_status: "active"`
- **PASS:** Status = active
- **FAIL:** 404, 500

### Step 11: Manually Provision Fleetbase Org
- **API call:** `POST /api/v1/tenants/{tenant_id}/provision` with admin token
- **Backend flow:** `fleetbase_client.provision_org()` → stores org_id, api_key, admin_token, console_url, api_url
- **Expected:** `200` with tenant having `fleetbase_org_id`, `live_api_url`, `live_console_url`
- **PASS:** Fleetbase org provisioned, live_api_url set
- **FAIL:** 409 (already provisioned), 502 (Fleetbase API down)

### Step 12: Fetch Navigator Drivers
- **API call:** `GET /api/v1/navigator/{tenant_id}/drivers` with tenant admin token
- **Expected:** `200` with `{drivers: [...], tenant_id}` (or empty list with message if Fleetbase not ready)
- **PASS:** 200, no 500 even if Fleetbase unavailable
- **FAIL:** 500 (unhandled error), 404 (tenant not found)

### Step 13: Create Navigator Driver
- **API call:** `POST /api/v1/navigator/{tenant_id}/drivers` with tenant admin token, body: `{"name": "Kwame Mensah", "phone": "+233241234567"}`
- **Expected:** `200` with `{driver: {...}, tenant_id}` (or 409 if Fleetbase not provisioned)
- **PASS:** 200 with driver data, or 409 with clear message
- **FAIL:** 405 (no POST endpoint), 500

### Step 14: Fetch Tenant Analytics Dashboard
- **API call:** `GET /api/v1/analytics/{tenant_id}/dashboard` with tenant admin token
- **Expected:** `200` with `{tenant_id, company_name, shipments: {total, pending, delivered}, payments: {total, revenue}, vendors: {total, approved}}`
- **PASS:** 200, all sections present
- **FAIL:** 404 (endpoint missing), 403 (auth context), 500

### Step 15: Suspend Tenant
- **API call:** `POST /api/v1/tenants/{tenant_id}/suspend` with admin token
- **Expected:** `200` with `launch_status: "suspended"`
- **PASS:** Status = suspended
- **FAIL:** 404, 500

### Step 16: Activate Tenant (Restore from Suspend)
- **API call:** `POST /api/v1/tenants/{tenant_id}/activate` with admin token
- **Expected:** `200` with `launch_status: "active"`
- **PASS:** Status = active
- **FAIL:** 404, 500

### Step 17: Delete Tenant (Soft Delete)
- **API call:** `DELETE /api/v1/tenants/{tenant_id}` with admin token
- **Expected:** `200` with `{status: "deleted", tenant_id}`
- **PASS:** deleted_at set, launch_status = suspended
- **FAIL:** 404, 409 (already deleted), 500

### Step 18: Restore Tenant
- **API call:** `POST /api/v1/tenants/{tenant_id}/restore` with admin token
- **Expected:** `200` with `launch_status: "active"`, `deleted_at: null`
- **PASS:** Restored to active, deleted_at cleared
- **FAIL:** 404, 409 (not deleted), 500

### Step 19: Verify Storefront Page Loads
- **Frontend:** Go to `http://localhost:3002/store/efie-ne-fie`
- **Expected:** Page loads with "Efie ne Fie" branding, themed colors, no flash of unstyled content
- **PASS:** Company name shows, theme colors applied via SSR
- **FAIL:** Blank page, "Afruheritage" fallback (tenant not resolved), theme flash

### Step 20: Verify Tenant Lookup (Admin Support)
- **API call:** `GET /api/v1/tenants/lookup?slug=efie-ne-fie` with admin token
- **Expected:** `200` with tenant record
- **PASS:** Found by slug
- **FAIL:** 404, 500

---

## Summary Checklist

| Step | Description | Endpoint | Expected Status | PASS/FAIL |
|------|-------------|----------|-----------------|-----------|
| 1 | Register company | POST /auth/register | 200 | |
| 2 | Resolve tenant context | GET /tenant-context/{slug} | 200 | |
| 3 | Login as tenant admin | POST /auth/login | 200 | |
| 4 | Check auth context | GET /auth/me | 200 | |
| 5 | Admin approves tenant | POST /tenants/{id}/approve | 200 | |
| 6 | Launch tenant | POST /tenants/{id}/launch | 200 | |
| 7 | Check job status | GET /tenants/jobs/{id} | 200 | |
| 8 | Get tenant status | GET /tenants/{id}/status | 200 | |
| 9 | Get portal URL | GET /tenants/{id}/portal-url | 200 | |
| 10 | Activate tenant | POST /tenants/{id}/activate | 200 | |
| 11 | Provision Fleetbase | POST /tenants/{id}/provision | 200 | |
| 12 | Get navigator drivers | GET /navigator/{id}/drivers | 200 | |
| 13 | Create navigator driver | POST /navigator/{id}/drivers | 200/409 | |
| 14 | Analytics dashboard | GET /analytics/{id}/dashboard | 200 | |
| 15 | Suspend tenant | POST /tenants/{id}/suspend | 200 | |
| 16 | Activate from suspend | POST /tenants/{id}/activate | 200 | |
| 17 | Delete tenant | DELETE /tenants/{id} | 200 | |
| 18 | Restore tenant | POST /tenants/{id}/restore | 200 | |
| 19 | Storefront page | GET /store/{slug} (frontend) | 200 | |
| 20 | Admin lookup | GET /tenants/lookup?slug= | 200 | |
