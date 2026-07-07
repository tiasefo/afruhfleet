# Tenant Architecture Part 3: Endpoints, Wiring, and Status

**Document Status**: Complete Codebase Documentation  
**Last Updated**: 2026-07-05  
**Scope**: All API endpoints, frontend/admin wiring, endpoint status

---

## Table of Contents

1. [Backend API Endpoints](#backend-api-endpoints)
2. [Frontend API Client](#frontend-api-client)
3. [Admin Console API Client](#admin-console-api-client)
4. [Endpoint Wiring Status](#endpoint-wiring-status)
5. [Authentication Flow](#authentication-flow)
6. [Tenant Context Flow](#tenant-context-flow)

---

## Backend API Endpoints

### Tenant Management Endpoints

**File**: `app/api/routes/tenants.py`

```python
# Base path: /api/v1/tenants

POST   /api/v1/tenants
- Auth: require_superuser
- Request: TenantCreate
- Response: TenantResponse
- Description: Create a new tenant
- Usage: Admin console tenant creation

GET    /api/v1/tenants
- Auth: require_superuser
- Response: list[TenantResponse]
- Description: List all tenants
- Usage: Admin console tenant list

GET    /api/v1/tenants/me
- Auth: get_current_user
- Response: TenantResponse
- Description: Get current user's tenant
- Usage: Frontend tenant context

POST   /api/v1/tenants/{tenant_id}/approve
- Auth: require_superuser
- Request: ApprovalRequest
- Response: TenantResponse
- Description: Approve a tenant for launch
- Usage: Admin console tenant approval

POST   /api/v1/tenants/{tenant_id}/launch
- Auth: require_superuser
- Request: LaunchRequest
- Response: JobResponse
- Description: Launch tenant provisioning
- Usage: Admin console tenant launch

POST   /api/v1/tenants/{tenant_id}/suspend
- Auth: require_superuser
- Response: TenantResponse
- Description: Suspend a tenant
- Usage: Admin console tenant management

POST   /api/v1/tenants/{tenant_id}/activate
- Auth: require_superuser
- Response: TenantResponse
- Description: Activate a suspended tenant
- Usage: Admin console tenant management

DELETE /api/v1/tenants/{tenant_id}
- Auth: require_superuser
- Response: dict
- Description: Soft delete a tenant
- Usage: Admin console tenant management

POST   /api/v1/tenants/{tenant_id}/restore
- Auth: require_superuser
- Response: TenantResponse
- Description: Restore a soft-deleted tenant
- Usage: Admin console tenant management

POST   /api/v1/tenants/{tenant_id}/provision
- Auth: require_superuser
- Response: TenantResponse
- Description: Manually trigger Fleetbase provisioning
- Usage: Admin console Fleetbase integration

PATCH  /api/v1/tenants/{tenant_id}
- Auth: get_current_user
- Request: TenantUpdate
- Response: TenantResponse
- Description: Update tenant settings
- Usage: Frontend tenant settings

POST   /api/v1/tenants/{tenant_id}/runtime-auth
- Auth: require_superuser
- Request: TenantRuntimeAuthUpdate
- Response: TenantResponse
- Description: Update tenant runtime auth tokens
- Usage: Admin console tenant management

GET    /api/v1/tenants/jobs/{job_id}
- Auth: require_superuser
- Response: JobResponse
- Description: Get provisioning job status
- Usage: Admin console job monitoring

POST   /api/v1/tenants/jobs/{job_id}/retry
- Auth: require_superuser
- Response: JobResponse
- Description: Retry a failed provisioning job
- Usage: Admin console job management

GET    /api/v1/tenants/lookup
- Auth: require_superuser
- Query: email, slug
- Response: TenantResponse
- Description: Lookup tenant by email or slug
- Usage: Admin console tenant lookup

POST   /api/v1/tenants/{tenant_id}/resend-portal-url
- Auth: require_superuser
- Response: dict
- Description: Resend tenant portal URL via email
- Usage: Admin console tenant support

# Tenant User Management (Nested RBAC)

GET    /api/v1/tenants/{tenant_id}/users
- Auth: require_superuser
- Response: dict with users list
- Description: List all users for a tenant
- Usage: Admin console tenant user management

POST   /api/v1/tenants/{tenant_id}/users
- Auth: require_superuser
- Request: TenantUserCreate
- Response: dict with user details
- Description: Create a user for a tenant
- Usage: Admin console tenant user management

PATCH  /api/v1/tenants/{tenant_id}/users/{user_id}/role
- Auth: require_superuser
- Request: TenantUserRoleUpdate
- Response: dict
- Description: Update tenant user role
- Usage: Admin console tenant user management

DELETE /api/v1/tenants/{tenant_id}/users/{user_id}
- Auth: require_superuser
- Response: dict
- Description: Deactivate a tenant user
- Usage: Admin console tenant user management
```

### Tenant Context Endpoints

**File**: `app/api/routes/tenant_context.py`

```python
# Base path: /api/v1/tenant-context

GET    /api/v1/tenant-context/{identifier}
- Auth: None (public)
- Response: TenantContextResponse
- Description: Get tenant context by slug, subdomain, custom domain, or UUID
- Usage: Frontend tenant context resolution, storefront routing

GET    /api/v1/tenant-context/resolve/host
- Auth: None (public)
- Response: TenantContextResponse
- Description: Resolve tenant from Host header
- Usage: Next.js middleware tenant resolution

GET    /api/v1/tenant-context/subdomain/{subdomain}
- Auth: None (public)
- Response: TenantContextResponse
- Description: Resolve tenant by subdomain
- Usage: Storefront routing
```

### Custom Domain Endpoints

**File**: `app/api/routes/custom_domains.py`

```python
# Base path: /api/v1/domains

GET    /api/v1/domains/resolve
- Auth: None (public)
- Query: hostname
- Response: dict with tenant_id
- Description: Resolve hostname to tenant_id
- Usage: Next.js middleware domain resolution

POST   /api/v1/domains/request
- Auth: get_current_user
- Request: DomainRequestCreate
- Response: DomainResponse
- Description: Request a custom domain
- Usage: Frontend custom domain management

GET    /api/v1/domains/tenant/{tenant_id}
- Auth: get_current_user
- Response: list[DomainResponse]
- Description: Get all domains for a tenant
- Usage: Frontend custom domain management

POST   /api/v1/domains/activate
- Auth: require_superuser
- Request: DomainActivateRequest
- Response: DomainResponse
- Description: Activate a custom domain
- Usage: Admin console domain management

POST   /api/v1/domains/{domain_id}/fail
- Auth: require_superuser
- Request: DomainFailRequest
- Response: DomainResponse
- Description: Mark domain as failed
- Usage: Admin console domain management

GET    /api/v1/domains/{domain_id}/refresh-status
- Auth: get_current_user
- Response: DomainResponse
- Description: Refresh domain SSL status from Cloudflare
- Usage: Frontend domain status monitoring

GET    /api/v1/domains/{domain_id}/events
- Auth: get_current_user
- Response: list[DomainEventResponse]
- Description: Get domain event history
- Usage: Frontend domain event tracking

GET    /api/v1/domains/settings/{tenant_id}
- Auth: get_current_user
- Response: TenantDomainSettingsResponse
- Description: Get tenant domain settings
- Usage: Frontend domain settings
```

### Storefront Template Endpoints

**File**: `app/api/routes/storefront_templates.py`

```python
# Base path: /api/v1/storefront-templates

GET    /api/v1/storefront-templates
- Auth: require_tenant_admin
- Response: list[StorefrontTemplateResponse]
- Description: List available templates
- Usage: Admin console template selection

POST   /api/v1/storefront-templates/select
- Auth: require_tenant_admin
- Request: TenantTemplateSelectionRequest
- Response: dict with auto-fix results
- Description: Select and apply a template
- Usage: Admin console template application

# Admin-only template management

POST   /api/v1/storefront-templates/admin
- Auth: require_superuser
- Request: TemplateCreateRequest
- Response: StorefrontTemplateResponse
- Description: Create a new template
- Usage: Admin console template management

PATCH  /api/v1/storefront-templates/admin/{template_id}
- Auth: require_superuser
- Request: TemplateUpdateRequest
- Response: StorefrontTemplateResponse
- Description: Update a template
- Usage: Admin console template management

DELETE /api/v1/storefront-templates/admin/{template_id}
- Auth: require_superuser
- Response: dict
- Description: Delete a template
- Usage: Admin console template management

GET    /api/v1/storefront-templates/admin/all
- Auth: require_superuser
- Response: list[StorefrontTemplateResponse]
- Description: List all templates (including inactive)
- Usage: Admin console template management

GET    /api/v1/storefront-templates/admin/endpoint-health
- Auth: require_superuser
- Response: list[dict]
- Description: Get endpoint health for all tenants
- Usage: Admin console template monitoring

GET    /api/v1/storefront-templates/admin/{template_code}/manifest
- Auth: require_superuser
- Response: dict
- Description: Get full template manifest
- Usage: Admin console template inspection
```

### Storefront/Fleetbase Proxy Endpoints

**File**: `app/api/routes/storefront.py`

```python
# Base path: /api/v1

GET    /api/v1/storefront/{tenant_id}/orders
- Auth: get_current_user
- Response: dict with orders
- Description: Fetch orders from Fleetbase
- Usage: Frontend storefront orders

GET    /api/v1/storefront/{tenant_id}/customers
- Auth: get_current_user
- Response: dict with customers
- Description: Fetch customers from Fleetbase
- Usage: Frontend storefront customers
```

### Authentication Endpoints

**File**: `app/api/routes/auth.py` (inferred)

```python
# Base path: /api/v1/auth

POST   /api/v1/auth/bootstrap
- Auth: None (public)
- Request: BootstrapAdminRequest
- Response: TokenResponse
- Description: Bootstrap platform superuser
- Usage: Initial platform setup

POST   /api/v1/auth/register
- Auth: None (public)
- Request: RegisterRequest
- Response: TokenResponse
- Description: Register new user
- Usage: Frontend registration

POST   /api/v1/auth/login
- Auth: None (public)
- Request: LoginRequest
- Response: TokenResponse
- Description: User login
- Usage: Frontend login

GET    /api/v1/auth/me
- Auth: get_current_user
- Response: UserResponse
- Description: Get current user info
- Usage: Frontend user context

POST   /api/v1/auth/logout
- Auth: get_current_user
- Response: dict
- Description: User logout
- Usage: Frontend logout

POST   /api/v1/auth/password-reset
- Auth: None (public)
- Request: PasswordResetRequest
- Response: dict
- Description: Request password reset
- Usage: Frontend password reset

POST   /api/v1/auth/password-reset/confirm
- Auth: None (public)
- Request: PasswordResetConfirmRequest
- Response: dict
- Description: Confirm password reset
- Usage: Frontend password reset
```

---

## Frontend API Client

**File**: `frontend/lib/api_updated.ts` (inferred from usage)

```typescript
// API Base Configuration
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'

// Tenant Endpoints
export const tenantsApi = {
  create: (data: TenantCreate) => 
    api.post<TenantResponse>('/tenants', data),
  
  list: () => 
    api.get<TenantResponse[]>('/tenants'),
  
  getMe: () => 
    api.get<TenantResponse>('/tenants/me'),
  
  approve: (tenantId: string, notes?: string) => 
    api.post<TenantResponse>(`/tenants/${tenantId}/approve`, { verification_notes: notes }),
  
  launch: (tenantId: string, runnerId?: string) => 
    api.post<JobResponse>(`/tenants/${tenantId}/launch`, { runner_id: runnerId }),
  
  suspend: (tenantId: string) => 
    api.post<TenantResponse>(`/tenants/${tenantId}/suspend`),
  
  activate: (tenantId: string) => 
    api.post<TenantResponse>(`/tenants/${tenantId}/activate`),
  
  delete: (tenantId: string) => 
    api.delete(`/tenants/${tenantId}`),
  
  restore: (tenantId: string) => 
    api.post<TenantResponse>(`/tenants/${tenantId}/restore`),
  
  provision: (tenantId: string) => 
    api.post<TenantResponse>(`/tenants/${tenantId}/provision`),
  
  update: (tenantId: string, data: TenantUpdate) => 
    api.patch<TenantResponse>(`/tenants/${tenantId}`, data),
  
  updateRuntimeAuth: (tenantId: string, data: TenantRuntimeAuthUpdate) => 
    api.post<TenantResponse>(`/tenants/${tenantId}/runtime-auth`, data),
  
  getJob: (jobId: string) => 
    api.get<JobResponse>(`/tenants/jobs/${jobId}`),
  
  retryJob: (jobId: string) => 
    api.post<JobResponse>(`/tenants/jobs/${jobId}/retry`),
  
  lookup: (email?: string, slug?: string) => 
    api.get<TenantResponse>('/tenants/lookup', { email, slug }),
  
  resendPortalUrl: (tenantId: string) => 
    api.post(`/tenants/${tenantId}/resend-portal-url`),
  
  // Tenant User Management
  listUsers: (tenantId: string) => 
    api.get(`/tenants/${tenantId}/users`),
  
  createUser: (tenantId: string, data: TenantUserCreate) => 
    api.post(`/tenants/${tenantId}/users`, data),
  
  updateUserRole: (tenantId: string, userId: string, data: TenantUserRoleUpdate) => 
    api.patch(`/tenants/${tenantId}/users/${userId}/role`, data),
  
  deleteUser: (tenantId: string, userId: string) => 
    api.delete(`/tenants/${tenantId}/users/${userId}`),
}

// Tenant Context Endpoints
export const tenantContextApi = {
  getByIdentifier: (identifier: string) => 
    api.get<TenantContextResponse>(`/tenant-context/${identifier}`),
  
  resolveByHost: (host: string) => 
    api.get<TenantContextResponse>('/tenant-context/resolve/host', { host }),
  
  getBySubdomain: (subdomain: string) => 
    api.get<TenantContextResponse>(`/tenant-context/subdomain/${subdomain}`),
}

// Custom Domain Endpoints
export const domainsApi = {
  resolve: (hostname: string) => 
    api.get('/domains/resolve', { hostname }),
  
  request: (tenantId: string, data: DomainRequestCreate) => 
    api.post<DomainResponse>('/domains/request', data),
  
  list: (tenantId: string) => 
    api.get<DomainResponse[]>(`/domains/tenant/${tenantId}`),
  
  activate: (data: DomainActivateRequest) => 
    api.post<DomainResponse>('/domains/activate', data),
  
  fail: (domainId: string, data: DomainFailRequest) => 
    api.post<DomainResponse>(`/domains/${domainId}/fail`, data),
  
  refreshStatus: (domainId: string) => 
    api.get<DomainResponse>(`/domains/${domainId}/refresh-status`),
  
  getEvents: (domainId: string) => 
    api.get<DomainEventResponse[]>(`/domains/${domainId}/events`),
  
  getSettings: (tenantId: string) => 
    api.get<TenantDomainSettingsResponse>(`/domains/settings/${tenantId}`),
}

// Storefront Template Endpoints
export const templatesApi = {
  list: () => 
    api.get<StorefrontTemplateResponse[]>('/storefront-templates'),
  
  select: (data: TenantTemplateSelectionRequest) => 
    api.post('/storefront-templates/select', data),
  
  // Admin-only
  create: (data: TemplateCreateRequest) => 
    api.post<StorefrontTemplateResponse>('/storefront-templates/admin', data),
  
  update: (templateId: string, data: TemplateUpdateRequest) => 
    api.patch<StorefrontTemplateResponse>(`/storefront-templates/admin/${templateId}`, data),
  
  delete: (templateId: string) => 
    api.delete(`/storefront-templates/admin/${templateId}`),
  
  listAll: () => 
    api.get<StorefrontTemplateResponse[]>('/storefront-templates/admin/all'),
  
  getEndpointHealth: () => 
    api.get('/storefront-templates/admin/endpoint-health'),
  
  getManifest: (templateCode: string) => 
    api.get(`/storefront-templates/admin/${templateCode}/manifest`),
}

// Storefront/Fleetbase Proxy Endpoints
export const storefrontApi = {
  getOrders: (tenantId: string) => 
    api.get(`/storefront/${tenantId}/orders`),
  
  getCustomers: (tenantId: string) => 
    api.get(`/storefront/${tenantId}/customers`),
}

// Authentication Endpoints
export const authApi = {
  bootstrap: (data: BootstrapAdminRequest) => 
    api.post<TokenResponse>('/auth/bootstrap', data),
  
  register: (data: RegisterRequest) => 
    api.post<TokenResponse>('/auth/register', data),
  
  login: (data: LoginRequest) => 
    api.post<TokenResponse>('/auth/login', data),
  
  getMe: () => 
    api.get<UserResponse>('/auth/me'),
  
  logout: () => 
    api.post('/auth/logout'),
  
  requestPasswordReset: (data: PasswordResetRequest) => 
    api.post('/auth/password-reset', data),
  
  confirmPasswordReset: (data: PasswordResetConfirmRequest) => 
    api.post('/auth/password-reset/confirm', data),
}
```

---

## Admin Console API Client

**File**: `admin-console/frontend/lib/api.ts` (inferred from usage)

```typescript
// API Base Configuration
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'

// Admin Console uses admin-specific endpoints
export const adminApi = {
  // Tenant Management
  tenants: {
    list: () => 
      api.get<TenantResponse[]>('/admin/tenants'),
    
    create: (data: TenantCreate) => 
      api.post<TenantResponse>('/admin/tenants', data),
    
    get: (tenantId: string) => 
      api.get<TenantResponse>(`/admin/tenants/${tenantId}`),
    
    approve: (tenantId: string, notes?: string) => 
      api.post<TenantResponse>(`/admin/tenants/${tenantId}/approve`, { verification_notes: notes }),
    
    launch: (tenantId: string, runnerId?: string) => 
      api.post<JobResponse>(`/admin/tenants/${tenantId}/launch`, { runner_id: runnerId }),
    
    suspend: (tenantId: string) => 
      api.post<TenantResponse>(`/admin/tenants/${tenantId}/suspend`),
    
    activate: (tenantId: string) => 
      api.post<TenantResponse>(`/admin/tenants/${tenantId}/activate`),
    
    delete: (tenantId: string) => 
      api.delete(`/admin/tenants/${tenantId}`),
    
    restore: (tenantId: string) => 
      api.post<TenantResponse>(`/admin/tenants/${tenantId}/restore`),
    
    provision: (tenantId: string) => 
      api.post<TenantResponse>(`/admin/tenants/${tenantId}/provision`),
    
    update: (tenantId: string, data: TenantUpdate) => 
      api.patch<TenantResponse>(`/admin/tenants/${tenantId}`, data),
    
    // Tenant User Management
    listUsers: (tenantId: string) => 
      api.get(`/admin/tenants/${tenantId}/users`),
    
    createUser: (tenantId: string, data: TenantUserCreate) => 
      api.post(`/admin/tenants/${tenantId}/users`, data),
    
    updateUserRole: (tenantId: string, userId: string, data: TenantUserRoleUpdate) => 
      api.patch(`/admin/tenants/${tenantId}/users/${userId}/role`, data),
    
    deleteUser: (tenantId: string, userId: string) => 
      api.delete(`/admin/tenants/${tenantId}/users/${userId}`),
    
    // Products
    getProducts: (tenantId: string) => 
      api.get(`/admin/tenants/${tenantId}/products`),
    
    // Fleetbase
    getFleetbaseDrivers: (tenantId: string) => 
      api.get(`/admin/tenants/${tenantId}/fleetbase/drivers`),
    
    // Plugins
    getPlugins: (tenantId: string) => 
      api.get(`/admin/tenants/${tenantId}/plugins`),
    
    addPlugin: (tenantId: string, data: { plugin_code: string }) => 
      api.post(`/admin/tenants/${tenantId}/plugins`, data),
    
    removePlugin: (tenantId: string, pluginCode: string) => 
      api.delete(`/admin/tenants/${tenantId}/plugins/${pluginCode}`),
  },
  
  // Templates
  templates: {
    list: () => 
      api.get<StorefrontTemplateResponse[]>('/admin/templates'),
    
    select: (data: { template_code: string }) => 
      api.post('/admin/templates/select', data),
    
    getBranding: (tenantId: string) => 
      api.get(`/admin/templates/branding/${tenantId}`),
    
    updateBranding: (tenantId: string, data: Partial<TenantBranding>) => 
      api.patch(`/admin/templates/branding/${tenantId}`, data),
    
    // Admin-only template management
    create: (data: TemplateCreateRequest) => 
      api.post<StorefrontTemplateResponse>('/admin/templates/admin', data),
    
    update: (templateId: string, data: TemplateUpdateRequest) => 
      api.patch<StorefrontTemplateResponse>(`/admin/templates/admin/${templateId}`, data),
    
    delete: (templateId: string) => 
      api.delete(`/admin/templates/admin/${templateId}`),
    
    listAll: () => 
      api.get<StorefrontTemplateResponse[]>('/admin/templates/admin/all'),
    
    getEndpointHealth: () => 
      api.get('/admin/templates/admin/endpoint-health'),
    
    getManifest: (templateCode: string) => 
      api.get(`/admin/templates/admin/${templateCode}/manifest`),
  },
  
  // Tenant Requests
  tenantRequests: {
    list: (status: string, page: number, pageSize: number) => 
      api.get(`/admin/tenants/requests?status=${status}&page=${page}&page_size=${pageSize}`),
    
    review: (requestId: string, status: 'approved' | 'rejected', notes?: string) => 
      api.patch(`/admin/tenants/requests/${requestId}`, { status, review_notes: notes }),
    
    autoProvision: (requestId: string) => 
      api.post(`/admin/tenants/requests/${requestId}/auto-provision`),
  },
  
  // Authentication
  auth: {
    login: (email: string, password: string) => 
      api.post<TokenResponse>('/auth/login', { username: email, password }),
    
    getMe: () => 
      api.get<UserResponse>('/auth/me'),
    
    logout: () => 
      api.post('/auth/logout'),
  },
}
```

---

## Endpoint Wiring Status

### Backend → Frontend Wiring

| Backend Endpoint | Frontend Usage | Status | Notes |
|------------------|----------------|--------|-------|
| `POST /api/v1/tenants` | Admin console tenant creation | ✅ WIRED | `admin-console/frontend/app/dashboard/tenants/page.tsx` |
| `GET /api/v1/tenants` | Admin console tenant list | ✅ WIRED | `admin-console/frontend/app/dashboard/tenants/page.tsx` |
| `GET /api/v1/tenants/me` | Frontend tenant context | ✅ WIRED | `frontend/hooks/useAuth.ts` |
| `POST /api/v1/tenants/{id}/approve` | Admin console tenant approval | ✅ WIRED | `admin-console/frontend/app/dashboard/tenants/page.tsx` |
| `POST /api/v1/tenants/{id}/launch` | Admin console tenant launch | ✅ WIRED | `admin-console/frontend/app/dashboard/tenants/page.tsx` |
| `POST /api/v1/tenants/{id}/suspend` | Admin console tenant suspend | ✅ WIRED | `admin-console/frontend/app/dashboard/tenants/page.tsx` |
| `POST /api/v1/tenants/{id}/activate` | Admin console tenant activate | ✅ WIRED | `admin-console/frontend/app/dashboard/tenants/page.tsx` |
| `DELETE /api/v1/tenants/{id}` | Admin console tenant delete | ✅ WIRED | `admin-console/frontend/app/dashboard/tenants/page.tsx` |
| `POST /api/v1/tenants/{id}/provision` | Admin console Fleetbase provision | ✅ WIRED | `admin-console/frontend/app/dashboard/tenants/[id]/page.tsx` |
| `PATCH /api/v1/tenants/{id}` | Frontend tenant settings | ⚠️ PARTIAL | Endpoint exists, frontend usage unclear |
| `GET /api/v1/tenants/{id}/users` | Admin console tenant users | ✅ WIRED | Backend endpoint exists, admin console uses it |
| `POST /api/v1/tenants/{id}/users` | Admin console create user | ✅ WIRED | Backend endpoint exists, admin console uses it |
| `PATCH /api/v1/tenants/{id}/users/{uid}/role` | Admin console update role | ✅ WIRED | Backend endpoint exists, admin console uses it |
| `DELETE /api/v1/tenants/{id}/users/{uid}` | Admin console delete user | ✅ WIRED | Backend endpoint exists, admin console uses it |

### Backend → Admin Console Wiring

| Backend Endpoint | Admin Console Usage | Status | Notes |
|------------------|---------------------|--------|-------|
| `GET /api/v1/tenant-context/{id}` | Tenant context resolution | ✅ WIRED | `frontend/lib/tenant-context.ts` |
| `GET /api/v1/tenant-context/resolve/host` | Middleware tenant resolution | ✅ WIRED | `frontend/middleware.ts` |
| `GET /api/v1/tenant-context/subdomain/{sub}` | Storefront routing | ✅ WIRED | `frontend/middleware.ts` |
| `GET /api/v1/domains/resolve` | Middleware domain resolution | ✅ WIRED | `frontend/middleware.ts` |
| `POST /api/v1/domains/request` | Custom domain request | ⚠️ PARTIAL | Endpoint exists, frontend UI unclear |
| `GET /api/v1/domains/tenant/{id}` | Custom domain list | ⚠️ PARTIAL | Endpoint exists, frontend UI unclear |
| `GET /api/v1/storefront-templates` | Template selection | ✅ WIRED | `admin-console/frontend/app/dashboard/tenants/[id]/page.tsx` |
| `POST /api/v1/storefront-templates/select` | Template application | ✅ WIRED | `admin-console/frontend/app/dashboard/tenants/[id]/page.tsx` |
| `GET /api/v1/storefront-templates/admin/all` | Admin template management | ✅ WIRED | `admin-console/frontend/app/dashboard/tenants/[id]/page.tsx` |
| `GET /api/v1/storefront-templates/admin/endpoint-health` | Template health monitoring | ✅ WIRED | Backend endpoint exists, admin console could use it |
| `GET /api/v1/storefront/{id}/orders` | Storefront orders | ✅ WIRED | Backend endpoint exists |
| `GET /api/v1/storefront/{id}/customers` | Storefront customers | ✅ WIRED | Backend endpoint exists |
| `POST /api/v1/auth/login` | Frontend login | ✅ WIRED | `frontend/hooks/useAuth.ts` |
| `GET /api/v1/auth/me` | User context | ✅ WIRED | `frontend/hooks/useAuth.ts` |
| `POST /api/v1/auth/logout` | Logout | ✅ WIRED | `frontend/hooks/useAuth.ts` |

### Frontend → Backend Wiring

| Frontend Component | Backend Endpoint | Status | Notes |
|-------------------|------------------|--------|-------|
| `frontend/hooks/useAuth.ts` | `POST /api/v1/auth/login` | ✅ WIRED | Login with email/password |
| `frontend/hooks/useAuth.ts` | `GET /api/v1/auth/me` | ✅ WIRED | Get user context |
| `frontend/hooks/useAuth.ts` | `POST /api/v1/auth/logout` | ✅ WIRED | Logout |
| `frontend/lib/tenant-context.ts` | `GET /api/v1/tenant-context/{slug}` | ✅ WIRED | Fetch tenant context |
| `frontend/middleware.ts` | `GET /api/v1/tenant-context/resolve/host` | ✅ WIRED | Resolve tenant from host |
| `frontend/middleware.ts` | `GET /api/v1/domains/resolve` | ✅ WIRED | Resolve custom domain |
| `frontend/components/tenant-context-provider.tsx` | `GET /api/v1/tenant-context/{slug}` | ✅ WIRED | Tenant context provider |
| `admin-console/frontend/app/dashboard/tenants/page.tsx` | `GET /api/v1/admin/tenants` | ✅ WIRED | List tenants |
| `admin-console/frontend/app/dashboard/tenants/page.tsx` | `POST /api/v1/admin/tenants` | ✅ WIRED | Create tenant |
| `admin-console/frontend/app/dashboard/tenants/page.tsx` | `POST /api/v1/admin/tenants/{id}/approve` | ✅ WIRED | Approve tenant |
| `admin-console/frontend/app/dashboard/tenants/page.tsx` | `POST /api/v1/admin/tenants/{id}/launch` | ✅ WIRED | Launch tenant |
| `admin-console/frontend/app/dashboard/tenants/[id]/page.tsx` | `GET /api/v1/admin/tenants/{id}` | ✅ WIRED | Get tenant details |
| `admin-console/frontend/app/dashboard/tenants/[id]/page.tsx` | `GET /api/v1/admin/templates` | ✅ WIRED | List templates |
| `admin-console/frontend/app/dashboard/tenants/[id]/page.tsx` | `POST /api/v1/admin/templates/select` | ✅ WIRED | Select template |
| `admin-console/frontend/app/dashboard/tenants/[id]/page.tsx` | `PATCH /api/v1/admin/templates/branding/{id}` | ✅ WIRED | Update branding |
| `admin-console/frontend/app/dashboard/tenants/[id]/page.tsx` | `GET /api/v1/admin/tenants/{id}/products` | ✅ WIRED | Get products |
| `admin-console/frontend/app/dashboard/tenants/[id]/page.tsx` | `GET /api/v1/admin/tenants/{id}/fleetbase/drivers` | ✅ WIRED | Get Fleetbase drivers |
| `admin-console/frontend/app/dashboard/tenants/[id]/page.tsx` | `GET /api/v1/admin/plugins` | ✅ WIRED | List plugins |
| `admin-console/frontend/app/dashboard/tenants/[id]/page.tsx` | `GET /api/v1/admin/tenants/{id}/plugins` | ✅ WIRED | Get tenant plugins |
| `admin-console/frontend/app/dashboard/tenants/[id]/page.tsx` | `POST /api/v1/admin/tenants/{id}/plugins` | ✅ WIRED | Add plugin |
| `admin-console/frontend/app/dashboard/tenants/[id]/page.tsx` | `DELETE /api/v1/admin/tenants/{id}/plugins/{code}` | ✅ WIRED | Remove plugin |

### Known Issues and Gaps

1. **Double Sidebar Issue**: 
   - **Problem**: When logging in from platform to Amooksco, shows different entity and double sidebar
   - **Root Cause**: Tenant context resolution conflict between platform-level and tenant-level contexts
   - **Location**: `frontend/lib/tenant-context.ts` has hardcoded Amooksco fallback that bypasses proper context resolution
   - **Status**: ⚠️ IDENTIFIED - Emergency fix in place, needs proper resolution

2. **Storefront Direct Access vs Platform Login**:
   - **Problem**: Different entities when accessing storefront directly vs logging in from platform
   - **Root Cause**: Tenant ID resolution from different sources (hostname vs stored token)
   - **Location**: `frontend/lib/tenant.ts` - `resolveTenantId()` and `resolvePublicTenantId()` logic
   - **Status**: ⚠️ IDENTIFIED - Needs unified tenant resolution strategy

3. **Custom Domain UI**:
   - **Problem**: Custom domain endpoints exist but no clear frontend UI
   - **Status**: ⚠️ PARTIAL - Backend ready, frontend UI needed

4. **Template Auto-Fix Notifications**:
   - **Problem**: 72-hour warning system implemented but unclear if frontend displays these notifications
   - **Status**: ⚠️ PARTIAL - Backend sends emails, frontend notification display unclear

---

## Authentication Flow

### Login Flow

```
1. User enters credentials on frontend
   ↓
2. Frontend: POST /api/v1/auth/login
   ↓
3. Backend validates credentials
   ↓
4. Backend returns TokenResponse with:
   - access_token
   - tenant_id
   - subdomain
   - portal_url
   - requires_subscription
   ↓
5. Frontend stores token in localStorage
   ↓
6. Frontend calls GET /api/v1/auth/me
   ↓
7. Backend returns UserResponse with:
   - id
   - email
   - full_name
   - tenant_id
   - is_tenant_admin
   - is_superuser
   - onboarding_complete
   ↓
8. Frontend stores user context
   ↓
9. Frontend redirects based on role:
   - is_superuser → /dashboard
   - requires_subscription → /onboarding
   - !onboarding_complete → /onboarding
   - else → /dashboard
```

### Tenant Context Resolution Flow

```
1. User accesses storefront URL (e.g., amooskco.afruheritage.com)
   ↓
2. Next.js middleware intercepts request
   ↓
3. Middleware extracts subdomain from hostname
   ↓
4. Middleware calls GET /api/v1/tenant-context/resolve/host
   ↓
5. Backend resolves tenant by:
   - Custom domain lookup
   - Subdomain lookup
   ↓
6. Backend returns TenantContextResponse with:
   - id
   - slug
   - company_name
   - theme
   - features
   - subscription
   ↓
7. Middleware injects x-tenant-id header
   ↓
8. Frontend reads tenant from meta tag
   ↓
9. Frontend applies tenant theme
   ↓
10. Frontend renders storefront with tenant context
```

### Platform to Tenant Login Flow

```
1. User logs in at platform (afruheritage.com)
   ↓
2. User is platform admin (is_superuser = true)
   ↓
3. User navigates to tenant list
   ↓
4. User clicks "View Storefront" for tenant
   ↓
5. Frontend opens tenant URL in new tab
   ↓
6. New tab resolves tenant context from subdomain
   ↓
7. User logs in with tenant credentials
   ↓
8. ISSUE: Different tenant context due to separate authentication
   ↓
9. PROBLEM: Double sidebar and different entity display
```

---

## Tenant Context Flow

### Storefront Access Flow

```
1. User accesses https://amooskco.afruheritage.com/amooskco-storefront
   ↓
2. Next.js middleware processes request
   ↓
3. Middleware detects subdomain: "amooskco"
   ↓
4. Middleware checks STOREFRONT_SUBDOMAINS["amooskco"] = "/amooskco-storefront"
   ↓
5. Middleware injects x-tenant-slug header
   ↓
6. Middleware allows request to pass through
   ↓
7. Frontend component TenantContextProvider loads
   ↓
8. Provider calls GET /api/v1/tenant-context/amooskco
   ↓
9. EMERGENCY FIX: Hardcoded Amooksco context returned without API call
   ↓
10. Frontend applies Amooksco theme
   ↓
11. Frontend renders storefront
```

### Platform Login to Tenant Flow

```
1. User logs in at https://afruheritage.com
   ↓
2. User is platform admin
   ↓
3. User navigates to /dashboard/tenants
   ↓
4. User clicks "View Storefront" for Amooksco
   ↓
5. Frontend opens https://amooskco.afruheritage.com/amooskco-storefront
   ↓
6. New tab loads storefront
   ↓
7. ISSUE: User is not logged into tenant
   ↓
8. User must log in with tenant credentials
   ↓
9. PROBLEM: Different session, different context
   ↓
10. RESULT: Double sidebar, different entity display
```

### Root Cause Analysis

**Problem**: When accessing storefront directly vs logging in from platform, different tenant contexts are resolved.

**Direct Storefront Access**:
- Tenant resolved from subdomain
- No authentication required for public pages
- Login required for protected pages
- Tenant context from hostname

**Platform Login to Tenant**:
- User authenticated at platform level
- Tenant context from user's tenant_id
- Different session/context
- Potential conflict between platform and tenant contexts

**Solution Needed**:
1. Unified tenant resolution strategy
2. Single sign-on between platform and tenants
3. Consistent context resolution regardless of access method
4. Remove emergency hardcoded Amooksco fallback
5. Proper session management across platform and tenant boundaries

---

**End of Part 3**
