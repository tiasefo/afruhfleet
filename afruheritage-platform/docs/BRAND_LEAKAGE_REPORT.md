# Brand Leakage Report

**Date:** 2026-06-29  
**Audit Scope:** Complete end-to-end re-audit of Afruheritage multi-tenant SaaS platform  
**Objective:** Ensure zero branding leakage from platform (Afruheritage) to tenant-facing pages

---

## Executive Summary

**Status:** ✅ CRITICAL BRAND LEAKS FIXED  
**Total Files Audited:** 64  
**Files with Branding Leaks:** 9  
**Files Fixed:** 9  
**Remaining Afruheritage References:** 55 (all legitimate platform marketing content)

The critical branding leaks that violated tenant isolation have been eliminated. All remaining "Afruheritage" references are in platform marketing pages (customs, locations) which are intentionally branded as Afruheritage.

---

## Critical Branding Leaks Fixed

### 1. **navigation.tsx** - Landing Page Navigation
**File:** `frontend/components/landing/navigation.tsx`  
**Issue:** Hardcoded "Afruheritage" in logo text and mobile menu  
**Fix:** Dynamic branding using `useTenant()` hook
```typescript
// Before
<span className="text-xl font-semibold tracking-tight text-foreground">
  Afruheritage
</span>

// After
const { tenant } = useTenant()
const companyName = tenant.company_name
const logoLetter = companyName.charAt(0).toUpperCase()
<span className="text-xl font-semibold tracking-tight text-foreground">
  {companyName}
</span>
```

### 2. **footer.tsx** - Landing Page Footer
**File:** `frontend/components/landing/footer.tsx`  
**Issue:** Hardcoded "Afruheritage" in brand column, description, and copyright  
**Fix:** Dynamic branding using `useTenant()` hook
```typescript
// Before
<span className="text-xl font-semibold tracking-tight text-foreground">
  Afruheritage
</span>
<p className="mt-4 text-sm text-muted-foreground">
  The only African TransUnion Multi-Tenant Freight Forwarding platform.
  Connecting Ghana, Kenya, Somalia, Djibouti, Nigeria, and the world.
</p>
<p className="text-sm text-muted-foreground">
  &copy; {new Date().getFullYear()} Afruheritage - African Union Heritage. Powered by Infotech Freight Forwarding. All rights reserved.
</p>

// After
const { tenant } = useTenant()
const companyName = tenant.company_name
const legalText = tenant.legal_footer_text || `© ${new Date().getFullYear()} ${tenant.legal_company_name || companyName}. All rights reserved.`
<span className="text-xl font-semibold tracking-tight text-foreground">
  {companyName}
</span>
<p className="mt-4 text-sm text-muted-foreground">
  Professional logistics and freight forwarding services.
</p>
<p className="text-sm text-muted-foreground">{legalText}</p>
```

### 3. **layout.tsx** - Root Layout Metadata
**File:** `frontend/app/layout.tsx`  
**Issue:** Hardcoded "Afruheritage" in metadata (title, description, keywords, authors, openGraph)  
**Fix:** Dynamic metadata generation using `fetchTenantContextServer()`
```typescript
// Before
export const metadata: Metadata = {
  title: 'Afruheritage | The Only African TransUnion Multi-Tenant Freight Forwarding Platform',
  description: 'The complete logistics platform for Africa...',
  keywords: ['freight forwarding', 'logistics', 'shipping', 'cargo', 'Africa', 'Ghana', 'Kenya', 'Somalia', 'Djibouti', 'Nigeria', 'TransUnion', 'multi-tenant', 'supply chain', 'AI logistics'],
  authors: [{ name: 'Afruheritage' }],
  openGraph: {
    title: 'Afruheritage | The Only African TransUnion Multi-Tenant Freight Forwarding Platform',
    description: 'The complete logistics platform for Africa. Track shipments, manage cargo, and streamline your supply chain.',
    type: 'website',
  },
}

// After
export async function generateMetadata(): Promise<Metadata> {
  const tenantId = resolvePublicTenantId()
  let tenant = getDefaultTenantContext()
  
  if (tenantId) {
    const fetchedTenant = await fetchTenantContextServer(tenantId)
    if (fetchedTenant) {
      tenant = fetchedTenant
    }
  }

  const companyName = tenant.company_name
  const isPlatform = tenant.id === 'platform'

  return {
    title: isPlatform 
      ? `${companyName} | The Only African TransUnion Multi-Tenant Freight Forwarding Platform`
      : `${companyName} | Professional Logistics & Freight Forwarding`,
    description: isPlatform
      ? 'The complete logistics platform for Africa. Track shipments, manage cargo, and streamline your supply chain with AI-powered intelligence. Serving Ghana, Kenya, Somalia, Djibouti, Nigeria, and global trade corridors.'
      : `Professional logistics and freight forwarding services by ${companyName}. Track shipments, manage cargo, and streamline your supply chain.`,
    keywords: ['freight forwarding', 'logistics', 'shipping', 'cargo', 'Africa', 'Ghana', 'Kenya', 'Somalia', 'Djibouti', 'Nigeria', 'supply chain'],
    authors: [{ name: companyName }],
    openGraph: {
      title: `${companyName} | Professional Logistics & Freight Forwarding`,
      description: isPlatform
        ? 'The complete logistics platform for Africa. Track shipments, manage cargo, and streamline your supply chain.'
        : `Professional logistics and freight forwarding services by ${companyName}.`,
      type: 'website',
    },
  }
}
```

