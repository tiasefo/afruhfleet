# WordPress-like Template & Plugin System for Afruheritage

**Agreed: Jul 3, 2026**

---

## ARCHITECTURE CLARIFICATION

**Afruheritage is a SINGLE multi-tenant SaaS application (like Shopify), NOT a container orchestration platform.**

### Core Components
- **Afruheritage Control Plane** (`:8100`) — FastAPI backend for tenant management, billing, branding, templates
- **Afruheritage Frontend** (`:3002`) — Next.js tenant storefronts
- **Shared Fleetbase Instance** (`:8003`) — Single Fleetbase deployment for all tenants
- **PostgreSQL** — Single database with `tenant_id` on all tables for data isolation
- **Redis** — Celery queue for background tasks

### Fleetbase Integration
- **Single shared Fleetbase instance** at `http://10.0.0.115:8003`
- Each tenant gets a `fleetbase_org_id` (organization ID within Fleetbase)
- Afruheritage proxies requests to Fleetbase and scopes them by `company_uuid` parameter
- Data isolation is at the org level within Fleetbase, NOT at the container level
- Fleetbase handles: drivers, vehicles, fleets, orders, tracking
- Afruheritage handles: tenant accounts, billing, branding, templates, plugins

**"WordPress-like" refers ONLY to:**
1. Template/Theme system (visual layouts for storefronts)
2. Plugin/Extension system (feature toggles per tenant)
3. NOT to infrastructure or container orchestration

---

## 1. BACKEND: FastAPI Control Plane

### 1.1 Tenant Data Model
- `Tenant` — Tenant account (company_name, slug, contact_email, plan_code, domain, fleetbase_org_id)
- `TenantBranding` — Branding + feature flags per tenant (colors, logo, template_code, maps_enabled, etc.)
- `StorefrontTemplate` — Template definitions (template_code, name, description, preset JSON)
- All business tables (Shipment, GroupMember, etc.) have `tenant_id` FK for data isolation
- `fleetbase_org_id` links tenant to their organization within the shared Fleetbase instance

### 1.2 Template System
- 7 templates: freight, fleet, ecommerce, mall, bookings, restaurant, realestate
- Each template has a `preset` JSON manifest:
  - Colors (primary, secondary, accent, background)
  - Required endpoints (API routes the template needs)
  - Features (plugins the template requires)
  - Fallbacks (what to show if a feature is unavailable)
  - Import profile (column mappings for bulk import)
  - Storage fees flag (whether template supports storage fees)
- Template selection: `/api/v1/storefront-templates/select` — applies template to tenant branding

### 1.3 Plugin System (Hybrid Auto-Fix + User Consent)

### Hybrid Approach for Legal Protection
**Safe changes (auto-fix, no approval):**
- Enabling feature flags on TenantBranding (e.g., `maps_enabled=True`)
- Ensuring DB tables exist
- Mounting routes
- These are technical infrastructure changes

**Risky changes (require user/admin approval):**
- Business model changes (freight → mall template)
- Data migrations
- Feature deprecations
- These require explicit consent

### Plugin Catalog & Store
**Customer Storefront (`/settings/plugins`):**
- View all available plugins with descriptions
- See which plugins are currently enabled
- Install/uninstall plugins (with confirmation)
- View plugin status (healthy, needs attention)
- Audit trail of plugin changes

**Admin Console (`/dashboard/plugins`):**
- View all plugins across all tenants
- Force enable/disable plugins for specific tenants (support override)
- View plugin health across platform
- Audit trail of admin actions
- Bulk plugin operations

### Current 10 Plugins
| Plugin | Purpose | Risk Level |
|--------|---------|------------|
| `tracking_plugin.py` | Public tracking feature (`/track` endpoint) | Low |
| `bulk_import_plugin.py` | CSV/XLSX import (`/import/csv` endpoint) | Low |
| `ai_chat_plugin.py` | AI chat widget (`/ai/chat` endpoint) | Low |
| `members_plugin.py` | Group members feature (`/members` endpoint) | Low |
| `maps_plugin.py` | Map visualization (Fleetbase integration) | Low |
| `vendor_marketplace_plugin.py` | Vendor marketplace (`/vendors/*` endpoints) | Medium |
| `storage_fees_plugin.py` | Storage fee calculation | Low |
| `warehouse_plugin.py` | Warehouse notices | Low |
| `customs_plugin.py` | Customs calculator | Low |
| `bus_fleet_plugin.py` | Bus fleet management | Medium |

