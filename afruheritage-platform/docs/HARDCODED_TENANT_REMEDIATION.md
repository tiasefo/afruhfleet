# Hardcoded Tenant Remediation: Dependency Map & Migration Plan

**Date:** July 12, 2026  
**Status:** Planning — no deletions yet  
**Scope:** All hardcoded AMOOKSCO references in the frontend  

---

## 1. Inventory Summary

| Category | Files | Location | Status |
|---|---|---|---|
| Tenant-specific route | 6 | `frontend/app/amooksco-storefront/` | Must be removed |
| Tenant-specific components (v2) | 10 | `frontend/components/amooksco-v2/` | Must be removed |
| Tenant-specific theme components | 11 | `frontend/components/tenant-themes/amooksco-v2/` | Must be removed |
| Tenant-specific template | 12 | `frontend/templates/amooksco/` | Must be removed |
| Hardcoded tenant identity | 1 | `frontend/lib/amooksco.ts` | Must be migrated to DB |
| Registry with tenant name | 1 | `frontend/lib/templates.ts` | Must be cleaned |
| Template loader with tenant switch | 1 | `frontend/lib/template-loader.ts` | Must be cleaned |
| Theme registry with tenant conditional | 1 | `frontend/lib/tenant-theme-registry.ts` | Must be cleaned |
| **Total** | **43 files** | | |

**Backend:** Zero hardcoded tenant references. The Python backend is clean.

---

## 2. Dependency Map

### Layer 0: Hardcoded Identity Source

```
frontend/lib/amooksco.ts  (114 lines)
├── exports: brand, whatsapp, contacts, billingStaff, momo, services, navLinks, waLink
└── Contains: company name, logo path, tagline, motto, WhatsApp numbers,
              contact staff names, billing staff ranges, MoMo merchant details,
              services list, nav links
```

**Migration target:** `tenant_branding.storefront_config` (JSON column) + existing `tenant_branding` fields (`company_name`, `logo_url`, `tagline`, `support_email`, `support_phone`, `primary_color`, `accent_color`, etc.)

### Layer 1: Direct Importers of `lib/amooksco.ts`

These files import directly from `@/lib/amooksco`:

| File | What it uses | Used by |
|---|---|---|
| `frontend/app/amooksco-storefront/page.tsx` | Components only (not amooksco.ts directly) | Route entry |
| `frontend/app/amooksco-storefront/login/page.tsx` | `brand` | Login page |
| `frontend/app/amooksco-storefront/signup/page.tsx` | `brand` | Signup page |
| `frontend/components/amooksco-v2/site-header.tsx` | `brand`, `navLinks`, `waLink`, `whatsapp` | Header |
| `frontend/components/amooksco-v2/site-footer.tsx` | `brand`, `contacts`, `services`, `waLink`, `whatsapp` | Footer |
| `frontend/components/amooksco-v2/home/cta.tsx` | `brand`, `waLink`, `whatsapp` | Home CTA |
| `frontend/components/amooksco-v2/home/estimator.tsx` | `brand` | Home estimator |
| `frontend/components/amooksco-v2/home/hero.tsx` | `brand` | Home hero |
| `frontend/components/amooksco-v2/home/notices.tsx` | `brand` | Home notices |
| `frontend/components/amooksco-v2/home/payments.tsx` | `momo`, `brand` | Home payments |
| `frontend/components/amooksco-v2/home/services.tsx` | `services` | Home services |
| `frontend/components/amooksco-v2/home/track.tsx` | `waLink`, `whatsapp` | Home track |
| `frontend/components/amooksco-v2/home/workflow.tsx` | `brand` | Home workflow |
| `frontend/components/tenant-themes/amooksco-v2/site-header.tsx` | `brand`, `navLinks`, `waLink`, `whatsapp` | Theme header |
| `frontend/components/tenant-themes/amooksco-v2/site-footer.tsx` | `brand`, `contacts`, `services`, `waLink`, `whatsapp` | Theme footer |
| `frontend/components/tenant-themes/amooksco-v2/home/cta.tsx` | `brand`, `waLink`, `whatsapp` | Theme CTA |
| `frontend/components/tenant-themes/amooksco-v2/pages/about.tsx` | `brand` | About page |
| `frontend/components/tenant-themes/amooksco-v2/pages/cookies.tsx` | `brand` | Cookies page |
| `frontend/components/tenant-themes/amooksco-v2/pages/privacy.tsx` | `brand` | Privacy page |
| `frontend/components/tenant-themes/amooksco-v2/pages/support.tsx` | `brand`, `waLink`, `whatsapp` | Support page |
| `frontend/components/tenant-themes/amooksco-v2/pages/new-arrivals.tsx` | `brand` | New arrivals |
| `frontend/templates/amooksco/components/site-header.tsx` | `brand`, `navLinks`, `waLink`, `whatsapp` | Template header |
| `frontend/templates/amooksco/components/site-footer.tsx` | `brand`, `contacts`, `services`, `waLink`, `whatsapp` | Template footer |
| `frontend/templates/amooksco/components/home/*.tsx` (8 files) | Various from amooksco.ts | Template home sections |
| `frontend/templates/amooksco/components/auth-form.tsx` | `brand` | Auth form |
| `frontend/templates/amooksco/components/chat-widget.tsx` | `brand` | Chat widget |

