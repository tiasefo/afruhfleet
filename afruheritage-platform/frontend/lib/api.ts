import { resolveTenantId } from '@/lib/tenant'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'

function withTenantId(path: string): string {
  if (/([?&])tenant_id=/.test(path)) return path
  const tenantId = resolveTenantId()
  if (!tenantId) return path
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}tenant_id=${encodeURIComponent(tenantId)}`
}

function requireTenantId(): string {
  const tenantId = resolveTenantId()
  if (!tenantId) {
    throw new ApiError('No tenant context found. Sign in or provide tenant_id.', 400)
  }
  return tenantId
}

function encodeBody(body: any): BodyInit | undefined {
  if (body === undefined || body === null) return undefined
  if (typeof FormData !== 'undefined' && body instanceof FormData) return body
  return JSON.stringify(body)
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function getErrorMessage(body: any, fallback: string): string {
  if (!body) return fallback
  if (typeof body === 'string') return body
  if (typeof body.detail === 'string') return body.detail
  if (Array.isArray(body.detail)) {
    return body.detail
      .map((item: any) => {
        if (typeof item === 'string') return item
        if (item?.msg) return item.msg
        return JSON.stringify(item)
      })
      .join('; ')
  }
  if (typeof body.message === 'string') return body.message
  return fallback
}

async function request<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  const lang = typeof window !== 'undefined' ? localStorage.getItem('language') || 'en' : 'en'
  
  const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers: Record<string, string> = {
    'Accept-Language': lang,
    ...(options.headers as Record<string, string> || {}),
  }

  if (!isFormDataBody && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const finalPath = withTenantId(path)
  const res = await fetch(`${API_BASE}${finalPath}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new ApiError(getErrorMessage(body, res.statusText), res.status)
  }

  if (res.status === 204) return {} as T
  return res.json()
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),
  post: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: 'POST', body: encodeBody(body) }),
  patch: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: 'PATCH', body: encodeBody(body) }),
  delete: <T = any>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export function setToken(token: string) {
  localStorage.setItem('auth_token', token)
  if (typeof document !== 'undefined') {
    document.cookie = `access_token=${token}; path=/; max-age=604800; SameSite=Lax`
  }
}

export function clearToken() {
  localStorage.removeItem('auth_token')
  if (typeof document !== 'undefined') {
    document.cookie = `access_token=; path=/; max-age=0; SameSite=Lax`
  }
}

export function getToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
}

