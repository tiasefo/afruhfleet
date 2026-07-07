# Amooksco Fleetbase Provisioning Guide

## Tenant Information
- **Tenant ID:** e379f093-758e-4e5a-a313-842baadb2680
- **Company:** Amooksco Logistics
- **Slug:** amooksco-logistics
- **Contact:** admin@amooksco.com
- **Plan:** free_trial
- **Domain:** amooksco.com (custom domain)
- **Launch Status:** active
- **Current Fleetbase Status:** Not provisioned (fleetbase_org_id: null)

## Architecture Context
Afruheritage uses a **single shared Fleetbase instance** at http://10.0.0.115:8003 with org-level isolation. Each tenant gets a `fleetbase_org_id` for data separation within the shared instance.

## Implementation Order (Critical)

The provisioning must follow this specific order:

1. **Register Fleetbase Organization First** - Create the org in Fleetbase to obtain the `fleetbase_org_id` UUID
2. **Update Tenant Record** - Store the `fleetbase_org_id` in the tenant database record
3. **Implement Org-Level Filtering** - Update the Fleetbase proxy to use the org_id for data isolation (can be done later)

**Why This Order:**
- The proxy needs the `fleetbase_org_id` to exist in the database before it can use it for filtering
- Without the org ID, there's nothing to filter by
- The filtering logic depends on having the org ID available

**For Amooksco:**
- Steps 1-2 are required for basic functionality
- Step 3 (org filtering) is a platform-wide enhancement that can be implemented after Amooksco is provisioned
- Amooksco will work with the current shared-token approach even before org filtering is implemented

## Current Implementation Status
- ✅ Database schema supports `fleetbase_org_id` and `fleetbase_api_key`
- ✅ Basic Fleetbase proxy layer exists (`app/api/routes/fleetbase_proxy.py`)
- ✅ Shared API token architecture in place
- ❌ Org-level filtering not yet implemented in proxy
- ❌ Proxy doesn't use tenant's `fleetbase_org_id` for data isolation

## Problem
Amooksco Logistics is marked as "active" but cannot use their storefront because:
- No Fleetbase organization assigned (`fleetbase_org_id: null`)
- No Fleetbase API key (`fleetbase_api_key: null`)
- No live console URL (`live_console_url: null`)
- No live API URL (`live_api_url: null`)

## Solution Steps

### Step 1: Create Fleetbase Organization
**Action:** Create a new organization in the shared Fleetbase instance for Amooksco

**Method A: Via Fleetbase Console**
1. Access Fleetbase console at https://fleet.afruheritage.com
2. Login with admin credentials
3. Navigate to Organizations
4. Create new organization:
   - Name: "Amooksco Logistics"
   - Slug: "amooksco-logistics"
   - Contact: admin@amooksco.com
5. Save the generated `fleetbase_org_id`

**Method B: Via Fleetbase API**
```bash
curl -X POST http://10.0.0.115:8003/int/v1/organizations \
  -H "Authorization: Bearer YOUR_FLEETBASE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Amooksco Logistics",
    "slug": "amooksco-logistics",
    "contact_email": "admin@amooksco.com"
  }'
```

**Expected Output:**
```json
{
  "id": "generated-uuid-here",
  "name": "Amooksco Logistics",
  "slug": "amooksco-logistics",
  "contact_email": "admin@amooksco.com"
}
```

**Save the `id` field as the `fleetbase_org_id`**

---

### Step 2: Generate Fleetbase API Key for Tenant
**Action:** Create an API key for the Amooksco organization

**Method A: Via Fleetbase Console**
1. Navigate to the Amooksco organization
2. Go to API Keys section
3. Create new API key:
   - Name: "Afruheritage Platform Integration"
   - Permissions: Full access
4. Save the generated API key

**Method B: Via Fleetbase API**
```bash
curl -X POST http://10.0.0.115:8003/int/v1/api-keys \
  -H "Authorization: Bearer YOUR_FLEETBASE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Afruheritage Platform Integration",
    "organization_id": "FLEETBASE_ORG_ID_FROM_STEP_1",
    "permissions": ["full_access"]
  }'
```

**Expected Output:**
```json
{
  "id": "api-key-id",
  "key": "flb_live_XXXXXXXXXXXXXXXX",
  "secret": "encrypted-secret",
  "organization_id": "FLEETBASE_ORG_ID_FROM_STEP_1"
}
```

**Save the `key` field as the `fleetbase_api_key`**

---

### Step 3: Update Tenant Record in Database
**Action:** Update the Amooksco tenant record with Fleetbase details

**SQL Query:**
```sql
UPDATE tenants 
SET 
  fleetbase_org_id = 'FLEETBASE_ORG_ID_FROM_STEP_1',
  fleetbase_api_key = 'FLEETBASE_API_KEY_FROM_STEP_2',
  live_console_url = 'https://fleet.afruheritage.com',
  live_api_url = 'http://10.0.0.115:8003'
WHERE id = 'e379f093-758e-4e5a-a313-842baadb2680';
```