### Layer 2: Route Consumers

**Hardcoded route** — `frontend/app/amooksco-storefront/`:
```
amooksco-storefront/
├── page.tsx          → imports from components/amooksco-v2/ (10 components)
├── about/page.tsx    → imports from components/amooksco-v2/ 
├── gallery/page.tsx  → imports from components/amooksco-v2/
├── login/page.tsx    → imports from lib/amooksco (brand)
├── signup/page.tsx   → imports from lib/amooksco (brand)
└── new-arrivals/page.tsx → imports from components/amooksco-v2/
```

**Generic route** — `frontend/app/store/[slug]/` (the replacement system):
```
store/[slug]/
├── page.tsx          → resolveTenantTheme() → FreightStorefront | FleetStorefront | GenericStorefront
├── about/page.tsx    → resolveTenantTheme() → AmooskcoAbout (HARDCODED) | GenericPage
├── cookies/page.tsx  → resolveTenantTheme() → AmooskcoCookies (HARDCODED) | GenericPage
├── new-arrivals/page.tsx → resolveTenantTheme() → AmooskcoNewArrivals (HARDCODED) | GenericPage
├── privacy/page.tsx  → resolveTenantTheme() → AmooskcoPrivacy (HARDCODED) | GenericPage
└── support/page.tsx  → resolveTenantTheme() → AmooskcoSupport (HARDCODED) | GenericPage
```

**Problem:** The generic `/store/[slug]` pages still have `if (theme.themeCode === 'amooksco-v2')` conditionals that import from `tenant-themes/amooksco-v2/`. These must be removed so all tenants use the generic path.

### Layer 3: Registry / Loader Files

**`frontend/lib/tenant-theme-registry.ts`:**
- `TenantThemeCode` type includes `'amooksco-v2'` — must be removed
- `resolveTenantThemeFromContext()` has `if ctx.theme_code === 'amooksco' || ctx.theme_code === 'amooksco-v2'` → must map to `'freight'` instead
- The function already has a fallback to `'default'` for unknown codes

**`frontend/lib/template-loader.ts`:**
- Imports `AmookscoStorefront` from `templates/amooksco/`
- `switch (templateCode) { case "amooksco": return AmookscoStorefront }` — must be removed
- Already has `default: return DefaultStorefront` fallback

**`frontend/lib/templates.ts`:**
- First entry: `{ slug: "amooksco", name: "Amooksco", ... }` — must be removed
- Remaining entries (fleet, freight, ecommerce, mall, bookings, restaurant, realestate) are correct engine types

**`frontend/middleware.ts`:**
- Line 119: comment mentions "amooksco" as an example of subdomain extraction — harmless but should be updated to a generic example

**`frontend/lib/tenant-context.ts`:**
- No direct amooksco references found in grep (the grep hit was from a comment in middleware.ts, not this file)

### Layer 4: What Already Works (The Replacement System)

**Generic storefront components** — `frontend/components/generic-storefront/`:
```
generic-storefront/
├── index.tsx          → GenericStorefront (reads from useTenant() context)
├── generic-page.tsx   → GenericPage (title + children, uses theme colors)
├── site-header.tsx    → SiteHeader (companyName, logoUrl, primaryColor props)
├── site-footer.tsx    → SiteFooter (companyName, supportEmail, supportPhone props)
└── track-shipment.tsx → TrackShipment (primaryColor prop)
```

**Engine templates** — `frontend/templates/freight/` and `frontend/templates/fleet/`:
- These are the correct pattern: engine-named, data-driven, accept `TenantPublicTheme` prop
- `FreightStorefront` and `FleetStorefront` components already exist and work

**Tenant context system:**
- `frontend/lib/tenant.ts` — resolves tenant ID from hostname, path, cookie, query param
- `frontend/components/tenant-context-provider.tsx` — fetches tenant context from API
- `frontend/lib/tenant-theme-registry.ts` — resolves theme from API response
- `frontend/components/tenant-public/tenant-public-shell.tsx` — wraps pages with CSS variables