// Tenant-specific API endpoints
export const shipmentsAPI = {
  list: (params?: {
    q?: string
    status?: string
    payment_status?: string
    page?: number
    page_size?: number
  }) => {
    const tenantId = requireTenantId()
    return api.get(`/shipments/${tenantId}${params ? '?' + new URLSearchParams(params as any).toString() : ''}`)
  },
  
  get: (id: string) => {
    const tenantId = requireTenantId()
    return api.get(`/shipments/${tenantId}/${id}`)
  },
  
  create: (data: any) => {
    const tenantId = requireTenantId()
    return api.post(`/shipments/${tenantId}`, data)
  },
  
  update: (id: string, data: any) => {
    const tenantId = requireTenantId()
    return api.patch(`/shipments/${tenantId}/${id}`, data)
  },
  
  getEvents: (id: string) => {
    const tenantId = requireTenantId()
    return api.get(`/shipments/${tenantId}/${id}/events`)
  },
  
  addEvent: (id: string, data: any) => {
    const tenantId = requireTenantId()
    return api.post(`/shipments/${tenantId}/${id}/events`, data)
  },

  updateLocation: (id: string, data: any) => {
    const tenantId = requireTenantId()
    return api.post(`/shipments/${tenantId}/${id}/location`, data)
  },
  
  importCSV: (file: File) => {
    const tenantId = requireTenantId()
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/shipments/${tenantId}/import/csv`, formData)
  },
  
  publicTrack: (trackingNumber: string) => {
    const tenantId = requireTenantId()
    return api.get(`/shipments/public/track/${tenantId}/${trackingNumber}`)
  },

  transitionStatus: (id: string, status: string) => {
    const tenantId = requireTenantId()
    return api.post(`/shipments/${tenantId}/${id}/transition?status=${status}`)
  },

  myShipments: () => api.get('/shipments/my-shipments'),
}

export const membersAPI = {
  list: (params?: { q?: string; page?: number; page_size?: number }) => {
    const tenantId = requireTenantId()
    return api.get(`/shipments/${tenantId}/members${params ? '?' + new URLSearchParams(params as any).toString() : ''}`)
  },
  
  get: (id: string) => {
    const tenantId = requireTenantId()
    return api.get(`/shipments/${tenantId}/members/${id}`)
  },
  
  create: (data: any) => {
    const tenantId = requireTenantId()
    return api.post(`/shipments/${tenantId}/members`, data)
  },
  
  update: (id: string, data: any) => {
    const tenantId = requireTenantId()
    return api.patch(`/shipments/${tenantId}/members/${id}`, data)
  },
}

export const billingAPI = {
  getPlans: () => api.get('/billing/plans'),

  startTrial: () => {
    const tenantId = requireTenantId()
    return api.post(`/billing/subscriptions/trial/${tenantId}`)
  },
  
  getSubscription: () => {
    const tenantId = requireTenantId()
    return api.get(`/billing/subscriptions/${tenantId}`)
  },
  
  getWallet: () => {
    const tenantId = requireTenantId()
    return api.get(`/billing/wallets/${tenantId}`)
  },

  getWalletTransactions: (limit: number = 20) => {
    const tenantId = requireTenantId()
    return api.get(`/billing/wallets/${tenantId}/transactions?limit=${limit}`)
  },
  
  initPayment: (data: {
    amount_major: number
    currency: string
    email: string
    purpose: 'subscription' | 'credit_topup'
    plan_code?: string
    credits_to_buy?: number
    callback_url?: string
  }) => {
    const tenantId = requireTenantId()
    return api.post('/billing/payments/init', { tenant_id: tenantId, ...data })
  },
  
  verifyPayment: (reference: string) => api.post(`/billing/payments/verify/${reference}`),
}

export const crmAPI = {
  getAccounts: () => {
    const tenantId = requireTenantId()
    return api.get(`/support-crm/accounts?tenant_id=${tenantId}`)
  },

  createAccount: (data: {
    account_type: string
    company_name: string
    email: string
    phone?: string
  }) => {
    const tenantId = requireTenantId()
    return api.post(`/support-crm/accounts?tenant_id=${tenantId}`, data)
  },

  getContacts: () => {
    const tenantId = requireTenantId()
    return api.get(`/support-crm/contacts?tenant_id=${tenantId}`)
  },

  createContact: (data: {
    account_id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
  }) => {
    const tenantId = requireTenantId()
    return api.post(`/support-crm/contacts?tenant_id=${tenantId}`, data)
  },

  getOpportunities: () => {
    const tenantId = requireTenantId()
    return api.get(`/support-crm/opportunities?tenant_id=${tenantId}`)
  },

  createOpportunity: (data: {
    title: string
    stage: string
    currency: string
    estimated_value?: number
    account_id?: string
  }) => {
    const tenantId = requireTenantId()
    return api.post(`/support-crm/opportunities?tenant_id=${tenantId}`, data)
  },

  getQuotes: () => {
    const tenantId = requireTenantId()
    return api.get(`/support-crm/quotes?tenant_id=${tenantId}`)
  },

  createQuote: (data: {
    quote_number: string
    currency: string
    total_amount: number
    opportunity_id?: string
  }) => {
    const tenantId = requireTenantId()
    return api.post(`/support-crm/quotes?tenant_id=${tenantId}`, data)
  },
}

export const vendorAPI = {
  getVendors: () => {
    const tenantId = requireTenantId()
    return api.get(`/vendors/marketplace?tenant_id=${tenantId}`)
  },

  getVendor: (vendorId: string) => {
    const tenantId = requireTenantId()
    return api.get(`/vendors/${vendorId}?tenant_id=${tenantId}`)
  },

  createVendor: (data: {
    full_name: string
    email: string
    phone: string
    id_type: string
    id_number: string
    vehicle_types: string[]
    vehicle_reg_number: string
    vehicle_model: string
    vehicle_year: string
    business_name?: string
    business_type: string
    operating_regions: string
    years_experience?: string
    terms_accepted: boolean
    insurance_accepted: boolean
    background_check_accepted: boolean
  }) => {
    return api.post('/vendors/register', data)
  },

  updateVendorAvailability: (vendorId: string, availability: string) => {
    const tenantId = requireTenantId()
    return api.patch(`/vendors/${vendorId}/availability?tenant_id=${tenantId}`, { availability_status: availability })
  },

  getVendorBookings: (vendorId: string) => {
    const tenantId = requireTenantId()
    return api.get(`/vendors/${vendorId}/bookings?tenant_id=${tenantId}`)
  },
}

export const fleetbaseAPI = {
  getRunners: () => {
    return api.get('/fleetbase-runtime/runners')
  },

  createRunner: (data: {
    name: string
    hostname: string
    ssh_port: number
    ssh_user: string
    root_runtime_path: string
    max_tenants: number
    supports_reference_install: boolean
  }) => {
    return api.post('/fleetbase-runtime/runners', data)
  },

  getRuntimes: () => {
    return api.get('/fleetbase-runtime/runtimes')
  },

  deployRuntime: (data: {
    tenant_id: string
    runner_id: string
    is_reference_install: boolean
  }) => {
    return api.post('/fleetbase-runtime/deploy', data)
  },

  getRuntime: (tenantId: string) => {
    return api.get(`/fleetbase-runtime/tenant/${tenantId}`)
  },

  retryRuntime: (runtimeId: string) => {
    return api.post(`/fleetbase-runtime/retry`, { runtime_id: runtimeId })
  },

  suspendRuntime: (runtimeId: string) => {
    return api.post(`/fleetbase-runtime/suspend`, { runtime_id: runtimeId })
  },
}

export const brandingAPI = {
  get: () => {
    const tenantId = requireTenantId()
    return api.get(`/branding/${tenantId}`)
  },
  
  getPublic: (slug?: string) => {
    const tenantId = slug || resolveTenantId()
    if (!tenantId) {
      throw new ApiError('No tenant context found.', 400)
    }
    return api.get(`/branding/public/${tenantId}`)
  },
  
  update: (data: any) => {
    const tenantId = requireTenantId()
    return api.patch(`/branding/${tenantId}`, data)
  },

  uploadLogo: (file: File) => {
    const tenantId = requireTenantId()
    const form = new FormData()
    form.append('file', file)
    return api.post(`/branding/${tenantId}/logo`, form)
  },
}

export const domainsAPI = {
  /** Get all custom domains for the current tenant (auto-resolved from auth) */
  myDomains: () => api.get('/domains/my-domains'),

  /** Get all custom domains for a specific tenant (legacy) */
  list: (tenantId: string) => api.get(`/domains/tenant/${tenantId}`),

  /** Get domain settings (platform subdomain, active hostname) */
  settings: (tenantId: string) => api.get(`/domains/settings/${tenantId}`),

  /** Request a new custom domain — auto-resolves tenant from auth user */
  requestSimple: (hostname: string, enableEmail?: boolean) =>
    api.post('/domains/request-simple', { hostname, enable_email: enableEmail ?? false }),

  /** Request a new custom domain (legacy — requires tenant_id query param) */
  request: (tenantId: string, hostname: string, createdBy?: string) =>
    api.post(`/domains/request?tenant_id=${tenantId}`, {
      hostname,
      domain_type: 'customer_domain',
      created_by: createdBy,
    }),

  /** Get DNS instructions for a domain (TXT, CNAME, MX records to add) */
  dnsInstructions: (domainId: string) => api.get(`/domains/${domainId}/dns-instructions`),

  /** Verify domain DNS records and auto-activate if checks pass */
  verify: (domainId: string) => api.post(`/domains/${domainId}/verify`),

  /** Poll Cloudflare for latest SSL/verification status */
  refreshStatus: (domainId: string) => api.get(`/domains/${domainId}/refresh-status`),
}

export const supportAPI = {
  createTicket: (data: any) => api.post('/support-crm/public/tickets', data),

  getTicket: (token: string) => api.get(`/support-crm/public/tickets/${token}`),

  replyTicket: (token: string, message: string) =>
    api.post(`/support-crm/public/tickets/${token}/reply`, { message }),

  // Tenant-scoped ticket management
  listTickets: (params?: { status?: string; q?: string; page?: number; page_size?: number }) => {
    const tenantId = requireTenantId()
    const qs = params ? '?' + new URLSearchParams({ tenant_id: tenantId, ...params as any }).toString() : `?tenant_id=${tenantId}`
    return api.get(`/support-crm/tickets${qs}`)
  },

  getTicketMessages: (ticketId: string) => {
    const tenantId = requireTenantId()
    return api.get(`/support-crm/tickets/${ticketId}/messages?tenant_id=${tenantId}`)
  },

  replyToTicket: (ticketId: string, body: string) => {
    const tenantId = requireTenantId()
    return api.post(`/support-crm/tickets/${ticketId}/reply?tenant_id=${tenantId}`, { body, author_type: 'staff', visible_to_public: true })
  },

  updateTicketStatus: (ticketId: string, status: string) => {
    const tenantId = requireTenantId()
    return api.patch(`/support-crm/tickets/${ticketId}/status?tenant_id=${tenantId}&status=${status}`)
  },
}

export const aiAPI = {
  getWidgetConfig: (host: string) => api.get(`/ai/widget/config?host=${host}`),
  
  sendMessage: (message: string) => api.post('/ai/chat', { message }),
}

// -----------------------------------------------------------------------------
// SaaS Commercial Signup + Payment Hub + Marketplace Alignment
// -----------------------------------------------------------------------------

export const commercialApi = {
  catalog: () => api.get('/commercial/catalog'),

  startSignup: (data: {
    email: string
    phone?: string
    account_type?: string
  }) => api.post('/commercial/signup/start', data),

  selectPlan: (data: {
    signup_id: string
    plan_code: string
    addons: string[]
    payment_method?: string
    callback_url?: string
  }) => api.post('/commercial/signup/select-plan', data),

  signupStatus: (signupId: string) =>
    api.get(`/commercial/signup/${signupId}`),
}

export const paymentHubApi = {
  initialize: (data: {
    tenant_id: string
    email: string
    amount: number
    currency?: string
    purpose?: string
    provider?: string
    callback_url?: string
    plan_code?: string
    addons?: string[]
  }) => api.post('/payment-hub/initialize', data),

  verify: (reference: string) =>
    api.get(`/payment-hub/verify/${reference}`),

  receipt: (reference: string) =>
    api.get(`/payment-hub/receipt/${reference}`),

  transactions: (tenantId: string) =>
    api.get(`/payment-hub/transactions/${tenantId}`),
}

export const adminCreditsApi = {
  get: (tenantId: string) =>
    api.get(`/admin/credits/${tenantId}`),

  topup: (tenantId: string, credits: number) =>
    api.post(`/admin/credits/${tenantId}/topup/${credits}`),
}

export const adminSubscriptionsApi = {
  feature: (tenantId: string, featureCode: string) =>
    api.get(`/admin/subscriptions/${tenantId}/features/${featureCode}`),
}

export const marketplaceApi = {
  listShipments: () => api.get('/marketplace/shipments'),

  createShipment: (data: {
    tenant_id: string
    customer_name: string
    title: string
    description?: string
    pickup: {
      label: string
      latitude: number
      longitude: number
    }
    dropoff: {
      label: string
      latitude: number
      longitude: number
    }
    weight_kg?: number
    length_cm?: number
    width_cm?: number
    height_cm?: number
    package_count?: number
    package_value?: number
    image_urls?: string[]
    fragile?: boolean
    refrigerated?: boolean
    special_handling_notes?: string
  }) => api.post('/marketplace/shipments', data),

  searchDriverJobs: (data: {
    driver_id: string
    current_latitude: number
    current_longitude: number
    max_distance_km?: number
  }) => api.post('/marketplace/drivers/search', data),

  acceptShipment: (jobId: string, driverId: string) =>
    api.post(`/marketplace/shipments/${jobId}/accept`, { driver_id: driverId }),

  updateTracking: (jobId: string, status: string) =>
    api.post(`/marketplace/shipments/${jobId}/tracking/${status}`),

  addGpsPing: (
    jobId: string,
    data: {
      driver_id: string
      latitude: number
      longitude: number
      speed_kmh?: number
      heading_degrees?: number
    }
  ) => api.post(`/marketplace/shipments/${jobId}/gps`, data),

  gpsHistory: (jobId: string) =>
    api.get(`/marketplace/shipments/${jobId}/gps`),
}

export const adminMarketplaceApi = {
  jobs: () => api.get('/admin/marketplace/jobs'),

  cancelJob: (jobId: string) =>
    api.post(`/admin/marketplace/jobs/${jobId}/cancel`),

  reassignJob: (jobId: string, driverId: string) =>
    api.post(`/admin/marketplace/jobs/${jobId}/reassign/${driverId}`),

  getEligibleDrivers: (jobId: string) =>
    api.get(`/admin/marketplace/jobs/${jobId}/eligible-drivers`),
}

export const adminVendorApi = {
  approveVendor: (vendorId: string) =>
    api.post(`/vendors/admin/${vendorId}/review`, { decision: 'approved' }),

  rejectVendor: (vendorId: string) =>
    api.post(`/vendors/admin/${vendorId}/review`, { decision: 'rejected' }),

  suspendVendor: (vendorId: string, reason: string) =>
    api.post(`/vendors/admin/${vendorId}/suspend`, { reason }),

  reinstateVendor: (vendorId: string) =>
    api.post(`/vendors/admin/${vendorId}/review`, { decision: 'approved' }),

  deleteVendor: (vendorId: string) =>
    api.delete(`/vendors/admin/${vendorId}`),
}

export const adminReviewApi = {
  deleteReview: (reviewId: string) =>
    api.delete(`/marketplace/reviews/${reviewId}`),
}

export const templatesApi = {
  list: () => api.get('/storefront-templates'),

  listAll: () => api.get('/storefront-templates/admin/all'),

  create: (data: {
    template_code: string
    name: string
    description?: string
    preset: any
  }) => api.post('/storefront-templates/admin', data),

  update: (templateId: string, data: {
    name?: string
    description?: string
    preset?: any
    is_active?: boolean
  }) => api.patch(`/storefront-templates/admin/${templateId}`, data),

  delete: (templateId: string) => api.delete(`/storefront-templates/admin/${templateId}`),

  select: (templateCode: string) => api.post('/storefront-templates/select', { template_code: templateCode }),
}

export const crmApi = {
  listCustomers: () => api.get('/crm/customers'),

  createCustomer: (data: {
    name: string
    email?: string
    phone?: string
    company?: string
    stage?: string
    owner?: string
    value?: number
    currency?: string
    source?: string
    notes?: string
  }) => api.post('/crm/customers', data),

  updateStage: (customerId: string, stage: string) =>
    api.patch(`/crm/customers/${customerId}/stage?stage=${stage}`),

  updateOwner: (customerId: string, owner: string) =>
    api.patch(`/crm/customers/${customerId}/owner?owner=${owner}`),

  convertLead: (customerId: string, stage?: string) =>
    api.post(`/crm/customers/${customerId}/convert`, { stage: stage || 'prospect' }),

  deleteCustomer: (customerId: string) =>
    api.delete(`/crm/customers/${customerId}`),

  listActivities: (customerId: string) =>
    api.get(`/crm/customers/${customerId}/activities`),

  createActivity: (customerId: string, data: {
    activity_type: string
    summary: string
    details?: string
  }) => api.post(`/crm/customers/${customerId}/activities`, data),
}

export const featureFlagsApi = {
  list: () => api.get('/admin/features'),

  toggle: (flagKey: string, enabled: boolean) =>
    api.patch(`/admin/features/${flagKey}`, { enabled }),
}

export const billingAdminApi = {
  listSubscriptions: () => api.get('/billing/subscriptions'),

  changePlan: (subscriptionId: string, planId: string) =>
    api.patch(`/billing/subscriptions/${subscriptionId}/plan`, { plan_id: planId }),

  pauseSubscription: (subscriptionId: string) =>
    api.post(`/billing/subscriptions/${subscriptionId}/pause`),

  resumeSubscription: (subscriptionId: string) =>
    api.post(`/billing/subscriptions/${subscriptionId}/resume`),

  cancelSubscription: (subscriptionId: string, reason?: string) =>
    api.post(`/billing/subscriptions/${subscriptionId}/cancel`, { reason }),

  listInvoices: () => api.get('/billing/invoices'),

  voidInvoice: (invoiceId: string) =>
    api.post(`/billing/invoices/${invoiceId}/void`),

  markInvoicePaid: (invoiceId: string, data?: {
    method?: string
    amount?: number
    reference?: string
  }) => api.post(`/billing/invoices/${invoiceId}/payments`, data || { method: 'manual' }),
}

export const tenantApi = {
  getAll: (params?: { page?: number; page_size?: number }) => {
    const q = params ? `?page=${params.page ?? 1}&page_size=${params.page_size ?? 50}` : ''
    return api.get(`/tenants${q}`)
  },
}

export const usersApi = {
  list: (tenantId: string) => api.get(`/users?tenant_id=${tenantId}`),
  invite: (tenantId: string, data: {
    email: string
    full_name: string
    send_invite_email: boolean
    is_tenant_admin?: boolean
    password?: string
    role?: string
  }) => api.post(`/users?tenant_id=${tenantId}`, data),
  updateStatus: (userId: string, tenantId: string, is_active: boolean) =>
    api.patch(`/users/${userId}/status?tenant_id=${tenantId}`, { is_active }),
  resendInvite: (userId: string, tenantId: string) =>
    api.post(`/users/${userId}/resend-invite?tenant_id=${tenantId}`, {}),
  bulkImport: (tenantId: string, file: File, sendInviteEmail: boolean = false) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/users/bulk-import?tenant_id=${tenantId}&send_invite_email=${sendInviteEmail}`, formData)
  },
}

