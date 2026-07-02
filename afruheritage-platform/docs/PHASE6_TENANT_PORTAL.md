# Phase 6 — Tenant Portal
## Architecture Refactor Report

> Phase 6 creates a dedicated Tenant Portal — a separate authenticated area with its own
> layout, sidebar navigation, and tenant branding. The portal is accessible at `/portal`
> and requires authentication. All portal pages use TenantContext for dynamic branding.

---

## 1. What Was Built

### New Files

| File | Purpose |
|---|---|
| `app/portal/layout.tsx` | Portal layout with auth guard, sidebar + header, tenant-aware metadata |
| `app/portal/page.tsx` | Dashboard overview with stats cards and recent activity |
| `app/portal/cargo/page.tsx` | Cargo management placeholder |
| `app/portal/orders/page.tsx` | Orders management placeholder |
| `app/portal/customers/page.tsx` | Customer directory placeholder |
| `app/portal/fleet/page.tsx` | Fleet management placeholder |
| `app/portal/warehouse/page.tsx` | Warehouse management placeholder |
| `app/portal/billing/page.tsx` | Billing & subscription page with tenant plan info |
| `app/portal/documents/page.tsx` | Document management placeholder |
| `app/portal/settings/page.tsx` | Tenant settings view with company info, theme color |
| `components/portal/portal-sidebar.tsx` | Sidebar navigation with 4 sections, tenant logo, plan badge |
| `components/portal/portal-header.tsx` | Top header with user dropdown, logout |

### Modified Files

| File | Change |
|---|---|
| `app/platform/api-integration/page.tsx` | Replaced hardcoded "Afruheritage" with `{companyName}` from `useTenant()` |

---

## 2. Portal Architecture

```
/portal (layout.tsx — auth guard)
  ├── Sidebar (portal-sidebar.tsx)
  │   ├── TenantLogo (from Phase 3)
  │   ├── Navigation Sections:
  │   │   ├── Overview: Dashboard
  │   │   ├── Operations: Cargo, Orders, Customers
  │   │   ├── Logistics: Fleet, Warehouse
  │   │   └── Account: Billing, Documents, Settings
  │   └── Subscription plan badge
  │
  ├── Header (portal-header.tsx)
  │   ├── User avatar + name
  │   └── Dropdown: role display, sign out
  │
  └── Main content area (per-page)
      ├── Dashboard — stats cards, recent activity
      ├── Cargo — cargo operations
      ├── Orders — order management
      ├── Customers — customer directory
      ├── Fleet — fleet operations
      ├── Warehouse — warehouse management
      ├── Billing — subscription plan, status
      ├── Documents — document management
      └── Settings — tenant info, theme color
```

### Auth Guard
- `portal/layout.tsx` calls `getCurrentUserServer()` on every request
- Redirects to `/login` if not authenticated
- All portal pages inherit this guard

### Tenant Branding
- Sidebar uses `TenantLogo` component (Phase 3)
- All pages use `useTenant()` for company name
- Sidebar shows subscription `plan_code`
- Settings page displays tenant slug, language, primary color
- Billing page shows plan and status from `TenantSubscriptionInfo`

---

## 3. Portal Routes

| Route | Title | Icon | Section |
|---|---|---|---|
| `/portal` | Dashboard | LayoutDashboard | Overview |
| `/portal/cargo` | Cargo Management | Package | Operations |
| `/portal/orders` | Orders | ShoppingCart | Operations |
| `/portal/customers` | Customers | Users | Operations |
| `/portal/fleet` | Fleet Management | Truck | Logistics |
| `/portal/warehouse` | Warehouse | Warehouse | Logistics |
| `/portal/billing` | Billing | CreditCard | Account |
| `/portal/documents` | Documents | FileText | Account |
| `/portal/settings` | Settings | Settings | Account |

---

## 4. Verification Results

### TypeScript
- ✅ `tsc --noEmit` — clean, no errors

### Next.js Build
- ✅ `next build` — successful, all 33 routes built
- ✅ 8 new portal routes: `/portal`, `/portal/billing`, `/portal/cargo`, `/portal/customers`, `/portal/documents`, `/portal/fleet`, `/portal/orders`, `/portal/settings`, `/portal/warehouse`
- ✅ All pages dynamic (server-rendered on demand)
- ✅ Middleware active

---

## 5. Relationship to Existing Routes

| Existing Route | Purpose | Phase 6 Status |
|---|---|---|
| `/admin` | Admin dashboard (analytics) | Retained — will be refactored in Phase 7 |
| `/admin/users` | User management | Retained — will be refactored in Phase 7 |
| `/customer` | Customer dashboard | Retained — customer-facing, separate from tenant portal |
| `/kyc` | KYC page | Retained — customer-facing |
| `/platform` | Platform capabilities page | Retained — public marketing page |
| `/platform/*` | Platform sub-pages | Retained — public marketing pages |

The new `/portal/*` routes are the **tenant operations portal** — where tenant staff manage
their business. This is separate from:
- Public website (`/`, `/about`, `/track`, etc.)
- Customer dashboard (`/customer`)
- Platform admin (`/admin` — to be refactored in Phase 7)

---

## 6. What Was NOT Changed

- No database schema changes
- No backend route changes
- No authentication flow altered (portal uses existing `getCurrentUserServer()`)
- No existing routes removed
- Admin/customer pages retained as-is (Phase 7 scope)

---

## 7. Next Steps

Phase 7 will build the Platform Admin:
- Separate from tenant operations
- Tenant management (create, edit, suspend tenants)
- Subscription management
- Marketplace/templates
- Global settings
- Refactor existing `/admin` routes into proper platform admin layout