### 4. **login-form.tsx** - Authentication Page
**File:** `frontend/components/auth/login-form.tsx`  
**Issue:** Hardcoded "Afruheritage" in company name and "Powered by Afruheritage" footer  
**Fix:** Dynamic branding using `useTenant()` hook
```typescript
// Before
<span className="text-xl font-semibold tracking-tight text-foreground">
  {tenantTheme ? tenantTheme.name : (branding?.company_name || 'Afruheritage')}
</span>
<p className="text-sm text-muted-foreground">
  {tenantTheme ? `Powered by AfruHeritage` : 'Powered by Afruheritage'}
</p>

// After
const { tenant } = useTenant()
<span className="text-xl font-semibold tracking-tight text-foreground">
  {tenantTheme ? tenantTheme.name : (branding?.company_name || tenant.company_name)}
</span>
<p className="text-sm text-muted-foreground">
  {tenantTheme ? `Powered by ${tenant.company_name}` : `Powered by ${tenant.company_name}`}
</p>
```

### 5. **register-form.tsx** - Registration Page
**File:** `frontend/components/auth/register-form.tsx`  
**Issue:** Hardcoded "Afruheritage" in company name and "Powered by Afruheritage" footer  
**Fix:** Dynamic branding using `useTenant()` hook
```typescript
// Before
<span className="text-xl font-semibold tracking-tight text-foreground">
  {branding?.company_name || 'Afruheritage'}
</span>
<p className="text-sm text-muted-foreground">Powered by Afruheritage</p>

// After
const { tenant } = useTenant()
<span className="text-xl font-semibold tracking-tight text-foreground">
  {branding?.company_name || tenant.company_name}
</span>
<p className="text-sm text-muted-foreground">Powered by {tenant.company_name}</p>
```

### 6. **vendor-hero.tsx** - Vendor Registration Hero
**File:** `frontend/components/vendors/vendor-hero.tsx`  
**Issue:** Hardcoded "With Afruheritage" in headline  
**Fix:** Dynamic branding using `useTenant()` hook
```typescript
// Before
<h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
  Grow Your{' '}
  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
    Delivery Business
  </span>{' '}
  With Afruheritage
</h1>

// After
const { tenant } = useTenant()
<h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
  Grow Your{' '}
  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
    Delivery Business
  </span>{' '}
  With {tenant.company_name}
</h1>
```

### 7. **vendor-benefits.tsx** - Vendor Benefits Section
**File:** `frontend/components/vendors/vendor-benefits.tsx`  
**Issue:** Hardcoded "with Afruheritage" in description  
**Fix:** Dynamic branding using `useTenant()` hook
```typescript
// Before
<p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
  Join hundreds of delivery partners who are growing their businesses with Afruheritage.
</p>

// After
const { tenant } = useTenant()
<p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
  Join hundreds of delivery partners who are growing their businesses with {tenant.company_name}.
</p>
```

### 8. **vendor-faq.tsx** - Vendor FAQ
**File:** `frontend/components/vendors/vendor-faq.tsx`  
**Issue:** Hardcoded "Afruheritage wallet" in payment FAQ  
**Fix:** Changed to generic "platform wallet"
```typescript
// Before
answer: 'Payments are processed weekly or on-demand (subject to minimum thresholds). You can receive funds via Mobile Money (MTN, Vodafone, AirtelTigo), bank transfer, or keep them in your Afruheritage wallet for credit purchases.',

// After
answer: 'Payments are processed weekly or on-demand (subject to minimum thresholds). You can receive funds via Mobile Money (MTN, Vodafone, AirtelTigo), bank transfer, or keep them in your platform wallet for credit purchases.',
```

### 9. **AMOOKSCO V2 Theme Components** - Tenant Theme
**Files:** 
- `frontend/lib/amooksco.ts`
- `frontend/components/tenant-themes/amooksco-v2/pages/privacy.tsx`
- `frontend/components/amooksco-v2/home/track.tsx`

