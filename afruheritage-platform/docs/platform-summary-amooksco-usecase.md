# Platform Summary: Goals, Amooksco Use Case, and Challenges

**Document Status**: Architecture Analysis  
**Last Updated**: 2026-07-05  
**Scope**: Platform objectives, Amooksco tenant implementation, challenges, and lessons learned

---

## Platform Objectives

### Core Mission

The Afruheritage Platform is a multi-tenant SaaS platform designed to provide logistics and freight forwarding companies with:

1. **White-label storefronts** - Each tenant gets a branded storefront with their own subdomain or custom domain
2. **Fleetbase integration** - Leverage Fleetbase's logistics engine (drivers, orders, fleet, dispatch, GPS) per tenant
3. **Feature-as-a-service** - Built-in features like tracking, CSV import, group members, maps, AI chat
4. **Multi-language support** - English and Chinese bilingual from day one (China-Ghana logistics focus)
5. **Flexible templates** - Multiple storefront templates (freight, fleet, ecommerce, etc.) with auto-configuration
6. **RBAC hierarchy** - Platform admin → Tenant admin → Customer role inheritance
7. **Custom domain support** - Tenants can use their own domains with SSL via Cloudflare

### Technical Architecture

- **Backend**: FastAPI (port 8000) - Control plane API
- **Frontend**: Next.js (port 3000) - SaaS storefront
- **Admin Console**: Next.js (port 3001) - Platform management
- **Fleetbase**: Shared instance with per-tenant organizations
- **Database**: PostgreSQL with tenant-scoped data
- **Cache**: Redis for session and template caching
- **Domains**: Cloudflare for SSL and DNS management

---

## Amooksco Use Case

### Tenant Profile

**Amooksco Logistics** is a China-Ghana freight forwarding company that needs:

- **Branded storefront**: `amooskco.afruheritage.com` (subdomain) or custom domain
- **China-Ghana logistics focus**: Bilingual support (English/Chinese)
- **Tracking capabilities**: Public tracking page for customers
- **Bulk import**: CSV import for shipments and group members
- **WhatsApp integration**: Direct customer communication
- **Fleetbase integration**: Driver and fleet management
- **Custom branding**: Company colors, logo, legal information

### Intended Customer Journey

1. **Registration**: Amooksco signs up via public form
2. **Approval**: Platform admin reviews and approves the tenant
3. **Provisioning**: Fleetbase organization created, infrastructure setup
4. **Launch**: Storefront becomes active at `amooskco.afruheritage.com`
5. **Configuration**: Amooksco selects template, configures branding
6. **Operations**: Amooksco manages shipments, drivers, customers via storefront
7. **Custom Domain**: Optionally, Amooksco adds custom domain with SSL

---

## Subdomain and Custom Domain Architecture

### Subdomain System

**Design**: Each tenant gets a provider subdomain: `{slug}.afruheritage.com`

**Implementation**:
- Slug generated from company name (e.g., "Amooksco Logistics" → "amooskco")
- Stored in `Tenant.subdomain` field
- Resolved via Next.js middleware from hostname
- Backend endpoint: `GET /api/v1/tenant-context/subdomain/{subdomain}`

**Amooksco's Subdomain**: `amooskco.afruheritage.com`

### Custom Domain System

**Design**: Tenants can bring their own domains (e.g., `amooksco.com`)

**Implementation**:
- Stored in `Tenant.custom_domain` field
- Verification via DNS (TXT, CNAME, or HTTP)
- SSL provisioning via Cloudflare
- Fallback to subdomain if custom domain fails
- Backend endpoint: `GET /api/v1/domains/resolve?hostname={domain}`

**Domain Types**:
- `provider_subdomain`: tenant.afruheritage.com
- `customer_domain`: custom domain like mycompany.com
- `platform_subdomain`: app.afruheritage.com
- `customer_subdomain`: tenant-specific subdomain
- `apex`: root domain

**Domain Status Flow**:
```
REQUESTED → PENDING_VERIFICATION → PENDING_SSL → ACTIVE
                              ↓
                           FAILED/DISABLED/REMOVED
```

### Resolution Flow