**Or via Control Plane API:**
```bash
curl -X PATCH http://localhost:8100/api/v1/tenants/e379f093-758e-4e5a-a313-842baadb2680 \
  -H "Authorization: Bearer YOUR_CONTROL_PLANE_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fleetbase_org_id": "FLEETBASE_ORG_ID_FROM_STEP_1",
    "fleetbase_api_key": "FLEETBASE_API_KEY_FROM_STEP_2",
    "live_console_url": "https://fleet.afruheritage.com",
    "live_api_url": "http://10.0.0.115:8003"
  }'
```

---

### Step 4: Verify Tenant Fleetbase Access
**Action:** Test that the tenant can access Fleetbase with their org ID

**Test Query:**
```bash
curl -X GET http://localhost:8100/api/v1/tenants/e379f093-758e-4e5a-a313-842baadb2680 \
  -H "Authorization: Bearer YOUR_CONTROL_PLANE_ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "id": "e379f093-758e-4e5a-a313-842baadb2680",
  "company_name": "Amooksco Logistics",
  "fleetbase_org_id": "FLEETBASE_ORG_ID_FROM_STEP_1",
  "fleetbase_api_key": "FLEETBASE_API_KEY_FROM_STEP_2",
  "live_console_url": "https://fleet.afruheritage.com",
  "live_api_url": "http://10.0.0.115:8003",
  ...
}
```

---

### Step 5: Configure Domain Routing
**Action:** Ensure amooksco.com routes to the shared Fleetbase instance

**Check DNS Configuration:**
```bash
dig amooksco.com
```

**Expected:** CNAME or A record pointing to your platform server

**If using Cloudflare:**
1. Login to Cloudflare
2. Navigate to amooksco.com zone
3. Ensure DNS records point to your platform
4. Verify SSL certificate is active

---

### Step 6: Test Tenant Storefront Access
**Action:** Verify the tenant can access their storefront

**Test 1: Admin Console Access**
1. Login as admin@amooksco.com / Afruheritage@1
2. Navigate to tenant dashboard
3. Verify Fleetbase integration is active

**Test 2: Public Storefront**
1. Access http://amooksco.com
2. Verify storefront loads
3. Verify it shows Amooksco branding

**Test 3: API Access**
```bash
curl -X GET http://10.0.0.115:8003/int/v1/organizations/FLEETBASE_ORG_ID \
  -H "Authorization: Bearer FLEETBASE_API_KEY"
```

---

### Step 7: Configure Tenant RBAC (Optional)
**Action:** Set up tenant users with appropriate roles

**Add Tenant Users:**
```bash
curl -X POST http://localhost:8100/api/v1/tenants/e379f093-758e-4e5a-a313-842baadb2680/users \
  -H "Authorization: Bearer YOUR_CONTROL_PLANE_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@amooksco.com",
    "role": "manager",
    "full_name": "User Name"
  }'
```

**Available Roles:**
- `manager` - Full tenant management
- `operator` - Shipment operations
- `viewer` - Read-only access
- `customer_service` - Support operations

---

### Step 8: Enable Feature Flags (Optional)
**Action:** Configure tenant-specific features

**Via Control Plane API:**
```bash
curl -X PATCH http://localhost:8100/api/v1/feature-flags/tenant/e379f093-758e-4e5a-a313-842baadb2680 \
  -H "Authorization: Bearer YOUR_CONTROL_PLANE_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "flags": {
      "advanced_analytics": true,
      "custom_branding": true,
      "api_access": true
    }
  }'
```

---

## Verification Checklist

- [ ] Fleetbase organization created
- [ ] Fleetbase API key generated
- [ ] Tenant record updated with fleetbase_org_id
- [ ] Tenant record updated with fleetbase_api_key
- [ ] Tenant record updated with live_console_url
- [ ] Tenant record updated with live_api_url
- [ ] DNS configuration verified
- [ ] SSL certificate active
- [ ] Admin can login to tenant dashboard
- [ ] Public storefront accessible
- [ ] API access verified
- [ ] Tenant users configured (if needed)
- [ ] Feature flags configured (if needed)

## Troubleshooting

### Issue: Tenant still shows fleetbase_org_id: null
**Solution:** Verify the database update was committed. Check the Control Plane API response.

### Issue: Storefront returns 404
**Solution:** Check DNS configuration and ensure domain routing is correct.

### Issue: API returns 401 Unauthorized
**Solution:** Verify the Fleetbase API key is valid and has proper permissions.

### Issue: Data isolation not working
**Solution:** Verify fleetbase_org_id is correctly set and Fleetbase is using org-level filtering.

## Rollback Plan

If issues occur:
1. Set tenant fleetbase_org_id back to null
2. Remove Fleetbase API key
3. Clear live_console_url and live_api_url
4. Contact tenant about temporary outage

## References

- Fleetbase API Documentation: http://10.0.0.115:8003/docs
- Control Plane API: http://localhost:8100/docs
- Admin Console: http://10.0.0.115:3001/sentinel/
- Shared Fleetbase Console: https://fleet.afruheritage.com