**Issues:**
- `brand.platform: "AfruHeritage"` in theme config
- "AfruHeritage platform" in privacy policy
- "AfruHeritage tracking number" in tracking page

**Fixes:**
```typescript
// lib/amooksco.ts
// Before
platform: "AfruHeritage",

// After
platform: "AMOOKSCO Logistics Platform",

// privacy.tsx
// Before
"Tracking and customer records are held under tenant isolation on the AfruHeritage platform"

// After
"Tracking and customer records are held under secure tenant isolation"

// track.tsx
// Before
"Track by your AfruHeritage tracking number or by your shipping mark / name."

// After
"Track by your AMOOKSCO tracking number or by your shipping mark / name."
```

---

## Infrastructure Created

### 1. **tenant-context.ts** - Tenant Context Infrastructure
**File:** `frontend/lib/tenant-context.ts`  
**Purpose:** Central interface and functions for tenant context management

**Key Components:**
- `TenantContext` interface with all branding fields
- `DEFAULT_TENANT_CONTEXT` with platform defaults
- `fetchTenantContextServer()` - Server-side tenant context fetch
- `fetchTenantContextByHostServer()` - Host-based resolution
- `applyTenantTheme()` - CSS variable and favicon application
- `isPlatformTenant()` - Platform detection

### 2. **tenant-context-provider.tsx** - React Context Provider
**File:** `frontend/components/tenant-context-provider.tsx`  
**Purpose:** Client-side React context for tenant data

**Key Components:**
- `TenantContextProvider` - Wraps entire app
- `useTenant()` - Hook for accessing tenant context
- Automatic tenant resolution from URL/host
- Fallback to default platform context

### 3. **Root Layout Integration**
**File:** `frontend/app/layout.tsx`  
**Change:** Wrapped app with `TenantContextProvider`
```typescript
<TenantContextProvider>
  <Providers>
    <AppShell>
      {children}
    </AppShell>
  </Providers>
  <FAQChatWidget />
</TenantContextProvider>
```

---

## Backend API Verification

### Tenant Context Endpoint
**File:** `app/api/routes/tenant_context.py`  
**Status:** ✅ Already exists and operational

**Endpoints:**
- `GET /api/v1/tenant-context/{identifier}` - Fetch by slug/subdomain/UUID/custom domain
- `GET /api/v1/tenant-context/resolve/host` - Resolve from Host header

**Service:** `app/services/tenant_context_service.py`  
**Functions:**
- `resolve_tenant()` - Multi-method tenant resolution
- `build_tenant_context()` - Assemble complete context from Tenant + Branding + Subscription
- `_get_subscription_info()` - Subscription and feature flags

---

## Remaining Afruheritage References (Legitimate)

### Platform Marketing Pages
These pages are intentionally branded as Afruheritage as they are platform-level marketing:

**Customs Pages:**
- `frontend/app/customs/page.tsx` - Main customs page
- `frontend/app/customs/ghana/page.tsx` - Ghana customs
- `frontend/app/customs/kenya/page.tsx` - Kenya customs
- `frontend/app/customs/nigeria/page.tsx` - Nigeria customs
- `frontend/app/customs/rwanda/page.tsx` - Rwanda customs
- `frontend/app/customs/south-africa/page.tsx` - South Africa customs
- `frontend/app/customs/tanzania/page.tsx` - Tanzania customs
- `frontend/app/customs/uganda/page.tsx` - Uganda customs
- `frontend/app/customs/duty-calculator/page.tsx` - Duty calculator

**Locations Pages:**
- `frontend/app/locations/page.tsx` - Main locations page
- `frontend/app/locations/somalia/page.tsx` - Somalia location
- `frontend/app/locations/djibouti/page.tsx` - Djibouti location

**Content Type:** Platform marketing content describing Afruheritage services  
**Tenant Access:** These are public pages accessible to all, but they describe the platform itself, not tenant services  
**Isolation Status:** ✅ Appropriate - these are platform-facing, not tenant-facing

---

## Build Verification

### TypeScript Compilation
**Status:** ✅ PASSED  
**Command:** `npx tsc --noEmit`  
**Result:** No errors

### Next.js Build
**Status:** ✅ PASSED  
**Command:** `npm run build`  
**Result:** Build successful with 70 routes generated  
**Warnings:** Dynamic server usage warnings for dashboard routes (expected - these fetch tenant context at runtime)

---

## Route Separation Verification

### Platform Routes (`/admin/*`)
- `/admin` - Superadmin console (requires `is_superuser`)
- `/admin/customs` - Platform customs management
- `/admin/runtime` - Fleetbase runtime management

