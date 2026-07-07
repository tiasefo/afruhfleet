# TODO: Template Migration + Member Features + Bulk Goods Upload

> **REFERENCE THIS DOCUMENT EVERY 5 MINUTES TO STAY ON TRACK**

Created: Jul 2, 2026

---

## TRACK A: Storefront Template Migration

### A1. Extract and integrate 7 real templates from zip
- [ ] Copy 7 template preview pages to `frontend/app/templates/{bookings,ecommerce,fleet,freight,mall,realestate,restaurant}/page.tsx`
- [ ] Copy `lib/templates.ts` to `frontend/lib/templates.ts`
- [ ] Copy `components/template-preview-bar.tsx` to `frontend/components/template-preview-bar.tsx`
- [ ] Copy all `public/images/*-hero.png` (7 files) to `frontend/public/images/`
- [ ] Copy all `public/stock/*` (21 files) to `frontend/public/stock/`
- [ ] Copy all `public/vehicles/*` (6 files) to `frontend/public/vehicles/`

### A2. Replace 6 fake DB templates with 7 real ones
- [ ] Update `DEFAULT_TEMPLATES` in `app/api/routes/storefront_templates.py` — replace Azure/AWS/ServiceNow/Jira/Okta/Google with freight/fleet/ecommerce/mall/bookings/realestate/restaurant
- [ ] Write DB migration: DELETE 6 fake templates, INSERT 7 real ones with proper presets matching `lib/templates.ts` colors
- [ ] Update `frontend/components/auth/register-form.tsx:41` — default from `azure_cloud` to `freight`
- [ ] Update `admin-console/frontend/app/dashboard/templates/page.tsx:230` — placeholder from "azure_cloud" to "freight"
- [ ] Update `sentinel/frontend/app/dashboard/templates/page.tsx:226` — same

### A3. Template selection → auto-map API endpoints (WordPress-style)
- [ ] Research how WordPress handles theme switching (hooks, feature detection, fallbacks)
- [ ] Design endpoint mapping per template (each template declares which API endpoints it needs)
- [ ] On template selection: system checks if all required endpoints exist and are functional
- [ ] If endpoints missing: 
  - [ ] Report to admin console with details of missing endpoints
  - [ ] Tag tenant account to show admins which endpoints need fixing
  - [ ] Send tenant notification: "Some features may not work for 72 hours after template change"
- [ ] Template preview pages = preview-only demos (what tenant sees before selecting)
- [ ] After selection: system auto-maps API endpoints to storefront features

### A4. Copy admin console UI structure (replace mock data with real APIs)
- [ ] Copy `components/admin/admin-console.tsx` UI structure to frontend — replace mock data with real API calls
- [ ] Copy `components/admin/billing-panel.tsx` UI structure — wire to real billing API
- [ ] Copy `components/admin/crm-panel.tsx` UI structure — wire to real CRM API
- [ ] Do NOT copy `lib/admin-data.ts` mock data — replace with real API calls

---

## TRACK B: Member Profile + Bulk Goods Upload

### B1. Fix members page internal error for Amooskco
- [x] Investigated: API endpoints work fine (GET member, GET member shipments both return 200)
- [x] Root cause: `membersAPI.get(params.id)` calls `requireTenantId()` which reads `localStorage.getItem('tenant_id')`. If logged in as superuser (admin@afruheritage.com), `tenant_id` may not be set in localStorage, causing `requireTenantId()` to throw `ApiError('No tenant context found')`
- [ ] Fix: Member detail page at `frontend/app/members/[id]/page.tsx:47` should use `memberData.tenant_id` from the API response as fallback, OR the members list page should set `tenant_id` in localStorage when it loads
- [ ] Also: The member detail page uses `params.id` directly but in Next.js 15+ `params` is a Promise and needs to be awaited. Check if this is causing the "internal error"

### B2. Member profile page (per CONTRACT agreed Jul 1, 2026)
- [ ] Full profile detail: name, email, phone, company, notes, preferred_language, goods_description
- [ ] Shipment history table: tracking number, origin, destination, status, ETA
- [ ] Documents section
- [ ] Activity timeline
- [ ] Pull in existing platform features: tracking, tax/duty calculator — members can see and use them
- [ ] Login prompt for member access (member logs in with username + temporal password)

### B3. Members list table — show credentials column
- [ ] Add column showing registered member username = temporal password
- [ ] Columns: Name, Email, Phone, Role, Goods Description, Company, Status, Shipment Count, Created Date, Username, Temp Password
- [ ] Rows clickable → opens member profile page

### B4. Second bulk uploader — goods/shipping details
- [x] Found existing backend: `POST /api/v1/shipments/{tenant_id}/import/csv` at `app/api/routes/shipments.py:747` — imports shipment CSV with `group_member_name` auto-resolution
- [x] Found existing backend service: `import_shipments_csv()` at `app/services/shipment_service.py:974` — intelligently maps shipments to members by name, creates new members if not found
- [x] Frontend shipments page at `frontend/app/shipments/page.tsx:236-239` has an "Import" button but it's NOT WIRED — just a plain `<Button>` with no onClick handler
- [x] No dedicated shipments import page exists (unlike members which has `/members/import/page.tsx`)
- [ ] Create `frontend/app/shipments/import/page.tsx` — bulk goods/shipping CSV upload page (similar to members import page)
- [ ] CSV columns: tracking_number, sender_name, receiver_name, origin_city, destination_city, weight_kg, package_count, cargo_type, description, total_cost, group_member_name, etc.
- [ ] Upload should intelligently map to existing members by `group_member_name` (backend already does this)
- [ ] Preview screen before import (like members import page)
- [ ] Show which members will be tagged with which goods/tracking numbers

---

## TRACK C: Research WordPress Theme Model
- [x] WordPress uses `theme.json` for declaring theme settings/features (colors, typography, spacing, etc.)
- [x] WordPress uses `add_theme_support()` in `functions.php` to declare feature support (post-thumbnails, custom-logo, etc.)
- [x] WordPress plugin dependencies: `Requires Plugins` header in plugin file — comma-separated list of slugs
- [x] WordPress notifies admins via "admin notice" (banner at top of admin dashboard) when dependencies are missing
- [x] WordPress does NOT auto-install or auto-activate dependencies — just blocks activation and shows notice
- [x] No version control for dependencies — uses current version from repository
- [ ] Design our equivalent: Template Manifest
  - Each template declares `required_endpoints: [...]` in its preset/metadata
  - On template selection: system checks if all required endpoints exist and respond
  - Missing endpoints → admin console notification + tenant account tagged
  - Tenant gets notification: "Some features may not work for 72 hours after template change"
  - No auto-fix — manual intervention required (like WordPress)
  - Graceful degradation: storefront renders with fallback/placeholder for missing features

---

## NOTES
- Amooskco tenant ID: e379f093-758e-4e5a-a313-842baadb2680
- Frontend: http://localhost:3002
- API: http://localhost:8100/api/v1
- Admin Console API: http://localhost:4000/admin
- Zip location: docs/Afruheritage-Tenants-templates.zip
- Extracted to: /tmp/tenant-templates-extracted/