### Template Selection Flow with Safeguards
1. **User clicks new template** → Show confirmation dialog
2. **Dialog shows:**
   - Current template vs new template
   - Business model change warning
   - Features that will be enabled/disabled
   - "Cancel" or "Confirm Change" buttons
3. **On confirm:**
   - Auto-fix safe changes (feature flags, DB tables)
   - Track previous template for rollback
   - Send confirmation email
4. **Rollback:**
   - User can revert to previous template within 24 hours
   - Admin can force rollback for support cases

### 1.4 Key API Endpoints
- `GET /api/v1/storefront-templates` — List available templates
- `POST /api/v1/storefront-templates/select` — Select template for tenant (triggers auto-fix)
- `GET /api/v1/storefront-templates/admin/endpoint-health` — Admin: check all tenant endpoint health
- `GET /api/v1/storefront-templates/admin/{template_code}/manifest` — Admin: get template manifest
- `GET /api/v1/shipments/{tenant_id}` — List tenant shipments
- `POST /api/v1/shipments/{tenant_id}/import/csv` — Bulk import (XLSX+CSV)
- `GET /api/v1/shipments/{tenant_id}/members` — List tenant members
- `GET /api/v1/shipments/public/track/{tenant_id}/{tracking_number}` — Public tracking (unauthenticated)
- `GET /api/v1/fleetbase-tenant/*` — Proxy to shared Fleetbase, scoped by tenant's `fleetbase_org_id`

---

## 2. ADMIN CONSOLE: Platform Management

### 2.1 Software Operations Center (`/dashboard/operations`)
**A. Endpoint Health Monitor**
- Per-tenant health check for all plugins/features
- Shows which tenants have missing endpoints
- Expandable details per tenant

**B. Template Operations**
- View all 7 templates with their manifests
- See which tenants are using which template
- View template features, required endpoints, fallbacks
- View import profiles and storage fee flags

**C. Feature Management**
- Toggle features on/off per tenant
- Each toggle maps to a `TenantBranding` feature flag
- Changes take effect immediately

**D. Bulk Import Monitor**
- See all CSV/XLSX imports across all tenants
- Status: pending, processing, completed, failed
- View rows processed, errors, members tagged

**E. Tenant Change Log**
- Immutable audit trail of all tenant configuration changes
- Who changed what, when, old value → new value

### 2.2 Marketplace Admin Console (from extracted zip)
- Vendor management (approve/reject vendors)
- Review moderation
- Delivery GPS logs
- This is separate from Operations Center — it's for marketplace-specific admin

---

## 3. FRONTEND: Tenant Storefronts

### 3.1 Tenant Storefront Structure
- Each tenant accesses their storefront via subdomain or custom domain
- Frontend renders based on:
  - `TenantBranding` colors, logo, theme
  - Selected `template_code` (freight, fleet, etc.)
  - Enabled features (maps, tracking, etc.)
- All data is filtered by `tenant_id` from the backend

### 3.2 Template Preview Pages
- `/templates/{slug}` — Preview-only demo pages for each template
- Shows hero image, color swatches, features
- Tenants browse these before selecting a template
- NOT the live storefront — just the showroom

### 3.3 Template Selection in Settings
- `/settings` page has "Storefront Template" section
- Drawer shows all templates with:
  - Name, description
  - Color swatches
  - **TODO: Add hero image preview**
- Clicking a template selects it and triggers auto-fix

### 3.4 Key Frontend Pages
- `/shipments` — Shipment list with search/filter
- `/shipments/import` — Bulk goods upload (XLSX+CSV)
- `/members` — Group members list with credentials columns
- `/members/{id}` — Member profile with shipment history
- `/track` — Public tracking page (unauthenticated, bilingual)
- `/settings` — Tenant settings (branding, template, features)
- `/dashboard/operations` — Software Operations Center (admin only)

---