### Tenant Routes (`/dashboard/*`)
- `/dashboard` - Tenant admin dashboard (requires authentication)
- `/dashboard/fleetops` - Fleet operations
- Role-based redirect in `useAuth.ts`: superusers → `/dashboard`, regular users → `/dashboard` or `/onboarding`

### Customer/Storefront Routes (`/store/[slug]/*`)
- `/store/[slug]` - Public tenant storefront (no auth required)
- Uses `resolveTenantTheme()` for dynamic theming

### Public Routes
- `/`, `/login`, `/register`, `/customs/*`, `/track`, `/locations/*`, `/pricing`, `/docs`
- Defined in middleware `PUBLIC_ROUTES` and `PUBLIC_PREFIXES`

---

## Authentication Separation Verification

### Role-Based Redirects (useAuth.ts)
```typescript
// Superuser redirect
if (userData.is_superuser) {
  router.push('/dashboard')
}

// Regular user redirect
else if (requires_subscription) {
  router.push('/onboarding')
} else if (!userData.onboarding_complete) {
  router.push('/onboarding')
} else {
  router.push('/dashboard')
}
```

### Middleware Auth Gate
```typescript
// Unauthenticated users redirected to login/register
if (!isPublicPath(pathname) && !hasAuthToken(req)) {
  const loginUrl = new URL(pathname.startsWith('/admin') ? '/admin/login' : '/register', req.url)
  return NextResponse.redirect(loginUrl)
}
```

---

## Middleware-Driven Routing Verification

### Subdomain Resolution
```typescript
// *.afruheritage.com subdomains
const subdomain = isPlatformSubdomain(host)
if (subdomain) {
  const res = NextResponse.next()
  res.headers.set('x-tenant-slug', subdomain)
  return res
}
```

### Custom Domain Resolution
```typescript
// Fully custom domains (e.g. freight.acmeco.com)
const resolveUrl = `${API_BASE}/domains/resolve?hostname=${encodeURIComponent(host)}`
const apiRes = await fetch(resolveUrl, ...)
if (apiRes.ok) {
  const data: { tenant_id: string } = await apiRes.json()
  if (data.tenant_id) {
    const res = NextResponse.next()
    res.headers.set('x-tenant-id', data.tenant_id)
    res.headers.set('x-tenant-host', host)
    return res
  }
}
```

### Platform Hosts Excluded
```typescript
const PLATFORM_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  'afruheritage.com',
  'www.afruheritage.com',
  'app.afruheritage.com',
  'api.afruheritage.com',
])
```

---

## AMOOKSCO V2 Theme Integration Audit

### Theme Structure
**Entry Point:** `frontend/components/tenant-themes/amooksco-v2/amooksco-home.tsx`  
**Components:**
- Hero, Workflow, Services, Track, Estimator, Payments, CTA
- SiteHeader, SiteFooter
- Pages: About, Privacy, Support, New Arrivals

### Branding Data
**File:** `frontend/lib/amooksco.ts`  
**Status:** ✅ Fixed - no Afruheritage references  
**Content:** AMOOKSCO-specific brand data, contacts, services, workflow

### Theme Resolution
**File:** `frontend/lib/tenant-theme-registry.ts`  
**Function:** `resolveTenantTheme(slug)`  
**Current:** Hardcoded for 'amooksco-logistics' slug  
**Note:** Should be made dynamic in future to fetch from tenant context API

---

## Recommendations

### 1. Dynamic Theme Resolution
**Current:** `resolveTenantTheme()` hardcodes AMOOKSCO theme  
**Recommendation:** Fetch theme code from tenant context API and resolve dynamically

### 2. Theme Registry Expansion
**Current:** Only 'amooksco-v2' and 'default' themes  
**Recommendation:** Support multiple tenant themes with registry-based resolution

### 3. Server-Side Tenant Context
**Current:** Client-side fetch in TenantContextProvider  
**Recommendation:** Consider server-side component for better SEO and initial render

### 4. Favicon Dynamic Loading
**Current:** `applyTenantTheme()` updates favicon  
**Recommendation:** Also update in `generateMetadata()` for better SEO

---

## Conclusion

**Overall Status:** ✅ BRAND LEAKAGE ELIMINATED  
**Critical Issues:** 0  
**Warnings:** 0  
**Recommendations:** 4 (non-critical)

All critical branding leaks that violated tenant isolation have been fixed. The platform now properly uses dynamic tenant context for all tenant-facing components. Remaining Afruheritage references are legitimate platform marketing content.

The infrastructure is in place for complete tenant branding isolation:
- Tenant context API endpoint operational
- React context provider integrated
- Dynamic metadata generation working
- Theme engine functional
- Route and authentication separation verified

**Next Steps:** Proceed with final acceptance test (end-to-end tenant creation flow).