```
1. User accesses URL (e.g., amooskco.afruheritage.com)
   ↓
2. Next.js middleware extracts subdomain from hostname
   ↓
3. Middleware calls GET /api/v1/tenant-context/resolve/host
   ↓
4. Backend resolves tenant by:
   - Custom domain lookup (CustomDomain table)
   - Subdomain lookup (Tenant.subdomain)
   ↓
5. Backend returns TenantContextResponse
   ↓
6. Middleware injects x-tenant-id header
   ↓
7. Frontend applies tenant theme and branding
```

---

## RBAC Architecture

### Hierarchy

```
Platform Level (afruheritage.com)
├── Platform Admin (is_superuser = True)
│   ├── Full access to all tenants
│   ├── Can create/modify/delete tenants
│   ├── Can assign tenant-specific roles
│   └── Access to system settings, billing, vendors
│
└── Tenant Level (amooskco.afruheritage.com)
    ├── Tenant Admin (is_tenant_admin = True)
    │   ├── Full access within tenant
    │   ├── Can manage tenant users
    │   ├── Can assign tenant-specific roles
    │   └── Cannot access other tenants
    │
    └── Customer Level
        ├── Customer role
        │   ├── Limited access to own data
        │   ├── Can view shipments, tracking
        │   └── Scoped to specific tenant
        │
        └── Other Roles (dispatcher, warehouse, vendor, etc.)
            └── Scoped permissions within tenant
```

### RBAC Models

**Permission**: Granular permissions (read, write, delete, admin) per resource type
**Role**: Collection of permissions, can be system-wide or tenant-specific
**UserRole**: Links users to roles, with tenant scoping
**UserActivityLog**: Audit trail of user actions
**UserSession**: Session management

### Role Inheritance

- **System roles**: Platform-wide (platform_admin, support, accounting)
- **Tenant roles**: Tenant-specific (company_admin, dispatcher, warehouse)
- **User roles**: Multiple roles per user, scoped to tenant

### Amooksco RBAC Setup

**Platform Admin**: `admin@afruheritage.com` - Can manage Amooksco tenant
**Amooksco Admin**: `contact@amooksco.com` - Can manage Amooksco users and settings
**Amooksco Users**: Dispatchers, warehouse staff, customers with scoped permissions

---

## Challenges and Mistakes

### 1. Emergency Hardcoded Fallback (Critical Mistake)

**What Was Done Wrong**:
```typescript
// frontend/lib/tenant-context.ts (lines 56-65)
if (slug === 'amooskco' || slug.includes('amooskco')) {
  return {
    ...DEFAULT_TENANT_CONTEXT,
    id: 'amooskco',
    slug: 'amooskco',
    company_name: 'Amooksco Logistics',
    theme_code: 'amooksco',
  }
}
```

**Why It Was Wrong**:
- Bypassed proper API calls to `/api/v1/tenant-context/{slug}`
- Returned static data instead of live tenant configuration
- Broke when tenant settings changed (colors, features, branding)
- Caused inconsistent behavior between different access methods
- Led to "different entity" and "double sidebar" issues

**Root Cause**:
- Likely added as temporary workaround for failing API call
- Never removed or replaced with proper error handling
- Became permanent technical debt

**Impact on Amooksco**:
- Direct storefront access showed different entity than platform login
- Double sidebar when accessing from platform
- Inconsistent branding and feature flags
- Hard to debug because of bypassed logic

**Fix Applied**:
- Removed the emergency fallback
- Now properly calls API endpoint for all tenants
- Requires backend endpoint to work correctly

### 2. Tenant Context Resolution Conflicts

**Problem**:
- Different tenant ID resolution methods: `resolveTenantId()` vs `resolvePublicTenantId()`
- Stored tenant ID vs hostname-based resolution
- Platform login vs direct storefront access

**Impact**:
- User logs in at platform → tenant context from user's tenant_id
- User accesses storefront directly → tenant context from hostname
- Different contexts → different entities displayed

**Root Cause**:
- No unified tenant resolution strategy
- Multiple ways to determine current tenant
- Session management not consistent across platform and tenant boundaries

### 3. Double Sidebar Issue

**Problem**:
- When logging in from platform to Amooksco, shows double sidebar
- Different entity when accessing storefront directly vs platform login

**Root Cause**:
- Emergency hardcoded fallback bypassed proper context
- Tenant context resolution conflict
- Separate authentication sessions (platform vs tenant)