## 4. WHAT EACH TENANT GETS

### 4.1 Branded Storefront
- Custom logo, colors, theme based on selected template
- Custom domain or subdomain (e.g., `tenant.afruheritage.com`)
- Branded emails (from name, signature)
- Custom footer text, terms/privacy URLs

### 4.2 Data Isolation
- All their shipments (filtered by `tenant_id`)
- All their group members
- All their AI chat history
- All their support tickets
- All their billing records

### 4.3 Feature Access (via TenantBranding flags)
- Maps visualization (if `maps_enabled=True`)
- Public tracking (if `public_tracking_enabled=True`)
- Bulk CSV/XLSX import (if `csv_import_enabled=True`)
- Group members (if `group_members_enabled=True`)
- Storage fees (if `storage_fees_enabled=True`)
- Bus fleet management (if `bus_fleet_enabled=True`)

### 4.4 Template-Specific Features
- Freight template: Storage fees, bulk import, tracking
- Fleet template: Bus fleet management, vehicle tracking
- Ecommerce template: Product catalog, shopping cart
- Mall template: Multi-vendor marketplace
- Bookings template: Reservation system
- Restaurant template: Menu, table booking
- Realestate template: Property listings

---

## 7. IMPLEMENTATION CHECKLIST

### Phase 1: Template System (COMPLETED ✅)
- [x] SQL migration: Delete 6 fake templates, insert 7 real templates with manifests
- [x] Backend: Update DEFAULT_TEMPLATES list
- [x] Frontend: Copy 7 template preview pages
- [x] Frontend: Copy 7 hero images to `public/images/`
- [x] Frontend: Append 7 theme CSS classes to `globals.css`
- [x] Frontend: Fix template preview bar link
- [x] Frontend: Fix default template in register form

### Phase 2: Plugin Auto-Fix System (COMPLETED ✅)
- [x] Create `app/plugins/` with BasePlugin ABC
- [x] Create 10 plugins (tracking, bulk_import, ai_chat, members, maps, vendor_marketplace, storage_fees, warehouse, customs, bus_fleet)
- [x] Create `template_manifest_service.py` with health checking and auto-fix
- [x] Wire auto-fix into template selection endpoint
- [x] Add admin endpoints: `/admin/endpoint-health`, `/admin/{template_code}/manifest`
- [x] Add `bus_fleet_enabled` and `storage_fees_enabled` to TenantBranding model
- [x] DB migration for new TenantBranding fields

### Phase 3: Bulk Import (COMPLETED ✅)
- [x] Backend: Update `import_shipments_csv` to support XLSX
- [x] Backend: Add bilingual column mapping (EN/ZH)
- [x] Backend: Add CBM formula evaluation
- [x] Backend: Add shipping mark prefix stripping
- [x] Backend: Add storage fee fields to Shipment model
- [x] Backend: DB migration for storage fee fields
- [x] Frontend: Create `/shipments/import` page
- [x] Frontend: Wire dead Import button on `/shipments`

### Phase 4: Member Credentials (COMPLETED ✅)
- [x] Add `login_email` and `temp_password` to GroupMemberResponse schema
- [x] Update `_member_to_response` to pull from User model
- [x] Add Login Email and Temp Password columns to members list table
- [x] Update member detail page credentials section

### Phase 5: Operations Center (COMPLETED ✅)
- [x] Create `/dashboard/operations` page
- [x] Endpoint Health tab (per-tenant plugin health)
- [x] Template Operations tab (view manifests, features, endpoints)
- [x] Feature Management tab (redirects to endpoint health)
- [x] Bulk Import Monitor tab (recent imports from localStorage)

### Phase 6: Template Image Preview (PENDING ⬜)
- [ ] Add `image` column to `storefront_templates` table
- [ ] Update StorefrontTemplate model to include image field
- [ ] Update template selection drawer in settings to show hero images
- [ ] Populate image field from preset JSON for existing templates
- [ ] Rebuild frontend container