**Backend support:**
- `GET /api/v1/tenant-context/{slug}` — returns full tenant branding context
- `tenant_branding` table — has `storefront_config` JSON column for tenant-specific content
- `tenant_branding.template_code` — stores the engine type (freight, fleet, etc.)

---

## 3. Data Migration: `lib/amooksco.ts` → Database

The following data from `lib/amooksco.ts` must be moved to the database before the file can be deleted:

| Data in `amooksco.ts` | Database target | Already exists? |
|---|---|---|
| `brand.name` | `tenant_branding.company_name` | YES |
| `brand.tagline` | `tenant_branding.tagline` | YES |
| `brand.logo` | `tenant_branding.logo_url` | YES |
| `brand.domain` | `tenant.custom_domain` or `tenant.requested_domain` | YES |
| `brand.motto` | `tenant_branding.storefront_config.motto` | NO — add to JSON |
| `brand.headline` | `tenant_branding.storefront_config.headline` | NO — add to JSON |
| `brand.group` | `tenant_branding.legal_company_name` | YES |
| `brand.platform` | Not needed — use `company_name` | N/A |
| `brand.platformBy` | `tenant_branding.legal_footer_text` | YES |
| `whatsapp.tracking` | `tenant_branding.storefront_config.whatsapp_tracking` | NO — add to JSON |
| `whatsapp.general` | `tenant_branding.storefront_config.whatsapp_general` | NO — add to JSON |
| `contacts.tracking.*` | `tenant_branding.storefront_config.contacts` | NO — add to JSON |
| `contacts.general.*` | `tenant_branding.storefront_config.contacts` | NO — add to JSON |
| `billingStaff[]` | `tenant_branding.storefront_config.billing_staff` | NO — add to JSON |
| `momo.*` | `tenant_branding.storefront_config.payment` | NO — add to JSON |
| `services[]` | `tenant_branding.storefront_config.services` | NO — add to JSON |
| `navLinks[]` | Hardcode in engine template (same for all tenants) | N/A — engine-level |
| `waLink()` | Utility function — move to `lib/utils.ts` | N/A — shared util |

**Action required:** Write a one-time migration script that reads the current `amooksco.ts` values and writes them to the `tenant_branding.storefront_config` JSON column for the AMOOKSCO tenant.

---

## 4. Migration Plan

### Phase 0: Data Migration (no code deletion)

**Goal:** Move all AMOOKSCO identity data from `lib/amooksco.ts` into the database so the frontend can read it from the API.

1. **Write a Python migration script** that:
   - Reads the AMOOKSCO tenant record from the database
   - Populates `tenant_branding.storefront_config` with: motto, headline, whatsapp numbers, contacts, billing staff, MoMo payment details, services list
   - Sets `tenant_branding.template_code` to `"freight"` (not `"amooksco"`)
   - Verifies existing fields (company_name, tagline, logo_url, colors, support_email, support_phone) are correct

2. **Add `storefront_config` to the tenant-context API response** so the frontend can access it via `useTenant()`.

3. **Move `waLink()` to `frontend/lib/utils.ts`** — it's a pure utility function (`https://wa.me/{number}?text={message}`) with no tenant-specific logic.

4. **Verify:** `GET /api/v1/tenant-context/amooksco-logistics` returns all data that was previously in `amooksco.ts`.

### Phase 1: Clean the Generic Route (no file deletion)

**Goal:** Remove all `amooksco-v2` conditionals from the generic `/store/[slug]` pages so they serve all tenants through the engine system.

1. **`frontend/lib/tenant-theme-registry.ts`:**
   - Remove `'amooksco-v2'` from `TenantThemeCode` type
   - In `resolveTenantThemeFromContext()`: map `theme_code === 'amooksco' || 'amooksco-v2'` to `'freight'` instead of `'amooksco-v2'`
   - The function already falls through to `'default'` for unknown codes

2. **`frontend/app/store/[slug]/page.tsx`:**
   - Already correct — no amooksco conditional (uses `freight`, `fleet`, `default`)

3. **`frontend/app/store/[slug]/about/page.tsx`:**
   - Remove `import { AmooskcoAbout }` 
   - Remove `if (theme.themeCode === 'amooksco-v2')` block
   - Keep only the `GenericPage` fallback path

4. **`frontend/app/store/[slug]/{cookies,new-arrivals,privacy,support}/page.tsx`:**
   - Same pattern: remove amooksco import, remove conditional, keep generic path