**What Should Happen**:
- Single sign-on between platform and tenants
- Consistent tenant context regardless of access method
- Unified session management

### 4. Custom Domain UI Missing

**Problem**:
- Backend endpoints for custom domain management exist
- No clear frontend UI for requesting/configuring custom domains
- Admin console has domain endpoints but no user-facing UI

**Impact**:
- Amooksco cannot easily request custom domain
- Manual intervention required for custom domain setup
- Poor user experience for advanced features

### 5. Template Auto-Fix Notification Display

**Problem**:
- 72-hour warning system implemented in backend
- Sends email notifications when template endpoints fail
- Unclear if frontend displays these notifications to users

**Impact**:
- Users may not be aware of failed features
- Graceful degradation not visible to users
- Poor communication of feature availability

### 6. Build-Time API Call Bypass

**Problem**:
```typescript
if (process.env.NEXT_PUBLIC_BUILD_TIME === 'true') {
  return DEFAULT_TENANT_CONTEXT
}
```

**Why It's Problematic**:
- Bypasses API calls during build
- May mask issues with API endpoints
- Build-time context may not match runtime context

### 7. Emergency Commented API Call

**Problem**:
```typescript
// frontend/components/tenant-context-provider.tsx (lines 47-60)
// Temporarily commented out the API call to fetch tenant context
```

**Why It's Problematic**:
- Another bypass of proper API calls
- Default tenant context always used
- Breaks multi-tenant functionality

---

## Current State

### What's Working

1. **Backend API**: All tenant management endpoints functional
2. **Fleetbase Integration**: Org provisioning working
3. **Template System**: 8 templates with auto-configuration
4. **RBAC Models**: Complete permission/role/user system
5. **Domain Models**: Custom domain tracking and verification
6. **Admin Console**: Tenant management UI functional

### What's Broken

1. **Amooksco Storefront**: Emergency fallback removed, may fail if API not working
2. **Tenant Context Resolution**: Conflicts between resolution methods
3. **Double Sidebar**: Still present due to context conflicts
4. **Custom Domain UI**: Missing frontend interface
5. **Single Sign-On**: Not implemented between platform and tenants
6. **Notification Display**: Template auto-fix notifications not visible in UI

### What Needs Fixing

1. **Immediate**:
   - Ensure `/api/v1/tenant-context/amooskco` endpoint works correctly
   - Test Amooksco storefront after emergency fallback removal
   - Verify tenant context resolution consistency

2. **Short-term**:
   - Implement unified tenant resolution strategy
   - Add custom domain UI to storefront settings
   - Fix double sidebar issue
   - Implement single sign-on

3. **Long-term**:
   - Proper session management across platform and tenants
   - Comprehensive error handling for tenant context
   - Frontend notification display for template issues
   - Testing suite for multi-tenant scenarios

---

## Lessons Learned

### 1. Never Hardcode Production Data

Emergency workarounds must have:
- Clear documentation of why they were added
- Expiration dates or conditions for removal
- Proper error handling instead of bypasses
- Monitoring/alerting when they're triggered

### 2. Unified Context Resolution

Multiple ways to determine context lead to conflicts:
- Single source of truth for tenant identification
- Consistent resolution across all access methods
- Clear fallback hierarchy

### 3. Session Management

Multi-tenant platforms need:
- Single sign-on between platform and tenants
- Consistent session handling
- Clear session boundaries

### 4. Graceful Degradation

When features fail:
- Clear user communication
- Visible fallback behavior
- Admin notifications
- Automatic recovery where possible

### 5. Testing Multi-Tenant Scenarios

Critical test cases:
- Direct storefront access
- Platform login to tenant
- Custom domain access
- Subdomain access
- Session persistence across boundaries

---

## Conclusion

The Afruheritage Platform has a solid architectural foundation with comprehensive RBAC, domain management, and Fleetbase integration. However, emergency workarounds and inconsistent context resolution have caused production issues for tenants like Amooksco.

The immediate priority is to ensure the tenant context API works correctly after removing the emergency fallback, followed by implementing unified tenant resolution and single sign-on to resolve the double sidebar and context conflict issues.

The platform's goals are achievable, but they require proper implementation of the designed architecture rather than bypasses and workarounds.