export const productsApi = {
  list: () => api.get('/products'),
  create: (data: any) => api.post('/products', data),
  update: (productId: string, data: any) => api.patch(`/products/${productId}`, data),
  delete: (productId: string) => api.delete(`/products/${productId}`),
  listCategories: () => api.get('/products/categories'),
  createCategory: (data: any) => api.post('/products/categories', data),
}

export const publicStorefrontApi = {
  products: (tenantSlug: string, params?: { featured_only?: boolean }) => {
    const q = params ? `?featured_only=${params.featured_only ?? false}` : ''
    return api.get(`/products/public/${tenantSlug}${q}`)
  },
}

export const fleetbaseTenantApi = {
  listDrivers: () => api.get('/fleetbase-tenant/drivers'),
  createDriver: (data: any) => api.post('/fleetbase-tenant/drivers', data),
  listVehicles: () => api.get('/fleetbase-tenant/vehicles'),
  createVehicle: (data: any) => api.post('/fleetbase-tenant/vehicles', data),
  listOrders: () => api.get('/fleetbase-tenant/orders'),
  createOrder: (data: any) => api.post('/fleetbase-tenant/orders', data),
  listTracking: () => api.get('/fleetbase-tenant/tracking'),
  listFleets: () => api.get('/fleetbase-tenant/fleets'),
  proxy: (path: string, method?: string, body?: any) => {
    const m = method || 'GET'
    if (m === 'GET') return api.get(`/fleetbase-tenant/proxy/${path}`)
    if (m === 'POST') return api.post(`/fleetbase-tenant/proxy/${path}`, body)
    if (m === 'PATCH') return api.patch(`/fleetbase-tenant/proxy/${path}`, body)
    if (m === 'DELETE') return api.delete(`/fleetbase-tenant/proxy/${path}`)
    return api.get(`/fleetbase-tenant/proxy/${path}`)
  },
}

export const navigatorApi = {
  getDrivers: (tenantId: string) => api.get(`/navigator/${tenantId}/drivers`),
  getTracking: (tenantId: string) => api.get(`/navigator/${tenantId}/tracking`),
}

// Plugin catalog API
export const pluginsAPI = {
  listCatalog: () => api.get('/plugins/catalog'),
  getCatalogDetail: (pluginName: string) => api.get(`/plugins/catalog/${pluginName}`),
}

// Fleetbase-backed logistics API