5. **`frontend/lib/templates.ts`:**
   - Remove the `{ slug: "amooksco", name: "Amooksco", ... }` entry
   - Keep all engine-type entries (freight, fleet, ecommerce, etc.)

6. **`frontend/lib/template-loader.ts`:**
   - Remove `import AmookscoStorefront`
   - Remove `case "amooksco": return AmookscoStorefront`
   - Keep `default: return DefaultStorefront`

7. **`frontend/middleware.ts`:**
   - Update comment on line 119 to use a generic example (e.g., "mycompany" instead of "amooksco")

8. **Verify:** Navigate to `/store/amooksco-logistics` — should render via `FreightStorefront` or `GenericStorefront` with branding from API.

### Phase 2: Delete Hardcoded Tenant Code

**Goal:** Remove all 43 files that contain hardcoded AMOOKSCO references.

**Deletion order (dependents first, dependencies last):**

**Step 1 — Delete the hardcoded route (6 files):**
```
rm -r frontend/app/amooksco-storefront/
```

**Step 2 — Delete tenant-specific components (10 files):**
```
rm -r frontend/components/amooksco-v2/
```

**Step 3 — Delete tenant-specific theme components (11 files):**
```
rm -r frontend/components/tenant-themes/amooksco-v2/
```

**Step 4 — Delete tenant-specific template (12 files):**
```
rm -r frontend/templates/amooksco/
```

**Step 5 — Delete the hardcoded identity file (1 file):**
```
rm frontend/lib/amooksco.ts
```

**Step 6 — Verify no broken imports remain:**
```bash
grep -rln "amooksco" frontend/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v .next
```
Expected: 0 results (or only harmless comments in middleware.ts that were already cleaned in Phase 1).

**Step 7 — Build verification:**
```bash
cd frontend && npm run build
```
Must succeed with zero errors.

### Phase 3: Engine Enhancement (optional, post-cleanup)

**Goal:** Ensure the `FreightStorefront` engine template provides the same richness that the AMOOKSCO-specific components had, but driven entirely by API data.

1. **Enhance `FreightStorefront`** to read from `storefront_config`:
   - Services list (from `storefront_config.services`)
   - Payment details (from `storefront_config.payment`)
   - Contact staff (from `storefront_config.contacts`)
   - WhatsApp links (from `storefront_config.whatsapp_*`)
   - Billing staff ranges (from `storefront_config.billing_staff`)

2. **Enhance `GenericStorefront`** with the same data-driven patterns as a fallback.

3. **Add `storefront_config` to the `TenantContext` TypeScript interface** in `frontend/lib/tenant-context.ts`.

4. **Add `storefront_config` to the `TenantPublicTheme` type** in `frontend/lib/tenant-theme-registry.ts`.

---

## 5. Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| AMOOKSCO storefront breaks after Phase 1 | Medium | Test `/store/amooksco-logistics` before and after; data must be in DB first (Phase 0) |
| Broken imports cause build failure | Low | Phase 2 Step 6 catches this; fix any stragglers before build |
| `storefront_config` JSON shape doesn't match what frontend expects | Medium | Define TypeScript interface in Phase 3; validate in Phase 0 |
| Other tenants using `template_code: "amooksco"` break | Low | Phase 1 Step 1 maps `amooksco` → `freight` in the theme registry |
| `waLink()` utility is lost | Low | Phase 0 Step 3 moves it to `lib/utils.ts` before deletion |

---

## 6. Verification Checklist

After all phases complete:

- [ ] `grep -rn "amooksco" frontend/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v .next` returns 0 results
- [ ] `grep -rn "amooksco" frontend/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v .next | grep -v middleware` returns 0 results
- [ ] `cd frontend && npm run build` succeeds
- [ ] `/store/amooksco-logistics` renders with correct branding (logo, colors, company name)
- [ ] `/store/amooksco-logistics/about` renders generic about page with AMOOKSCO branding
- [ ] `/store/amooksco-logistics/support` renders generic support page with AMOOKSCO contacts
- [ ] `/store/metromass-transit` renders with MetroMass branding
- [ ] No `if tenant == "amooksco"` or `switch tenant` patterns remain anywhere
- [ ] `lib/amooksco.ts` does not exist
- [ ] `app/amooksco-storefront/` directory does not exist
- [ ] `components/amooksco-v2/` directory does not exist
- [ ] `templates/amooksco/` directory does not exist
- [ ] `components/tenant-themes/amooksco-v2/` directory does not exist
- [ ] `tenant-theme-registry.ts` has no `'amooksco-v2'` in `TenantThemeCode` type
- [ ] `templates.ts` has no amooksco entry
- [ ] `template-loader.ts` has no amooksco import or case
