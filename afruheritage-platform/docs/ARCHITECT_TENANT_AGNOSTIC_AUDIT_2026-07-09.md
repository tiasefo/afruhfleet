# Tenant-Agnostic Platform Audit — Amooksco Hardcode Sweep

**Date:** 9 July 2026, 04:05 UTC  
**From:** Engineering (Cascade AI Pair Programmer)  
**Re:** Verify whether the platform is genuinely tenant-agnostic or still carries Amooksco-specific defaults

---

## Executive Summary

The platform is **not yet tenant-agnostic** in the storefront/auth-rendering layer. While the backend tenant model and API routing are generic, several **platform-wide code paths contain Amooksco-specific defaults or fallbacks** that would break, render the wrong tenant, or return 404 for any tenant other than `amooksco-logistics`.

The most critical findings are in **Category B** below.

**Step 2 (run a different tenant through the same flows) could not be executed live** because the local Docker stack is currently down (only `afruheritage-redis` is running; `afruheritage-api` and `afruheritage-frontend` are not). However, the code evidence in Category B already answers the question conclusively.

---

## Step 1 — Full-Codebase Grep Results

### Search methodology

```bash
cd /home/afruheritage/fleetbase/afruhfleet/afruheritage-platform
grep -rniE "amooskco|amooksco" \
  --include="*.py" --include="*.ts" --include="*.tsx" \
  --include="*.yml" --include="*.yaml" --include="*.mjs" \
  --include="*.css" --include="*.json" --include="*.sh" . \
  | grep -v node_modules | grep -v ".git/" \
  | grep -v "^\./reports/" \
  | grep -v "^\./tenant-theme-sources/" \
  | grep -v "^\./backups/" \
  | grep -v "^\./frontend/\.next/" \
  | grep -v "^\./admin-console/\.next/"
```

Excluded directories are build artifacts (`frontend/.next`, `admin-console/.next`), historical backups (`backups/`), design/source snapshots (`tenant-theme-sources/`), and generated reports (`reports/`). These contain copies of the same Amooksco assets but are not executed code.

**Raw active-code hit count:** 440 lines across 4 major areas:

| Area | Approx. lines | Classification |
|------|---------------|----------------|
| Frontend tenant-theme assets (`frontend/components/amooksco-v2`, `frontend/components/tenant-themes/amooksco-v2`, `frontend/templates/amooksco`, `frontend/lib/amooksco.ts`, `frontend/styles/tenants/amooksco.css`) | ~300 | **(A) Legitimate tenant data** — these are the Amooksco-branded template files themselves. |
| Admin-console analysis copy (`admin-console/frontend/amooksco-template-analysis/`) | ~90 | **(A) Legitimate tenant data** — a copied analysis snapshot, not active in production builds. |
| Operational/import scripts (`scripts/uat_amooskco.py`, `scripts/import_amooksco_*.py`, `scripts/fix_amooksco_subscription.py`, `scripts/afruheritage_e2e_status_audit.sh`, etc.) | ~40 | **(A) Legitimate tenant data** — scripts that target the Amooksco tenant for testing/import. |
| **Platform-wide files that hardcode Amooksco** | **~10 files** | **(B) Leaked into tenant-agnostic code** — see detailed table below. |

### Category B — Platform-wide code with Amooksco-specific defaults (the real problem)

