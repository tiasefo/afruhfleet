# Phase 7 — Platform Admin
## Architecture Refactor Report

> Phase 7 creates a dedicated Platform Admin area with its own layout, sidebar navigation,
> and `platform_admin` role guard. The admin area is separate from tenant operations
> and manages all tenants, subscriptions, marketplace, templates, and global settings.

---

## 1. What Was Built

### New Files

| File | Purpose |
|---|---|
| `app/admin/layout.tsx` | Admin layout with `platform_admin` auth guard, sidebar + header |
| `components/admin/admin-sidebar.tsx` | Sidebar with 3 sections: Overview, Management, Platform |
| `components/admin/admin-header.tsx` | Top header with user dropdown, logout |
| `app/admin/tenants/page.tsx` | Tenant directory with search, create button |
| `app/admin/subscriptions/page.tsx` | Subscription overview with stats cards |
| `app/admin/marketplace/page.tsx` | Marketplace listings management |
| `app/admin/templates/page.tsx` | Theme/page template library |
| `app/admin/settings/page.tsx` | Global platform settings view |

### Modified Files

| File | Change |
|---|---|
| `lib/auth.ts` | Added `platform_admin` role to `UserRole` type; added `isPlatformAdmin()` helper; `isAdmin()` now returns true for both `admin` and `platform_admin` |
| `app/admin/page.tsx` | Removed inline auth guard (layout handles it); replaced with stats cards dashboard |
| `app/admin/users/page.tsx` | Removed inline auth guard; simplified to use layout's auth |

---

## 2. Admin Architecture

```
/admin (layout.tsx — platform_admin auth guard)
  ├── Sidebar (admin-sidebar.tsx)
  │   ├── Platform Admin logo
  │   ├── Navigation Sections:
  │   │   ├── Overview: Dashboard
  │   │   ├── Management: Tenants, Subscriptions, Users
  │   │   └── Platform: Marketplace, Templates, Global Settings
  │   └── (no tenant branding — this is platform-level)
  │
  ├── Header (admin-header.tsx)
  │   ├── User avatar + name
  │   └── Dropdown: "Platform Administrator", sign out
  │
  └── Main content area (per-page)
      ├── Dashboard — stats cards (tenants, subscriptions, users, marketplace)
      ├── Tenants — search, create, tenant directory
      ├── Subscriptions — stats (active, trialing, suspended), list
      ├── Users — user management (existing component)
      ├── Marketplace — listings management
      ├── Templates — theme/layout template library
      └── Settings — platform config (name, languages, defaults)
```

### Auth Guard
- `admin/layout.tsx` calls `getCurrentUserServer()` and `isPlatformAdmin()` on every request
- Redirects to `/login` if not authenticated or not `platform_admin` role
- All admin pages inherit this guard from the layout

### Role Hierarchy
```
platform_admin → manages all tenants, subscriptions, marketplace, global settings
admin          → tenant-level admin (portal access, user management within tenant)
customer       → customer dashboard (track shipments, KYC, support tickets)
```

---

## 3. Admin Routes

| Route | Title | Icon | Section |
|---|---|---|---|
| `/admin` | Platform Dashboard | LayoutDashboard | Overview |
| `/admin/tenants` | Tenants | Building2 | Management |
| `/admin/subscriptions` | Subscriptions | CreditCard | Management |
| `/admin/users` | User Directory | Settings | Management |
| `/admin/marketplace` | Marketplace | Store | Platform |
| `/admin/templates` | Templates | Palette | Platform |
| `/admin/settings` | Global Settings | Globe | Platform |

---

## 4. Separation of Concerns

| Area | Route Prefix | Auth Role | Layout | Purpose |
|---|---|---|---|---|
| Public Website | `/` | None | `app/layout.tsx` | Marketing, tracking, support |
| Tenant Portal | `/portal` | `admin` | `app/portal/layout.tsx` | Tenant operations |
| Platform Admin | `/admin` | `platform_admin` | `app/admin/layout.tsx` | Platform management |
| Customer Dashboard | `/customer` | `customer` | (inline) | Customer self-service |

---

## 5. Verification Results

### TypeScript
- ✅ `tsc --noEmit` — clean, no errors

### Next.js Build
- ✅ `next build` — successful, all 38 routes built
- ✅ 5 new admin routes: `/admin/tenants`, `/admin/subscriptions`, `/admin/marketplace`, `/admin/templates`, `/admin/settings`
- ✅ All pages dynamic (server-rendered on demand)
- ✅ Middleware active

---

## 6. What Was NOT Changed

- No database schema changes
- No backend route changes
- No existing routes removed
- Customer dashboard (`/customer`) retained as-is
- Platform marketing pages (`/platform/*`) retained as-is

---

## 7. Next Steps

Phase 8 will implement Authentication separation:
- Separate Platform Login (for platform_admin)
- Separate Tenant Login (for admin/tenant staff)
- Separate Customer Login (for customers)
- Public website remains accessible without auth
- Each login flow redirects to appropriate area