### Phase 7: Marketplace Admin Console (PENDING ⬜)
- [ ] Review extracted admin-console zip from `/tmp/tenant-templates-extracted/`
- [ ] Identify mock data in `admin-console/components/admin/admin-console.tsx`
- [ ] Wire vendor management to real vendor endpoints (`/vendors/admin/*`)
- [ ] Wire review moderation to real review endpoints
- [ ] Wire delivery logs to real tracking endpoints
- [ ] Replace mock data arrays with real API calls
- [ ] Test admin console with real data

### Phase 8: Main Platform Landing Page Redesign (PENDING ⬜)
- [ ] Review `/tmp/tenant-templates-extracted/app/page.tsx` (new landing page design)
- [ ] Copy to `frontend/app/page.tsx` (replace current landing page)
- [ ] Update navigation links to match current routes
- [ ] Wire metrics/stats to real data (or remove if not available)
- [ ] Ensure template section links to `/templates`
- [ ] Test landing page rendering

### Phase 9: Marketplace Page Redesign (PENDING ⬜)
- [ ] Review `/tmp/tenant-templates-extracted/app/marketplace/page.tsx` (new marketplace design)
- [ ] Copy to `frontend/app/marketplace/page.tsx` (create new page)
- [ ] Copy required components from `/tmp/tenant-templates-extracted/components/`
- [ ] Wire vendor marketplace to real `/vendors/marketplace` endpoint
- [ ] Wire booking stats to real data
- [ ] Replace mock booking data with real API calls
- [ ] Test marketplace page

### Phase 10: Legacy Code Cleanup (COMPLETED ✅)
- [x] Remove `app/services/fleetbase_provisioner.py` (SSH-based provisioning)
- [x] Remove `app/models/fleetbase_runtime.py` (per-tenant runtime tracking)
- [x] Remove `app/models/runner.py` (runner node management)
- [x] Update WORDPRESS_LIKE_SYSTEM_SPEC.md with correct architecture (shared Fleetbase + org-level scoping)

### Phase 11: Template Selection Safeguards (PENDING ⬜)
- [ ] Add template confirmation dialog with business model warning
- [ ] Track previous template code for rollback
- [ ] Add rollback button in template drawer
- [ ] Send confirmation email on template change
- [ ] Add 24-hour rollback window
- [ ] Add admin override for forced template changes

### Phase 12: Plugin Catalog in Customer Storefront (PENDING ⬜)
- [ ] Create `/settings/plugins` page
- [ ] Backend: Add plugin list endpoint (`GET /api/v1/plugins`)
- [ ] Backend: Add plugin install/uninstall endpoints
- [ ] Frontend: Show all available plugins with descriptions
- [ ] Frontend: Show currently enabled plugins
- [ ] Frontend: Install/uninstall with confirmation
- [ ] Frontend: Show plugin health status
- [ ] Frontend: Audit trail of plugin changes

### Phase 13: Plugin Management in Admin Console (PENDING ⬜)
- [ ] Create `/dashboard/plugins` page
- [ ] Backend: Add admin plugin list endpoint (all tenants)
- [ ] Backend: Add admin force enable/disable endpoint
- [ ] Frontend: View all plugins across all tenants
- [ ] Frontend: Force enable/disable plugins per tenant
- [ ] Frontend: View plugin health across platform
- [ ] Frontend: Audit trail of admin plugin actions
- [ ] Frontend: Bulk plugin operations

### Phase 14: Extract Amooksco Template (PENDING ⬜)
- [ ] Review Amooksco frontend in `frontend/components/tenant-themes/amooksco-v2/`
- [ ] Extract hero image and styling
- [ ] Add `amooksco` template to database
- [ ] Add template preview page
- [ ] Mark as custom template or available to all

---

## 8. REFERENCES

- Template contract: `CONTRACT_TEMPLATE_OPERATIONS.md`
- Template SQL migration: `database/migrations/20260702_real_templates.sql`
- Plugin directory: `app/plugins/`
- Template manifest service: `app/services/template_manifest_service.py`
- Template preview pages: `frontend/app/templates/{slug}/page.tsx`
- Hero images: `frontend/public/images/*-hero.png`
- Operations Center: `frontend/app/dashboard/operations/page.tsx`
- Fleetbase tenant proxy: `app/api/routes/fleetbase_tenant_proxy.py`
- Shared Fleetbase: `http://10.0.0.115:8003`