| # | File | Line(s) | What it does | Why it breaks tenant-agnostic behavior |
|---|------|---------|--------------|------------------------------------------|
| 1 | `frontend/lib/tenant-theme-registry.ts` | 1, 17-30 | `TenantThemeCode` is only `'amooksco-v2' \| 'default'`, and `resolveTenantTheme()` returns a real theme **only** for `slug === 'amooksco-logistics'`. Any other slug returns `null`. | The generic `/store/[slug]` route cannot render any tenant except Amooksco. |
| 2 | `frontend/app/store/[slug]/page.tsx` | 12-24 | Calls `resolveTenantTheme(slug)` and returns `notFound()` if the theme is missing. Only the `amooksco-v2` branch has a rendered page. | Every other store slug returns 404. |
| 3 | `frontend/app/storefront/page.tsx` | 1-54 | Hard-imports and renders `templates/amooksco/...` components for **all** users. Comment says `// Render Amooksco template directly`. | The platform-wide `/storefront` page is permanently Amooksco-branded regardless of tenant. |
| 4 | `frontend/components/tenant-storefront.tsx` | 1-60 | Same hardcoded Amooksco template; also requires auth before showing the storefront. | Authenticated tenants see Amooksco branding; unauthenticated users are sent away. |
| 5 | `frontend/app/sign-up/page.tsx` | 1-14 | Uses `@/templates/amooksco/components/auth-form` and metadata `Sign Up | AMOOKSCO`. | The platform registration page is Amooksco-branded. |
| 6 | `frontend/app/sign-in/page.tsx` | 1-14 | Uses `@/templates/amooksco/components/auth-form` and metadata `Sign In | AMOOKSCO`. | The platform login page is Amooksco-branded. |
| 7 | `frontend/app/layout.tsx` | 11 | Imports `@/styles/tenants/amooksco.css` into the **root** layout for every page. | Amooksco CSS variables/theme leak onto every tenant and every route. |
| 8 | `frontend/templates/amooksco/components/home/track.tsx` | 75 | `api.get(/shipments/public/track/${tenant?.id \|\| 'amooksco'}/${key})` | If tenant context is missing, tracking falls back to the Amooksco tenant ID, leaking cross-tenant lookups. |
| 9 | `app/plugins/amooksco_template_plugin.py` | 14-137 | A dedicated plugin named `amooksco_template` that enables Amooksco-specific features and sets `theme_class = "theme-amooksco"`. | The plugin system has a special-case plugin for one tenant/template. |
| 10 | `app/services/shipment_service.py` | 1049 | `_strip_shipping_mark_prefix(name, prefix: str = "AMOOKSCO")` | CSV import assumes the default shipping-mark prefix is `AMOOKSCO` for all tenants. |
| 11 | `frontend/app/amooksco-storefront/*` (all pages under this route) | multiple | A top-level route namespace specifically for Amooksco. | The platform exposes a dedicated `/amooksco-storefront` path that only makes sense for one tenant. |
| 12 | `frontend/middleware.ts` | 67 | `/amooksco-storefront/` is in the public allowlist. | The middleware explicitly knows about the Amooksco-only route (necessary because the route exists, but it is a symptom of #11). |

### Category A — Legitimate tenant data / expected references

These are **not bugs**. They exist because Amooksco is a real customer/template in the system.

| Area | Representative files | Why it's fine |
|------|----------------------|---------------|
| Amooksco v2 theme components | `frontend/components/amooksco-v2/**/*`, `frontend/components/tenant-themes/amooksco-v2/**/*`, `frontend/templates/amooksco/**/*` | Tenant-specific template assets. Correctly isolated when selected by tenant. |
| Amooksco brand data | `frontend/lib/amooksco.ts` | Central brand/contact config for the Amooksco template. |
| Amooksco styles | `frontend/styles/tenants/amooksco.css` | Tenant-specific CSS, harmless when loaded conditionally. |
| Amooksco operational scripts | `scripts/uat_amooskco.py`, `scripts/import_amooksco_*.py`, `scripts/fix_amooksco_subscription.py` | Scripts that intentionally operate on the Amooksco tenant. |
| Default template catalog | `app/api/routes/storefront_templates.py` | Includes `amooksco` alongside `freight`, `fleet`, `ecommerce`, `mall`, etc. This is the intended multi-tenant catalog. |
| Backend comment/example | `app/api/routes/tenant_context.py` | Only mentions `amooksco` as a subdomain example in comments. |
| Page generator manifest | `app/services/page_generator_service.py` | Includes `amooksco`, `freight`, `basic` template manifests. Generic. |
| Admin console placeholder | `admin-console/frontend/components/branding-drawer.tsx` | Placeholder text only. |
| Admin console analysis copy | `admin-console/frontend/amooksco-template-analysis/**/*` | Inert analysis snapshot. |

### Category C — Unclear / needs judgment

| File | Line(s) | Why it's unclear |
|------|---------|------------------|
| `frontend/middleware.ts` | 67 | `/amooksco-storefront/` is in the public allowlist. This is not a hidden default, but the existence of a tenant-named top-level route suggests the storefront routing is still a work-in-progress. Needs product decision on whether to keep `/amooksco-storefront` as a legacy demo route or delete it. |

---

## Step 2 — Testing a Different Tenant

**Status:** Could not run live because the local stack is not currently running.

```
Container status:
- afruheritage-redis      Up 2 weeks (healthy)
- afruheritage-api        NOT RUNNING
- afruheritage-frontend   NOT RUNNING
- afruheritage-postgres   NOT RUNNING (fleetbase-database is a separate service)
```

The platform cannot be started in its current state without a rebuild/restart. Because the user requested this grep **before** rebuilding, I stopped there.

However, the Step 2 outcome can be predicted with high confidence from the Category B findings:

| Flow | Expected result for a non-Amooksco tenant (e.g., `freight-demo`) |
|------|------------------------------------------------------------------|
| Full signup → provisioning → storefront | **Broken.** `/store/freight-demo` returns `notFound()` because `resolveTenantTheme('freight-demo')` returns `null`. |
| Template selection and switching | **Partially broken.** The backend catalog supports multiple templates, but the frontend's `resolveTenantTheme` only knows `amooksco-v2`, so switching to another template will not render. |
| Plugin install | **Unequal.** Only the `amooksco_template` plugin auto-enables a full feature set and applies `theme_class = "theme-amooksco"`. Other tenants have no equivalent auto-config plugin. |
| Billing: view subscription, upgrade, cancel | **Likely works** — billing endpoints are tenant-scoped and generic. |
| Feature gating (`require_active_subscription` / `require_feature`) | **Likely works** — these are generic decorators. |
| Custom domain request flow | **Likely works** — domain resolution is generic. |

The storefront is the smoking gun. Until `resolveTenantTheme` returns a real theme for every configured template and `/storefront` does not hardcode the Amooksco components, the platform is effectively a single-tenant Amooksco demo at the public storefront layer.

---

## Step 3 — Branch Naming Recommendation

Recommend renaming the primary development branch once this body of work is merged:

- `main` (if this becomes the single source of truth)
- `develop` (if a `main`/`release` split is desired)
- `platform-v2` or `storefront-multi-tenant`

Keeping platform-wide work under `amooskco-storefront-v2` makes it easy for the next engineer to assume Amooksco-specific code is acceptable, and it complicates onboarding new tenants.

---

## Immediate Remediation Suggestions

Fix the Category B leaks in order of impact:

1. **Storefront rendering**
   - Make `frontend/lib/tenant-theme-registry.ts` return a generic fallback theme for any valid tenant slug.
   - Remove the Amooksco-only branch in `frontend/app/store/[slug]/page.tsx` or make it conditional on the actual resolved theme.
   - Replace `frontend/app/storefront/page.tsx` and `frontend/components/tenant-storefront.tsx` with a theme-agnostic renderer that reads the tenant's selected template.

2. **Auth pages**
   - Move `frontend/app/sign-up/page.tsx` and `frontend/app/sign-in/page.tsx` to a platform-neutral auth form (or make them dynamically select the tenant theme based on host/slug).

3. **Global CSS**
   - Remove `import '@/styles/tenants/amooksco.css'` from `frontend/app/layout.tsx`. Load tenant-specific CSS only when that theme is active.

4. **Tracking fallback**
   - Remove the `|| 'amooksco'` fallback in `frontend/templates/amooksco/components/home/track.tsx`. A missing tenant should fail loudly, not fall back to another tenant.

5. **Shipping-mark prefix default**
   - Change `_strip_shipping_mark_prefix` default prefix to an empty string or derive it from tenant branding.

6. **Template plugin**
   - Decide whether `app/plugins/amooksco_template_plugin.py` should become a generic `logistics_template` plugin or be registered only for tenants that select the Amooksco template.

7. **Legacy route**
   - Decide whether `/amooksco-storefront` should be deleted or kept only as a demo redirect.

---

## Appendix — Raw Active-Code Grep Output

The following is the complete raw output of the grep restricted to active code (build artifacts, backups, reports, and source snapshots excluded).

```
frontend/components/amooksco-v2/home/hero.tsx:4:import { VideoBackdrop } from "@/components/amooksco-v2/video-backdrop"
frontend/components/amooksco-v2/home/hero.tsx:5:import { brand, waLink, whatsapp } from "@/lib/amooksco"
frontend/components/amooksco-v2/home/hero.tsx:12:        src="/tenant-assets/amooksco/hero-shipping.mp4"
frontend/components/amooksco-v2/home/hero.tsx:13:        poster="/tenant-assets/amooksco/container-delivery.jpeg"
frontend/components/amooksco-v2/home/hero.tsx:30:            AMOOKSCO Logistics handles your China to Ghana freight end to end — sea
frontend/components/amooksco-v2/home/hero.tsx:42:                href={waLink(whatsapp.tracking, "Hello AMOOKSCO, I'd like to start a shipment from China.")}
frontend/components/amooksco-v2/home/track.tsx:10:import { waLink, whatsapp } from "@/lib/amooksco"
frontend/components/amooksco-v2/home/track.tsx:190:              href={waLink(whatsapp.tracking, `Hello AMOOKSCO, I can't find: ${query}`)}
frontend/components/amooksco-v2/home/track.tsx:215:            Track by your AMOOKSCO tracking number or by your shipping mark / name.
frontend/components/amooksco-v2/home/track.tsx:233:            Enter your AMOOKSCO tracking number or shipping mark exactly as provided.
frontend/components/amooksco-v2/home/payments.tsx:7:import { billingStaff, momo, waLink } from "@/lib/amooksco"
frontend/components/amooksco-v2/home/payments.tsx:91:                  "Hello AMOOKSCO, I have made a Mobile Money payment. Here is my screenshot.",
frontend/components/amooksco-v2/home/payments.tsx:123:                AMOOKSCO will never ask you to pay an unlisted personal number. Always
frontend/components/amooksco-v2/home/notices.tsx:4:import { VideoBackdrop } from "@/components/amooksco-v2/video-backdrop"
frontend/components/amooksco-v2/home/notices.tsx:10:    image: "/tenant-assets/amooksco/new-arrivals.jpeg",
frontend/components/amooksco-v2/home/notices.tsx:16:    image: "/tenant-assets/amooksco/container-delivery.jpeg",
frontend/components/amooksco-v2/home/notices.tsx:22:    image: "/tenant-assets/amooksco/china-warehouse.jpeg",
frontend/components/amooksco-v2/home/notices.tsx:32:        src="/tenant-assets/amooksco/port.mp4"
frontend/components/amooksco-v2/home/cta.tsx:4:import { VideoBackdrop } from "@/components/amooksco-v2/video-backdrop"
frontend/components/amooksco-v2/home/cta.tsx:5:import { brand, waLink, whatsapp } from "@/lib/amooksco"
frontend/components/amooksco-v2/home/cta.tsx:12:        src="/tenant-assets/amooksco/vans.mp4"
frontend/components/amooksco-v2/home/cta.tsx:31:              href={waLink(whatsapp.tracking, "Hello AMOOKSCO, I'd like to get started.")}
frontend/components/amooksco-v2/home/services.tsx:9:import { services } from "@/lib/amooksco"
frontend/components/amooksco-v2/home/estimator.tsx:6:import { waLink, whatsapp } from "@/lib/amooksco"
frontend/components/amooksco-v2/home/estimator.tsx:153:                    `Hello AMOOKSCO, I'd like a ${mode === "sea" ? "sea" : "air"} cargo quote. My estimate was about $${estimate.toFixed(0)}.`,
frontend/components/amooksco-v2/home/workflow.tsx:1:import { workflow } from "@/lib/amooksco"
frontend/components/amooksco-v2/site-footer.tsx:4:import { brand, contacts, services, waLink, whatsapp } from "@/lib/amooksco"
frontend/components/amooksco-v2/site-footer.tsx:85:                  href={waLink(whatsapp.tracking, "Hello AMOOKSCO")}
frontend/components/amooksco-v2/site-header.tsx:15:import { brand, navLinks, waLink, whatsapp } from "@/lib/amooksco"
frontend/components/amooksco-v2/site-header.tsx:35:              href={waLink(whatsapp.tracking, "Hello AMOOKSCO, I need help with my shipment.")}
frontend/components/amooksco-v2/site-header.tsx:81:              href={waLink(whatsapp.tracking, "Hello AMOOKSCO, I'd like to start a shipment.")}
frontend/components/amooksco-v2/site-header.tsx:90:          <Link href="/amooksco-storefront/login" className="rounded-full border px-4 py-2 text-sm font-semibold">Login</Link>
frontend/components/amooksco-v2/site-header.tsx:119:                  href="/amooksco-storefront/login"
frontend/components/tenant-themes/amooksco-v2/home/cta.tsx:4:import { VideoBackdrop } from "@/components/amooksco-v2/video-backdrop"
frontend/components/tenant-themes/amooksco-v2/home/cta.tsx:5:import { brand, waLink, whatsapp } from "@/lib/amooksco"
frontend/components/tenant-themes/amooksco-v2/home/cta.tsx:14:        src="/tenant-assets/amooksco/vans.mp4"
frontend/components/tenant-themes/amooksco-v2/home/cta.tsx:33:              href={waLink(whatsapp.tracking, "Hello AMOOKSCO, I'd like to get started.")}
frontend/components/tenant-themes/amooksco-v2/pages/about.tsx:3:import { PageHeader } from "@/components/tenant-themes/amooksco-v2/page-header"
frontend/components/tenant-themes/amooksco-v2/pages/about.tsx:4:import { SiteHeader } from "@/components/tenant-themes/amooksco-v2/site-header"
frontend/components/tenant-themes/amooksco-v2/pages/about.tsx:5:import { SiteFooter } from "@/components/tenant-themes/amooksco-v2/site-footer"
frontend/components/tenant-themes/amooksco-v2/pages/about.tsx:6:import { brand } from "@/lib/amooksco"
frontend/components/tenant-themes/amooksco-v2/pages/about.tsx:32:export function AmooskcoAbout({ theme }: { theme: TenantPublicTheme }) {
frontend/components/tenant-themes/amooksco-v2/pages/about.tsx:47:                AMOOKSCO Logistics is a Ghanaian-owned freight forwarding company
frontend/components/tenant-themes/amooksco-v2/pages/about.tsx:68:                src="/tenant-assets/amooksco/china-warehouse.jpeg"
frontend/components/tenant-themes/amooksco-v2/pages/about.tsx:69:                alt="AMOOKSCO China warehouse facility"
frontend/components/tenant-themes/amooksco-v2/pages/new-arrivals.tsx:4:import { PageHeader } from "@/components/tenant-themes/amooksco-v2/page-header"
frontend/components/tenant-themes/amooksco-v2/pages/new-arrivals.tsx:5:import { SiteHeader } from "@/components/tenant-themes/amooksco-v2/site-header"
frontend/components/tenant-themes/amooksco-v2/pages/new-arrivals.tsx:6:import { SiteFooter } from "@/components/tenant-themes/amooksco-v2/site-footer"
frontend/components/tenant-themes/amooksco-v2/pages/new-arrivals.tsx:7:import { Notices } from "@/components/amooksco-v2/home/notices"
frontend/components/tenant-themes/amooksco-v2/pages/new-arrivals.tsx:21:export function AmooskcoNewArrivals({ theme }: { theme: TenantPublicTheme }) {
frontend/components/tenant-themes/amooksco-v2/pages/privacy.tsx:1:import { PageHeader } from "@/components/tenant-themes/amooksco-v2/page-header"
frontend/components/tenant-themes/amooksco-v2/pages/privacy.tsx:2:import { SiteHeader } from "@/components/tenant-themes/amooksco-v2/site-header"
frontend/components/tenant-themes/amooksco-v2/pages/privacy.tsx:3:import { SiteFooter } from "@/components/tenant-themes/amooksco-v2/site-footer"
frontend/components/tenant-themes/amooksco-v2/pages/privacy.tsx:4:import { brand, contacts } from "@/lib/amooksco"
frontend/components/tenant-themes/amooksco-v2/pages/privacy.tsx:11:      "When you use AMOOKSCO Logistics, we may collect information you provide directly, such as your full name, phone number, email address, shipping mark/name, delivery address and details about the goods you are importing.",
frontend/components/tenant-themes/amooksco-v2/pages/privacy.tsx:38:      "We apply reasonable technical and organisational measures to protect your data. Tracking and customer records are held under secure tenant isolation and accessible only to authorised AMOOKSCO staff.",
frontend/components/tenant-themes/amooksco-v2/pages/privacy.tsx:55:export function AmooskcoPrivacy({ theme }: { theme: TenantPublicTheme }) {
frontend/components/tenant-themes/amooksco-v2/pages/privacy.tsx:62:        description="Last updated: this policy explains how we handle your information when you use AMOOKSCO Logistics."
frontend/components/tenant-themes/amooksco-v2/pages/cookies.tsx:1:import { PageHeader } from "@/components/tenant-themes/amooksco-v2/page-header"
frontend/components/tenant-themes/amooksco-v2/pages/cookies.tsx:2:import { SiteHeader } from "@/components/tenant-themes/amooksco-v2/site-header"
frontend/components/tenant-themes/amooksco-v2/pages/cookies.tsx:3:import { SiteFooter } from "@/components/tenant-themes/amooksco-v2/site-footer"
frontend/components/tenant-themes/amooksco-v2/pages/cookies.tsx:27:export function AmooskcoCookies({ theme }: { theme: TenantPublicTheme }) {
frontend/components/tenant-themes/amooksco-v2/pages/cookies.tsx:51:                AMOOKSCO Logistics uses cookies to keep the storefront and staff
frontend/components/tenant-themes/amooksco-v2/pages/support.tsx:2:import { PageHeader } from "@/components/tenant-themes/amooksco-v2/page-header"
frontend/components/tenant-themes/amooksco-v2/pages/support.tsx:3:import { SiteHeader } from "@/components/tenant-themes/amooksco-v2/site-header"
frontend/components/tenant-themes/amooksco-v2/pages/support.tsx:4:import { SiteFooter } from "@/components/tenant-themes/amooksco-v2/site-footer"
frontend/components/tenant-themes/amooksco-v2/pages/support.tsx:5:import { SupportForm } from "@/components/tenant-themes/amooksco-v2/support-form"
frontend/components/tenant-themes/amooksco-v2/pages/support.tsx:7:import { billingStaff, contacts, waLink, whatsapp } from "@/lib/amooksco"
frontend/components/tenant-themes/amooksco-v2/pages/support.tsx:10:export function AmooskcoSupport({ theme }: { theme: TenantPublicTheme }) {
frontend/components/tenant-themes/amooksco-v2/pages/support.tsx:38:                  href={waLink(whatsapp.tracking, "Hello AMOOKSCO support team,")}
frontend/components/tenant-themes/amooksco-v2/site-footer.tsx:4:import { brand, contacts, services, waLink, whatsapp } from "@/lib/amooksco"
frontend/components/tenant-themes/amooksco-v2/site-footer.tsx:87:                  href={waLink(whatsapp.tracking, "Hello AMOOKSCO")}
frontend/components/tenant-themes/amooksco-v2/amooksco-home.tsx:1:import { Hero } from "@/components/amooksco-v2/home/hero"
frontend/components/tenant-themes/amooksco-v2/amooksco-home.tsx:2:import { Workflow } from "@/components/amooksco-v2/home/workflow"
frontend/components/tenant-themes/amooksco-v2/amooksco-home.tsx:3:import { Services } from "@/components/amooksco-v2/home/services"
frontend/components/tenant-themes/amooksco-v2/amooksco-home.tsx:4:import { Track } from "@/components/amooksco-v2/home/track"
frontend/components/tenant-themes/amooksco-v2/amooksco-home.tsx:5:import { Estimator } from "@/components/amooksco-v2/home/estimator"
frontend/components/tenant-themes/amooksco-v2/amooksco-home.tsx:6:import { Payments } from "@/components/amooksco-v2/home/payments"
frontend/components/tenant-themes/amooksco-v2/amooksco-home.tsx:7:import { CTA } from "@/components/tenant-themes/amooksco-v2/home/cta"
frontend/components/tenant-themes/amooksco-v2/amooksco-home.tsx:8:import { SiteHeader } from "@/components/tenant-themes/amooksco-v2/site-header"
frontend/components/tenant-themes/amooksco-v2/amooksco-home.tsx:9:import { SiteFooter } from "@/components/tenant-themes/amooksco-v2/site-footer"
frontend/components/tenant-themes/amooksco-v2/amooksco-home.tsx:12:export function AmooskcoHome({ theme }: { theme: TenantPublicTheme }) {
frontend/components/tenant-themes/amooksco-v2/site-header.tsx:15:import { brand, waLink, whatsapp } from "@/lib/amooksco"
frontend/components/tenant-themes/amooksco-v2/site-header.tsx:48:              href={waLink(whatsapp.tracking, "Hello AMOOKSCO, I need help with my shipment.")}
frontend/components/tenant-themes/amooksco-v2/site-header.tsx:94:              href={waLink(whatsapp.tracking, "Hello AMOOKSCO, I'd like to start a shipment.")}
frontend/components/tenant-storefront.tsx:3:import { Workflow } from "@/templates/amooksco/components/home/workflow"
frontend/components/tenant-storefront.tsx:4:import { Services } from "@/templates/amooksco/components/home/services"
frontend/components/tenant-storefront.tsx:5:import { Track } from "@/templates/amooksco/components/home/track"
frontend/components/tenant-storefront.tsx:6:import { Estimator } from "@/templates/amooksco/components/home/estimator"
frontend/components/tenant-storefront.tsx:7:import { Payments } from "@/templates/amooksco/components/home/payments"
frontend/components/tenant-storefront.tsx:8:import { CTA } from "@/templates/amooksco/components/home/cta"
frontend/components/tenant-storefront.tsx:9:import { SiteHeader } from "@/templates/amooksco/components/site-header"
frontend/components/tenant-storefront.tsx:10:import { SiteFooter } from "@/templates/amooksco/components/site-footer"
frontend/components/tenant-storefront.tsx:11:import { ChatWidget } from "@/templates/amooksco/components/chat-widget"
frontend/components/tenant-storefront.tsx:43:  // Render Amooksco template directly
frontend/middleware.ts:67:  '/amooksco-storefront/',
frontend/styles/tenants/amooksco.css:1:.tenant-amooksco-v2 {
frontend/styles/tenants/amooksco.css:9:.tenant-amooksco-v2 .bg-primary {
frontend/styles/tenants/amooksco.css:13:.tenant-amooksco-v2 .text-primary {
frontend/styles/tenants/amooksco.css:17:.tenant-amooksco-v2 .text-primary-foreground {
frontend/styles/tenants/amooksco.css:21:.tenant-amooksco-v2 .bg-accent {
frontend/styles/tenants/amooksco.css:25:.tenant-amooksco-v2 .text-accent {
frontend/styles/tenants/amooksco.css:29:.tenant-amooksco-v2 .text-accent-foreground {
frontend/styles/tenants/amooksco.css:33:.tenant-amooksco-v2 .border-accent\/40 {
frontend/styles/tenants/amooksco.css:37:.tenant-amooksco-v2 .bg-accent\/10 {
frontend/styles/tenants/amooksco.css:41:.tenant-amooksco-v2 .bg-accent\/40 {
frontend/styles/tenants/amooksco.css:45:.tenant-amooksco-v2 .bg-primary\/10 {
frontend/styles/tenants/amooksco.css:49:.tenant-amooksco-v2 .bg-primary\/95 {
frontend/styles/tenants/amooksco.css:53:.tenant-amooksco-v2 .bg-primary\/60 {
frontend/styles/tenants/amooksco.css:57:.tenant-amooksco-v2 .bg-primary\/55 {
frontend/styles/tenants/amooksco.css:61:.tenant-amooksco-v2 .bg-primary\/85 {
frontend/styles/tenants/amooksco.css:65:.tenant-amooksco-v2 .hover\:bg-accent\/90:hover {
frontend/styles/tenants/amooksco.css:69:.tenant-amooksco-v2 .hover\:text-accent:hover {
frontend/styles/tenants/amooksco.css:73:.tenant-amooksco-v2 .hover\:bg-white\/10:hover {
frontend/styles/tenants/amooksco.css:77:.tenant-amooksco-v2 .hover\:bg-white\/15:hover {
frontend/styles/tenants/amooksco.css:81:.tenant-amooksco-v2 .group-hover\:bg-primary:hover {
frontend/styles/tenants/amooksco.css:85:.tenant-amooksco-v2 .group-hover\:text-primary-foreground:hover {
frontend/lib/amooksco.ts:1:// Central brand + contact data for AMOOKSCO LOGISTICS.
frontend/lib/amooksco.ts:6:  name: "AMOOKSCO LOGISTICS",
frontend/lib/amooksco.ts:7:  group: "Amooksco Group of Companies",
frontend/lib/amooksco.ts:11:  platform: "AMOOKSCO Logistics Platform",
frontend/lib/amooksco.ts:13:  logo: "/tenant-assets/amooksco/logo.png",
frontend/lib/amooksco.ts:14:  storeSlug: "amooksco-logistics",
frontend/lib/amooksco.ts:15:  domain: "amooksco.com",
frontend/lib/amooksco.ts:45:    name: "Amooksco Desk",
frontend/lib/amooksco.ts:56:  merchantName: "AMOOKSCO VENTURES",
frontend/lib/tenant-context.ts:109:    // If full hostname didn't match, try extracting subdomain (e.g., "amooksco" from "amooksco.afruheritage.com")
frontend/lib/tenant-theme-registry.ts:1:export type TenantThemeCode = 'amooksco-v2' | 'default'
frontend/lib/tenant-theme-registry.ts:17:  if (slug === 'amooksco-logistics') {
frontend/lib/tenant-theme-registry.ts:20:      themeCode: 'amooksco-v2',
frontend/lib/tenant-theme-registry.ts:22:      name: 'AMOOKSCO Logistics',
frontend/lib/tenant-theme-registry.ts:23:      logo: '/tenant-assets/amooksco/logo.png',
frontend/lib/templates.ts:15:    slug: "amooksco",
frontend/lib/templates.ts:16:    name: "Amooksco",
frontend/lib/templates.ts:20:    themeClass: "theme-amooksco",
frontend/lib/templates.ts:21:    image: "/tenant-assets/amooksco/logo.png",
frontend/lib/template-loader.ts:10:import AmookscoStorefront from "@/templates/amooksco/app/(store)/page"
frontend/lib/template-loader.ts:21:      case "amooksco":
frontend/lib/template-loader.ts:22:        return AmookscoStorefront
frontend/app/sign-up/page.tsx:2:import { AuthForm } from '@/templates/amooksco/components/auth-form'
frontend/app/sign-up/page.tsx:5:  title: 'Sign Up | AMOOKSCO',
frontend/app/sign-up/page.tsx:6:  description: 'Create your AMOOKSCO account to track shipments and manage your freight.',
frontend/app/sign-in/page.tsx:2:import { AuthForm } from '@/templates/amooksco/components/auth-form'
frontend/app/sign-in/page.tsx:5:  title: 'Sign In | AMOOKSCO',
frontend/app/sign-in/page.tsx:6:  description: 'Sign in to your AMOOKSCO account to track shipments and manage your freight.',
frontend/app/storefront/page.tsx:3:import { Workflow } from "@/templates/amooksco/components/home/workflow"
frontend/app/storefront/page.tsx:4:import { Services } from "@/templates/amooksco/components/home/services"
frontend/app/storefront/page.tsx:5:import { Track } from "@/templates/amooksco/components/home/track"
frontend/app/storefront/page.tsx:6:import { Estimator } from "@/templates/amooksco/components/home/estimator"
frontend/app/storefront/page.tsx:7:import { Payments } from "@/templates/amooksco/components/home/payments"
frontend/app/storefront/page.tsx:8:import { CTA } from "@/templates/amooksco/components/home/cta"
frontend/app/storefront/page.tsx:9:import { SiteHeader } from "@/templates/amooksco/components/site-header"
frontend/app/storefront/page.tsx:10:import { SiteFooter } from "@/templates/amooksco/components/site-footer"
frontend/app/storefront/page.tsx:11:import { ChatWidget } from "@/templates/amooksco/components/chat-widget"
frontend/app/storefront/page.tsx:38:  // Render Amooksco template directly
frontend/app/layout.tsx:11:import '@/styles/tenants/amooksco.css'
frontend/app/amooksco-storefront/signup/page.tsx:11:import { brand } from "@/lib/amooksco"
frontend/app/amooksco-storefront/signup/page.tsx:143:              <Link href="/amooksco-storefront/login" className="text-primary hover:underline">
frontend/app/amooksco-storefront/gallery/page.tsx:4:import { SiteHeader } from "@/components/amooksco-v2/site-header"
frontend/app/amooksco-storefront/gallery/page.tsx:5:import { SiteFooter } from "@/components/amooksco-v2/site-footer"
frontend/app/amooksco-storefront/gallery/page.tsx:6:import { PageHeader } from "@/components/amooksco-v2/page-header"
frontend/app/amooksco-storefront/about/page.tsx:3:import { SiteHeader } from "@/components/amooksco-v2/site-header"
frontend/app/amooksco-storefront/about/page.tsx:4:import { SiteFooter } from "@/components/amooksco-v2/site-footer"
frontend/app/amooksco-storefront/about/page.tsx:5:import { PageHeader } from "@/components/amooksco-v2/page-header"
frontend/app/amooksco-storefront/about/page.tsx:17:          title="About AMOOKSCO Logistics"
frontend/app/amooksco-storefront/about/page.tsx:28:                  AMOOKSCO Logistics was founded with a simple mission: to make freight forwarding between China and Ghana seamless, reliable, and affordable. We understand the challenges businesses face when importing goods from China - complex logistics, customs clearance, and unreliable shipping partners.
frontend/app/amooksco-storefront/about/page.tsx:148:            <h2 className="mb-8 text-center text-2xl font-bold">Why Choose AMOOKSCO?</h2>
frontend/app/amooksco-storefront/login/page.tsx:11:import { brand } from "@/lib/amooksco"
frontend/app/amooksco-storefront/login/page.tsx:144:              <Link href="/amooksco-storefront/signup" className="text-primary hover:underline">
frontend/app/amooksco-storefront/page.tsx:1:import { Workflow } from "@/components/amooksco-v2/home/workflow"
frontend/app/amooksco-storefront/page.tsx:2:import { Services } from "@/components/amooksco-v2/home/services"
frontend/app/amooksco-storefront/page.tsx:3:import { Track } from "@/components/amooksco-v2/home/track"
frontend/app/amooksco-storefront/page.tsx:4:import { Estimator } from "@/components/amooksco-v2/home/estimator"
frontend/app/amooksco-storefront/page.tsx:5:import { Payments } from "@/components/amooksco-v2/home/payments"
frontend/app/amooksco-storefront/page.tsx:6:import { CTA } from "@/components/amooksco-v2/home/cta"
frontend/app/amooksco-storefront/page.tsx:7:import { SiteHeader } from "@/components/amooksco-v2/site-header"
frontend/app/amooksco-storefront/page.tsx:8:import { SiteFooter } from "@/components/amooksco-v2/site-footer"
frontend/app/amooksco-storefront/page.tsx:10:export default function AmookscoStorefront() {
frontend/app/amooksco-storefront/new-arrivals/page.tsx:4:import { SiteHeader } from "@/components/amooksco-v2/site-header"
frontend/app/amooksco-storefront/new-arrivals/page.tsx:5:import { SiteFooter } from "@/components/amooksco-v2/site-footer"
frontend/app/amooksco-storefront/new-arrivals/page.tsx:6:import { PageHeader } from "@/components/amooksco-v2/page-header"
frontend/app/store/[slug]/privacy/page.tsx:4:import { AmooskcoPrivacy } from '@/components/tenant-themes/amooksco-v2/pages/privacy'
frontend/app/store/[slug]/privacy/page.tsx:16:  if (theme.themeCode === 'amooksco-v2') {
frontend/app/store/[slug]/privacy/page.tsx:19:        <AmooskcoPrivacy theme={theme} />
frontend/app/store/[slug]/cookies/page.tsx:4:import { AmooskcoCookies } from '@/components/tenant-themes/amooksco-v2/pages/cookies'
frontend/app/store/[slug]/cookies/page.tsx:16:  if (theme.themeCode === 'amooksco-v2') {
frontend/app/store/[slug]/cookies/page.tsx:19:        <AmooskcoCookies theme={theme} />
frontend/app/store/[slug]/support/page.tsx:4:import { AmooskcoSupport } from '@/components/tenant-themes/amooksco-v2/pages/support'
frontend/app/store/[slug]/support/page.tsx:16:  if (theme.themeCode === 'amooksco-v2') {
frontend/app/store/[slug]/support/page.tsx:19:        <AmooskcoSupport theme={theme} />
frontend/app/store/[slug]/about/page.tsx:4:import { AmooskcoAbout } from '@/components/tenant-themes/amooksco-v2/pages/about'
frontend/app/store/[slug]/about/page.tsx:16:  if (theme.themeCode === 'amooksco-v2') {
frontend/app/store/[slug]/about/page.tsx:19:        <AmooskcoAbout theme={theme} />
frontend/app/store/[slug]/page.tsx:4:import { AmooskcoHome } from '@/components/tenant-themes/amooksco-v2/amooksco-home'
frontend/app/store/[slug]/page.tsx:16:  if (theme.themeCode === 'amooksco-v2') {
frontend/app/store/[slug]/page.tsx:19:        <AmooskcoHome theme={theme} />
frontend/app/store/[slug]/new-arrivals/page.tsx:4:import { AmooskcoNewArrivals } from '@/components/tenant-themes/amooksco-v2/pages/new-arrivals'
frontend/app/store/[slug]/new-arrivals/page.tsx:16:  if (theme.themeCode === 'amooksco-v2') {
frontend/app/store/[slug]/new-arrivals/page.tsx:19:        <AmooskcoNewArrivals theme={theme} />
frontend/templates/amooksco/components/home/hero.tsx:4:import { VideoBackdrop } from "@/templates/amooksco/components/video-backdrop"
frontend/templates/amooksco/components/home/hero.tsx:5:import { brand, waLink, whatsapp } from "@/lib/amooksco"
frontend/templates/amooksco/components/home/hero.tsx:12:        src="/tenant-assets/amooksco/hero-shipping.mp4"
frontend/templates/amooksco/components/home/hero.tsx:13:        poster="/tenant-assets/amooksco/container-delivery.jpeg"
frontend/templates/amooksco/components/home/hero.tsx:30:            AMOOKSCO Logistics handles your China to Ghana freight end to end — sea
frontend/templates/amooksco/components/home/hero.tsx:42:                href={waLink(whatsapp.tracking, "Hello AMOOKSCO, I'd like to start a shipment from China.")}
frontend/templates/amooksco/components/home/track.tsx:10:import { waLink, whatsapp } from "@/lib/amooksco"
frontend/templates/amooksco/components/home/track.tsx:75:        const data = await api.get(`/shipments/public/track/${tenant?.id || 'amooksco'}/${key}`)
frontend/templates/amooksco/components/home/track.tsx:207:              href={waLink(whatsapp.tracking, `Hello AMOOKSCO, I can't find: ${query}`)}
frontend/templates/amooksco/components/home/payments.tsx:7:import { billingStaff, momo, waLink } from "@/lib/amooksco"
frontend/templates/amooksco/components/home/payments.tsx:142:                  "Hello AMOOKSCO, I have made a Mobile Money payment. Here is my screenshot.",
frontend/templates/amooksco/components/home/payments.tsx:174:                AMOOKSCO will never ask you to pay an unlisted personal number. Always
frontend/templates/amooksco/components/home/notices.tsx:4:import { VideoBackdrop } from "@/templates/amooksco/components/video-backdrop"
frontend/templates/amooksco/components/home/notices.tsx:10:    image: "/tenant-assets/amooksco/new-arrivals.jpeg",
frontend/templates/amooksco/components/home/notices.tsx:16:    image: "/tenant-assets/amooksco/container-delivery.jpeg",
frontend/templates/amooksco/components/home/notices.tsx:22:    image: "/tenant-assets/amooksco/china-warehouse.jpeg",
frontend/templates/amooksco/components/home/notices.tsx:32:        src="/tenant-assets/amooksco/port.mp4"
frontend/templates/amooksco/components/home/cta.tsx:4:import { VideoBackdrop } from "@/templates/amooksco/components/video-backdrop"
frontend/templates/amooksco/components/home/cta.tsx:5:import { brand, waLink, whatsapp } from "@/lib/amooksco"
frontend/templates/amooksco/components/home/cta.tsx:12:        src="/tenant-assets/amooksco/vans.mp4"
frontend/templates/amooksco/components/home/cta.tsx:31:              href={waLink(whatsapp.tracking, "Hello AMOOKSCO, I'd like to get started.")}
frontend/templates/amooksco/components/home/services.tsx:9:import { services } from "@/lib/amooksco"
frontend/templates/amooksco/components/home/estimator.tsx:6:import { waLink, whatsapp } from "@/lib/amooksco"
frontend/templates/amooksco/components/home/estimator.tsx:175:                    `Hello AMOOKSCO, I'd like a ${mode === "sea" ? "sea" : "air"} cargo quote. My estimate was about $${estimate.toFixed(0)}.`,
frontend/templates/amooksco/components/home/workflow.tsx:1:import { VideoBackdrop } from "@/templates/amooksco/components/video-backdrop"
frontend/templates/amooksco/components/home/workflow.tsx:2:import { workflow } from "@/lib/amooksco"
frontend/templates/amooksco/components/home/workflow.tsx:9:        src="/tenant-assets/amooksco/hero-shipping.mp4"
frontend/templates/amooksco/components/home/workflow.tsx:10:        poster="/tenant-assets/amooksco/container-delivery.jpeg"
frontend/templates/amooksco/components/auth-form.tsx:14:import { VideoBackdrop } from "@/templates/amooksco/components/video-backdrop"
frontend/templates/amooksco/components/auth-form.tsx:15:import { brand } from "@/lib/amooksco"
frontend/templates/amooksco/components/auth-form.tsx:89:          src="/tenant-assets/amooksco/port.mp4"
frontend/templates/amooksco/components/auth-form.tsx:90:          poster="/tenant-assets/amooksco/container-delivery.jpeg"
frontend/templates/amooksco/components/auth-form.tsx:96:            src="/tenant-assets/amooksco/logo.png"
frontend/templates/amooksco/components/auth-form.tsx:129:                src="/tenant-assets/amooksco/logo.png"
frontend/templates/amooksco/components/auth-form.tsx:201:            {isSignUp ? "Already have an account?" : "New to AMOOKSCO?"}{" "}
frontend/templates/amooksco/components/chat-widget.tsx:6:import { brand, waLink, whatsapp } from "@/lib/amooksco"
frontend/templates/amooksco/components/chat-widget.tsx:18:    { role: 'assistant', content: "Hi! I'm Amo, your AMOOKSCO assistant. Ask me about shipping from China to Ghana, tracking, or Mobile Money payments." }
frontend/templates/amooksco/components/site-footer.tsx:4:import { brand, contacts, services, waLink, whatsapp } from "@/lib/amooksco"
frontend/templates/amooksco/components/site-footer.tsx:85:                  href={waLink(whatsapp.tracking, "Hello AMOOKSCO")}
frontend/templates/amooksco/components/site-header.tsx:15:import { brand, navLinks, waLink, whatsapp } from "@/lib/amooksco"
frontend/templates/amooksco/components/site-header.tsx:16:import { AccountMenu } from "@/templates/amooksco/components/account-menu"
frontend/templates/amooksco/components/site-header.tsx:36:              href={waLink(whatsapp.tracking, "Hello AMOOKSCO, I need help with my shipment.")}
frontend/templates/amooksco/components/site-header.tsx:82:              href={waLink(whatsapp.tracking, "Hello AMOOKSCO, I'd like to start a shipment.")}
frontend/templates/amooksco/app/(store)/layout.tsx:2:import { SiteHeader } from "@/templates/amooksco/components/site-header"
frontend/templates/amooksco/app/(store)/layout.tsx:3:import { SiteFooter } from "@/templates/amooksco/components/site-footer"
frontend/templates/amooksco/app/(store)/layout.tsx:4:import { ChatWidget } from "@/templates/amooksco/components/chat-widget"
frontend/templates/amooksco/app/(store)/page.tsx:1:import { Workflow } from "@/templates/amooksco/components/home/workflow"
frontend/templates/amooksco/app/(store)/page.tsx:2:import { Services } from "@/templates/amooksco/components/home/services"
frontend/templates/amooksco/app/(store)/page.tsx:3:import { Track } from "@/templates/amooksco/components/home/track"
frontend/templates/amooksco/app/(store)/page.tsx:4:import { Estimator } from "@/templates/amooksco/components/home/estimator"
frontend/templates/amooksco/app/(store)/page.tsx:5:import { Payments } from "@/templates/amooksco/components/home/payments"
frontend/templates/amooksco/app/(store)/page.tsx:6:import { CTA } from "@/templates/amooksco/components/home/cta"
frontend/templates/amooksco/app/(store)/page.tsx:8:export default function AmookscoStorefrontPage() {
admin-console/frontend/components/branding-drawer.tsx:524:                      placeholder="amooksco"
admin-console/frontend/amooksco-template-analysis/components/home/hero.tsx:5:import { brand, waLink, whatsapp } from "@/lib/amooksco"
admin-console/frontend/amooksco-template-analysis/components/home/hero.tsx:12:        src="/tenant-assets/amooksco/hero-shipping.mp4"
admin-console/frontend/amooksco-template-analysis/components/home/hero.tsx:13:        poster="/tenant-assets/amooksco/container-delivery.jpeg"
admin-console/frontend/amooksco-template-analysis/components/home/hero.tsx:30:            AMOOKSCO Logistics handles your China to Ghana freight end to end — sea
admin-console/frontend/amooksco-template-analysis/components/home/hero.tsx:42:                href={waLink(whatsapp.tracking, "Hello AMOOKSCO, I'd like to start a shipment from China.")}
admin-console/frontend/amooksco-template-analysis/components/home/track.tsx:10:import { waLink, whatsapp } from "@/lib/amooksco"
admin-console/frontend/amooksco-template-analysis/components/home/track.tsx:165:              href={waLink(whatsapp.tracking, `Hello AMOOKSCO, I can't find: ${query}`)}
admin-console/frontend/amooksco-template-analysis/components/home/payments.tsx:7:import { billingStaff, momo, waLink } from "@/lib/amooksco"
admin-console/frontend/amooksco-template-analysis/components/home/payments.tsx:91:                  "Hello AMOOKSCO, I have made a Mobile Money payment. Here is my screenshot.",
admin-console/frontend/amooksco-template-analysis/components/home/payments.tsx:123:                AMOOKSCO will never ask you to pay an unlisted personal number. Always
admin-console/frontend/amooksco-template-analysis/components/home/notices.tsx:10:    image: "/tenant-assets/amooksco/new-arrivals.jpeg",
admin-console/frontend/amooksco-template-analysis/components/home/notices.tsx:16:    image: "/tenant-assets/amooksco/container-delivery.jpeg",
admin-console/frontend/amooksco-template-analysis/components/home/notices.tsx:22:    image: "/tenant-assets/amooksco/china-warehouse.jpeg",
admin-console/frontend/amooksco-template-analysis/components/home/notices.tsx:32:        src="/tenant-assets/amooksco/port.mp4"
admin-console/frontend/amooksco-template-analysis/components/home/cta.tsx:5:import { brand, waLink, whatsapp } from "@/lib/amooksco"
admin-console/frontend/amooksco-template-analysis/components/home/cta.tsx:12:        src="/tenant-assets/amooksco/vans.mp4"
admin-console/frontend/amooksco-template-analysis/components/home/cta.tsx:31:              href={waLink(whatsapp.tracking, "Hello AMOOKSCO, I'd like to get started.")}
admin-console/frontend/amooksco-template-analysis/components/home/services.tsx:9:import { services } from "@/lib/amooksco"
admin-console/frontend/amooksco-template-analysis/components/home/estimator.tsx:6:import { waLink, whatsapp } from "@/lib/amooksco"
admin-console/frontend/amooksco-template-analysis/components/home/estimator.tsx:153:                    `Hello AMOOKSCO, I'd like a ${mode === "sea" ? "sea" : "air"} cargo quote. My estimate was about $${estimate.toFixed(0)}.`,
admin-console/frontend/amooksco-template-analysis/components/home/workflow.tsx:2:import { workflow } from "@/lib/amooksco"
admin-console/frontend/amooksco-template-analysis/components/home/workflow.tsx:9:        src="/tenant-assets/amooksco/hero-shipping.mp4"
admin-console/frontend/amooksco-template-analysis/components/home/workflow.tsx:10:        poster="/tenant-assets/amooksco/container-delivery.jpeg"
admin-console/frontend/amooksco-template-analysis/components/auth-form.tsx:14:import { brand } from "@/lib/amooksco"
admin-console/frontend/amooksco-template-analysis/components/auth-form.tsx:76:          src="/tenant-assets/amooksco/port.mp4"
admin-console/frontend/amooksco-template-analysis/components/auth-form.tsx:77:          poster="/tenant-assets/amooksco/container-delivery.jpeg"
admin-console/frontend/amooksco-template-analysis/components/auth-form.tsx:83:            src="/tenant-assets/amooksco/logo.png"
admin-console/frontend/amooksco-template-analysis/components/auth-form.tsx:116:                src="/tenant-assets/amooksco/logo.png"
admin-console/frontend/amooksco-template-analysis/components/auth-form.tsx:212:            {isSignUp ? "Already have an account?" : "New to AMOOKSCO?"}{" "}
admin-console/frontend/amooksco-template-analysis/components/chat-widget.tsx:8:import { brand, waLink, whatsapp } from "@/lib/amooksco"
admin-console/frontend/amooksco-template-analysis/components/chat-widget.tsx:69:                  Hi! I&apos;m Amo, your AMOOKSCO assistant. Ask me about shipping from
admin-console/frontend/amooksco-template-analysis/components/chat-widget.tsx:127:                    href={waLink(whatsapp.tracking, "Hello AMOOKSCO, I need assistance.")}
admin-console/frontend/amooksco-template-analysis/components/site-footer.tsx:4:import { brand, contacts, services, waLink, whatsapp } from "@/lib/amooksco"
admin-console/frontend/amooksco-template-analysis/components/site-footer.tsx:85:                  href={waLink(whatsapp.tracking, "Hello AMOOKSCO")}
admin-console/frontend/amooksco-template-analysis/components/admin/admin-shell.tsx:19:import { brand } from "@/lib/amooksco"
admin-console/frontend/amooksco-template-analysis/components/admin/admin-shell.tsx:88:          src="/tenant-assets/amooksco/logo.png"
admin-console/frontend/amooksco-template-analysis/components/admin/admin-shell.tsx:95:          <p className="text-sm font-bold text-sidebar-foreground">AMOOKSCO</p>
admin-console/frontend/amooksco-template-analysis/components/admin/admin-shell.tsx:171:          <span className="font-semibold">AMOOKSCO Console</span>
admin-console/frontend/amooksco-template-analysis/components/admin/user-management.tsx:156:                placeholder="name@amooksco.com"
admin-console/frontend/amooksco-template-analysis/components/site-header.tsx:15:import { brand, navLinks, waLink, whatsapp } from "@/lib/amooksco"
admin-console/frontend/amooksco-template-analysis/components/site-header.tsx:36:              href={waLink(whatsapp.tracking, "Hello AMOOKSCO, I need help with my shipment.")}
admin-console/frontend/amooksco-template-analysis/components/site-header.tsx:82:              href={waLink(whatsapp.tracking, "Hello AMOOKSCO, I'd like to start a shipment.")}
admin-console/frontend/amooksco-template-analysis/lib/amooksco.ts:1:// Central brand + contact data for AMOOKSCO LOGISTICS.
admin-console/frontend/amooksco-template-analysis/lib/amooksco.ts:6:  name: "AMOOKSCO LOGISTICS",
admin-console/frontend/amooksco-template-analysis/lib/amooksco.ts:7:  group: "Amooksco Group of Companies",
admin-console/frontend/amooksco-template-analysis/lib/amooksco.ts:13:  logo: "/tenant-assets/amooksco/logo.png",
admin-console/frontend/amooksco-template-analysis/lib/amooksco.ts:14:  storeSlug: "amooksco-logistics",
admin-console/frontend/amooksco-template-analysis/lib/amooksco.ts:15:  domain: "amooksco.com",
admin-console/frontend/amooksco-template-analysis/lib/amooksco.ts:45:    name: "Amooksco Desk",
admin-console/frontend/amooksco-template-analysis/lib/amooksco.ts:56:  merchantName: "AMOOKSCO VENTURES",
admin-console/frontend/amooksco-template-analysis/lib/admin-data.ts:1:// Mock data for the AMOOKSCO staff console (demo).
admin-console/frontend/amooksco-template-analysis/lib/admin-data.ts:32:  { id: "u1", name: "Michael Amoakoh", email: "admin@amooksco.com", role: "tenant_owner", status: "active" },
admin-console/frontend/amooksco-template-analysis/lib/admin-data.ts:33:  { id: "u2", name: "Priscilla", email: "priscilla@amooksco.com", role: "customer_support", status: "active" },
admin-console/frontend/amooksco-template-analysis/lib/admin-data.ts:34:  { id: "u3", name: "Mimi", email: "mimi@amooksco.com", role: "billing_viewer", status: "active" },
admin-console/frontend/amooksco-template-analysis/lib/admin-data.ts:35:  { id: "u4", name: "Linda", email: "linda@amooksco.com", role: "billing_viewer", status: "active" },
admin-console/frontend/amooksco-template-analysis/lib/admin-data.ts:36:  { id: "u5", name: "Solo", email: "solo@amooksco.com", role: "billing_viewer", status: "active" },
admin-console/frontend/amooksco-template-analysis/lib/admin-data.ts:37:  { id: "u6", name: "Kwame Boateng", email: "warehouse@amooksco.com", role: "warehouse_manager", status: "active" },
admin-console/frontend/amooksco-template-analysis/lib/admin-data.ts:38:  { id: "u7", name: "Akosua Mensah", email: "cargo@amooksco.com", role: "cargo_operator", status: "invited" },
admin-console/frontend/amooksco-template-analysis/lib/admin-data.ts:58:  { id: "m7", name: "Amooksco Customer 0418", phone: "+233 55 120 9087", mark: "AMK0418", type: "member", goods: "Mixed goods", joined: "2025-10-12" },
admin-console/frontend/amooksco-template-analysis/lib/faq.ts:49:      "A shipping mark is your unique label (usually your name or code) written on every package. It lets us identify and match your goods at the warehouse and during delivery. Always ask your supplier to write your AMOOKSCO shipping mark on the boxes.",
admin-console/frontend/amooksco-template-analysis/lib/faq.ts:67:      "Billing is split by the first letter of your name: A-G is Mimi, H-O is Linda, and P-Z is Solo. Special or heavy goods go through the Amooksco Desk. Reach out on WhatsApp and we will direct you to the right person.",
admin-console/frontend/amooksco-template-analysis/lib/faq.ts:136:  "Hi! I'm Amo, your AMOOKSCO assistant. I can help with shipping from China to Ghana, sea vs air freight, CBM pricing, tracking, Mobile Money payments, customs, and buying goods for you. What would you like to know?"
admin-console/frontend/amooksco-template-analysis/app/globals.css:60:  /* AMOOKSCO deep navy (true blue, matches the flyer headers) */
admin-console/frontend/amooksco-template-analysis/app/globals.css:68:  /* AMOOKSCO gold */
admin-console/frontend/amooksco-template-analysis/app/globals.css:71:  /* AMOOKSCO alert red */
admin-console/frontend/amooksco-template-analysis/app/admin/layout.tsx:8:  title: "AMOOKSCO Operations Console",
admin-console/frontend/amooksco-template-analysis/app/admin/layout.tsx:9:  description: "Internal operations console for AMOOKSCO Logistics staff.",
admin-console/frontend/amooksco-template-analysis/app/admin/page.tsx:36:          Overview of AMOOKSCO cargo operations and members.
admin-console/frontend/amooksco-template-analysis/app/layout.tsx:13:  title: 'AMOOKSCO Logistics — Reliable Freight Forwarding From China To Ghana',
admin-console/frontend/amooksco-template-analysis/app/layout.tsx:15:    'AMOOKSCO Logistics handles China to Ghana freight forwarding: sea cargo, air cargo, China warehouse receiving, procurement, customs support and Ghana delivery. Your goods are in trusted hands.',
admin-console/frontend/amooksco-template-analysis/app/(store)/privacy/page.tsx:3:import { brand, contacts } from "@/lib/amooksco"
admin-console/frontend/amooksco-template-analysis/app/(store)/privacy/page.tsx:6:  title: "Privacy Policy | AMOOKSCO Logistics",
admin-console/frontend/amooksco-template-analysis/app/(store)/privacy/page.tsx:7:  description: "How AMOOKSCO Logistics collects, uses and protects your personal data.",
admin-console/frontend/amooksco-template-analysis/app/(store)/privacy/page.tsx:14:      "When you use AMOOKSCO Logistics, we may collect information you provide directly, such as your full name, phone number, email address, shipping mark/name, delivery address and details about the goods you are importing.",
admin-console/frontend/amooksco-template-analysis/app/(store)/privacy/page.tsx:41:      "We apply reasonable technical and organisational measures to protect your data. Tracking and customer records are held under tenant isolation on the AfruHeritage platform and accessible only to authorised AMOOKSCO staff.",
admin-console/frontend/amooksco-template-analysis/app/(store)/privacy/page.tsx:64:        description="Last updated: this policy explains how we handle your information when you use AMOOKSCO Logistics."
admin-console/frontend/amooksco-template-analysis/app/(store)/cookies/page.tsx:5:  title: "Cookies Policy | AMOOKSCO Logistics",
admin-console/frontend/amooksco-template-analysis/app/(store)/cookies/page.tsx:6:  description: "How AMOOKSCO Logistics uses cookies and similar technologies.",
admin-console/frontend/amooksco-template-analysis/app/(store)/cookies/page.tsx:53:                AMOOKSCO Logistics uses cookies to keep the storefront and staff
admin-console/frontend/amooksco-template-analysis/app/(store)/support/page.tsx:6:import { billingStaff, contacts, waLink, whatsapp } from "@/lib/amooksco"
admin-console/frontend/amooksco-template-analysis/app/(store)/support/page.tsx:9:  title: "Support | AMOOKSCO Logistics",
admin-console/frontend/amooksco-template-analysis/app/(store)/support/page.tsx:11:    "Get help from AMOOKSCO Logistics. Submit a support ticket or reach our tracking and billing departments directly.",
admin-console/frontend/amooksco-template-analysis/app/(store)/support/page.tsx:42:                  href={waLink(whatsapp.tracking, "Hello AMOOKSCO support team,")}
admin-console/frontend/amooksco-template-analysis/app/(store)/about/page.tsx:5:import { brand } from "@/lib/amooksco"
admin-console/frontend/amooksco-template-analysis/app/(store)/about/page.tsx:8:  title: "About Us | AMOOKSCO Logistics",
admin-console/frontend/amooksco-template-analysis/app/(store)/about/page.tsx:10:    "Learn about AMOOKSCO Logistics — your trusted China to Ghana freight forwarding partner for sea cargo, air cargo, procurement and delivery.",
admin-console/frontend/amooksco-template-analysis/app/(store)/about/page.tsx:51:                AMOOKSCO Logistics is a Ghanaian-owned freight forwarding company
admin-console/frontend/amooksco-template-analysis/app/(store)/about/page.tsx:72:                src="/tenant-assets/amooksco/china-warehouse.jpeg"
admin-console/frontend/amooksco-template-analysis/app/(store)/about/page.tsx:73:                alt="AMOOKSCO China warehouse facility"
admin-console/frontend/amooksco-template-analysis/app/(store)/new-arrivals/page.tsx:6:  title: "New Arrivals — AMOOKSCO Logistics",
admin-console/frontend/amooksco-template-analysis/app/(store)/new-arrivals/page.tsx:8:    "Latest container arrivals, in-transit shipments and China warehouse updates from AMOOKSCO Logistics.",
app/plugins/amooksco_template_plugin.py:2:Amooksco Template Auto-Fix Plugin
app/plugins/amooksco_template_plugin.py:4:This plugin handles the automatic configuration for the Amooksco Logistics template,
app/plugins/amooksco_template_plugin.py:14:class AmookscoTemplatePlugin(BasePlugin):
app/plugins/amooksco_template_plugin.py:15:    """Auto-fix plugin for Amooksco Logistics template."""
app/plugins/amooksco_template_plugin.py:17:    name = "amooksco_template"
app/plugins/amooksco_template_plugin.py:18:    feature_name = "Amooksco Logistics Template"
app/plugins/amooksco_template_plugin.py:33:        """Check if Amooksco template features are properly configured."""
app/plugins/amooksco_template_plugin.py:45:        """Enable all required features for Amooksco template."""
app/plugins/amooksco_template_plugin.py:70:        # Set Amooksco-specific branding
app/plugins/amooksco_template_plugin.py:74:        branding.theme_class = "theme-amooksco"
app/plugins/amooksco_template_plugin.py:84:        """Return health status for Amooksco template features."""
app/plugins/amooksco_template_plugin.py:104:        This method identifies mock tracking data in the Amooksco template
app/plugins/amooksco_template_plugin.py:137:PLUGIN = AmookscoTemplatePlugin()
app/api/routes/tenant_context.py:30:        # Extract subdomain (e.g., "amooksco" from "amooksco.afruheritage.com")
app/api/routes/tenant_context.py:48:    """Resolve tenant by subdomain (e.g., amooksco for amooksco.afruheritage.com).
app/api/routes/storefront_templates.py:38:        "template_code": "amooksco",
app/api/routes/storefront_templates.py:39:        "name": "Amooksco Logistics",
app/api/routes/storefront_templates.py:50:            "theme_class": "theme-amooksco",
app/api/routes/storefront_templates.py:51:            "image": "/images/amooksco-hero.png",
app/services/shipment_service.py:1049:def _strip_shipping_mark_prefix(name: str, prefix: str = "AMOOKSCO") -> str:
app/services/page_generator_service.py:89:            "amooksco": ["home", "about", "services", "contact", "tracking"],
scripts/uat_amooskco.py:3:UAT Feature Verification Script for Amooskco tenant.
scripts/uat_amooskco.py:8:Usage: python3 scripts/uat_amooskco.py
scripts/uat_amooskco.py:25:AMOOKSCO_SLUG = "amooksco-logistics"
scripts/uat_amooskco.py:26:AMOOKSCO_TENANT_ID = None  # will be resolved
scripts/uat_amooskco.py:29:amooskco_user_email = None
scripts/uat_amooskco.py:30:amooskco_user_password = None
scripts/uat_amooskco.py:31:amooskco_user_id = None
scripts/uat_amooskco.py:127:    """Test: Can Amooskco storefront load?"""
scripts/uat_amooskco.py:128:    section("TEST 4: Amooskco Storefront")
scripts/uat_amooskco.py:129:    global AMOOKSCO_TENANT_ID
scripts/uat_amooskco.py:132:    ok, data, code = api_get(f"{API_BASE}/tenants/lookup?slug={AMOOKSCO_SLUG}", token=platform_token)
scripts/uat_amooskco.py:134:        AMOOKSCO_TENANT_ID = data["id"]
scripts/uat_amooskco.py:135:        log("Tenant lookup", True, f"ID: {AMOOKSCO_TENANT_ID}")
scripts/uat_amooskco.py:141:    ok, data, code = api_get(f"{API_BASE}/branding/{AMOOKSCO_TENANT_ID}", token=platform_token)
scripts/uat_amooskco.py:148:    ok, data, code = api_get(f"{API_BASE}/branding/public/{AMOOKSCO_TENANT_ID}")
scripts/uat_amooskco.py:166:    """Test: Can Amooskco admin upload members?"""
scripts/uat_amooskco.py:168:    if not AMOOKSCO_TENANT_ID:
scripts/uat_amooskco.py:173:    ok, data, code = api_get(f"{API_BASE}/shipments/{AMOOKSCO_TENANT_ID}/members", token=platform_token)
scripts/uat_amooskco.py:180:    ok, data, code = api_get(f"{API_BASE}/users?tenant_id={AMOOKSCO_TENANT_ID}", token=platform_token)
scripts/uat_amooskco.py:188:    ok, data, code = api_post(f"{API_BASE}/shipments/{AMOOKSCO_TENANT_ID}/members", data={
scripts/uat_amooskco.py:203:    if not AMOOKSCO_TENANT_ID:
scripts/uat_amooskco.py:212:        r = requests.post(f"{API_BASE}/users/bulk-import/preview?tenant_id={AMOOKSCO_TENANT_ID}", files=files, headers=headers, timeout=15)
scripts/uat_amooskco.py:223:        r = requests.post(f"{API_BASE}/users/bulk-import?tenant_id={AMOOKSCO_TENANT_ID}&send_invite_email=false", files=files, headers=headers, timeout=15)
scripts/uat_amooskco.py:236:    if not AMOOKSCO_TENANT_ID:
scripts/uat_amooskco.py:241:    ok, data, code = api_get(f"{API_BASE}/shipments/{AMOOKSCO_TENANT_ID}", token=platform_token)
scripts/uat_amooskco.py:251:                ok2, data2, code2 = api_get(f"{API_BASE}/shipments/public/track/{AMOOKSCO_TENANT_ID}/{tracking_num}")
scripts/uat_amooskco.py:260:            ok2, data2, code2 = api_post(f"{API_BASE}/shipments/{AMOOKSCO_TENANT_ID}", data={
scripts/uat_amooskco.py:281:                ok3, data3, code3 = api_get(f"{API_BASE}/shipments/public/track/{AMOOKSCO_TENANT_ID}/UAT{int(time.time())}")
scripts/uat_amooskco.py:293:    ok, data, code = api_get(f"{API_BASE}/shipments/public/track/{AMOOKSCO_TENANT_ID}/NONEXISTENT999", expect_status=404)
scripts/uat_amooskco.py:311:    if AMOOKSCO_TENANT_ID:
scripts/uat_amooskco.py:313:        ok, data, code = api_get(f"{API_BASE}/billing/subscriptions/{AMOOKSCO_TENANT_ID}", token=platform_token)
scripts/uat_amooskco.py:320:        ok, data, code = api_get(f"{API_BASE}/billing/wallets/{AMOOKSCO_TENANT_ID}", token=platform_token)
scripts/uat_amooskco.py:329:    if not AMOOKSCO_TENANT_ID:
scripts/uat_amooskco.py:334:    ok, data, code = api_get(f"{API_BASE}/users?tenant_id={AMOOKSCO_TENANT_ID}", token=platform_token)
scripts/uat_amooskco.py:340:            ok2, data2, code2 = api_post(f"{API_BASE}/users/{user_id}/send-reset-link?tenant_id={AMOOKSCO_TENANT_ID}", token=platform_token)
scripts/uat_amooskco.py:413:    if AMOOKSCO_TENANT_ID and admin_token:
scripts/uat_amooskco.py:417:            r = requests.get(f"{ADMIN_BASE}/templates/branding/{AMOOKSCO_TENANT_ID}", headers=headers, timeout=10)
scripts/uat_amooskco.py:432:        "tenant_slug": AMOOKSCO_SLUG,
scripts/uat_amooskco.py:444:    if AMOOKSCO_TENANT_ID:
scripts/uat_amooskco.py:445:        ok, data, code = api_get(f"{API_BASE}/warehouse-notices/{AMOOKSCO_SLUG}")
scripts/uat_amooskco.py:456:    if not AMOOKSCO_TENANT_ID:
scripts/uat_amooskco.py:460:    ok, data, code = api_get(f"{API_BASE}/geo/{AMOOKSCO_TENANT_ID}/shipment-routes", token=platform_token)
scripts/uat_amooskco.py:468:    ok, data, code = api_get(f"{API_BASE}/geo/geocode?tenant_id={AMOOKSCO_TENANT_ID}&address=Accra&country=Ghana", token=platform_token)
scripts/uat_amooskco.py:475:    ok, data, code = api_get(f"{API_BASE}/geo/route?tenant_id={AMOOKSCO_TENANT_ID}&origin_lat=23.1291&origin_lng=113.2644&dest_lat=5.6037&dest_lng=-0.1870&origin_city=Guangzhou&dest_city=Accra", token=platform_token)
scripts/uat_amooskco.py:483:print(f"  UAT FEATURE VERIFICATION — AMOOKSCO")
scripts/fix_amooksco_subscription.py:9:TENANT_SLUG = os.getenv("TENANT_SLUG", "amooksco-logistics")
scripts/import_amooksco_members_direct.py:6:CSV=Path("data/tenants/amooksco/imports/customers/amooksco_members_normalized_for_bulk_import.csv")
scripts/import_amooksco_members_direct.py:16:    tenant=conn.execute("SELECT id FROM tenants WHERE slug='amooksco-logistics'").fetchone()
scripts/import_amooksco_members_direct.py:18:        raise SystemExit("Amooksco tenant not found")
scripts/import_amooksco_members_direct.py:60:                """,(uuid.uuid4(),tenant_id,name or phone or email,nn,phone,np,email,'{"import":"amooksco_whatsapp"}'))
scripts/afruheritage_e2e_status_audit.sh:8:TENANT_SLUG="${TENANT_SLUG:-amooksco-logistics}"
scripts/afruheritage_e2e_status_audit.sh:55:check_http "Amooskco storefront" "$FRONTEND/store/$TENANT_SLUG" "200"
scripts/afruheritage_e2e_status_audit.sh:89:section "5. Amooskco Admin Account"
scripts/afruheritage_e2e_status_audit.sh:92:psqlq "SELECT email || '|' || role || '|' || is_superuser || '|' || is_tenant_admin || '|' || is_active || '|' || must_reset_password FROM users WHERE email='admin@amooksco.com';" | while IFS='|' read -r email role super tenant_admin active reset; do
scripts/afruheritage_e2e_status_audit.sh:117:"/tenant-assets/amooksco/logo.png" \
scripts/afruheritage_e2e_status_audit.sh:118:"/tenant-assets/amooksco/new-arrivals.jpeg" \
scripts/afruheritage_e2e_status_audit.sh:119:"/tenant-assets/amooksco/warehouse/unidentified-items/unidentified-items-1.jpeg"; do
scripts/import_amooksco_mvp.py:7:TENANT_NAME = "Amooksco Logistics"
scripts/import_amooksco_mvp.py:8:TENANT_SLUG = "amooksco-logistics"
scripts/import_amooksco_mvp.py:9:TENANT_EMAIL = "admin@amooksco.com"
scripts/import_amooksco_mvp.py:10:BASE = Path("data/tenants/amooksco/imports")
scripts/import_amooksco_mvp.py:42:    """, (tid, TENANT_NAME, TENANT_SLUG, TENANT_EMAIL, "amooksco.com", "amooksco.com"))
scripts/import_amooksco_mvp.py:236:                    VALUES (%s,%s,'received_at_warehouse','Cargo record imported into Amooksco portal')
scripts/extract_tenancy_architecture.sh:64:docker compose exec -T postgres psql -U afruheritage -d afruheritage <<'SQL' > "$OUT/db/amooksco-live-data.txt"
scripts/extract_tenancy_architecture.sh:65:SELECT * FROM tenants WHERE slug='amooksco-logistics';
scripts/extract_tenancy_architecture.sh:66:SELECT * FROM billing_subscriptions WHERE tenant_id=(SELECT id FROM tenants WHERE slug='amooksco-logistics');
scripts/extract_tenancy_architecture.sh:67:SELECT * FROM warehouse_notices WHERE tenant_id=(SELECT id FROM tenants WHERE slug='amooksco-logistics');
scripts/extract_tenancy_architecture.sh:68:SELECT count(*) AS cargo_records FROM cargo_records WHERE tenant_id=(SELECT id FROM tenants WHERE slug='amooksco-logistics');
scripts/extract_tenancy_architecture.sh:69:SELECT count(*) AS tenant_customers FROM tenant_customers WHERE tenant_id=(SELECT id FROM tenants WHERE slug='amooksco-logistics');
scripts/extract_tenancy_architecture.sh:70:SELECT email, role, is_superuser, is_tenant_admin, is_active FROM users WHERE tenant_id=(SELECT id FROM tenants WHERE slug='amooksco-logistics');
scripts/extract_tenancy_architecture.sh:105:# 7. Current Amooskco V2 source and active route comparison
scripts/extract_tenancy_architecture.sh:106:mkdir -p "$OUT/frontend/amooksco-v2-source" "$OUT/frontend/active-store-route"
scripts/extract_tenancy_architecture.sh:107:cp -a tenant-theme-sources/amooksco-v2 "$OUT/frontend/amooksco-v2-source/" 2>/dev/null || true
scripts/extract_tenancy_architecture.sh:109:cp -a frontend/components/amooksco-v2 "$OUT/frontend/active-store-route/components-amooksco-v2" 2>/dev/null || true
scripts/extract_tenancy_architecture.sh:110:cp -a frontend/lib/amooksco.ts "$OUT/frontend/active-store-route/amooksco.ts" 2>/dev/null || true
```
