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
}

export function clearToken() {
  localStorage.removeItem('auth_token')
}

export function getToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
}

// Authentication API
export const authApi = {
  bootstrap: (data: {
    email: string
    password: string
    full_name?: string
  }) => api.post('/auth/bootstrap', data),

  login: (data: {
    username: string
    password: string
  }) => api.post('/auth/login', data),

  me: () => api.get('/auth/me'),

  logout: () => {
    clearToken()
    return Promise.resolve({})
  },

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (data: {
    token: string
    password: string
  }) => api.post('/auth/reset-password', data),
}

// Tenant Management API
export const tenantApi = {
  getAll: (params?: {
    page?: number
    page_size?: number
    status?: string
  }) => api.get('/tenants' + (params ? `?${new URLSearchParams(params as any)}` : '')),

  getById: (tenantId: string) =>
    api.get(`/tenants/${tenantId}`),

  create: (data: {
    name: string
    subdomain: string
    plan_code: string
    email: string
    full_name: string
    phone?: string
    business_type?: string
    company_size?: string
  }) => api.post('/tenants', data),

  update: (tenantId: string, data: any) =>
    api.patch(`/tenants/${tenantId}`, data),

  approve: (tenantId: string) =>
    api.post(`/tenants/${tenantId}/approve`),

  launch: (tenantId: string) =>
    api.post(`/tenants/${tenantId}/launch`),

  suspend: (tenantId: string) =>
    api.post(`/tenants/${tenantId}/suspend`),

  getStatus: (tenantId: string) =>
    api.get(`/tenants/${tenantId}/status`),

  getSummary: (tenantId: string) =>
    api.get(`/tenants/${tenantId}/summary`),

  getPortalUrl: (tenantId: string) =>
    api.get(`/tenants/${tenantId}/portal-url`),
}

// Billing API
export const billingApi = {
  getPlans: () => api.get('/billing/plans'),

  getSubscription: (tenantId: string) =>
    api.get(`/billing/subscriptions/${tenantId}`),

  createSubscription: (data: {
    tenant_id: string
    plan_code: string
    payment_method?: string
  }) => api.post('/billing/subscriptions', data),

  getWallet: (tenantId: string) =>
    api.get(`/billing/wallets/${tenantId}`),

  getWalletTransactions: (tenantId: string) =>
    api.get(`/billing/wallets/${tenantId}/transactions`),

  purchaseCredits: (tenantId: string, amount: number) =>
    api.post('/billing/credits/purchase', {
      tenant_id: tenantId,
      amount,
    }),

  consumeCredits: (tenantId: string, amount: number, description?: string) =>
    api.post('/billing/credits/consume', {
      tenant_id: tenantId,
      amount,
      description,
    }),

  getBalance: (tenantId: string) =>
    api.get(`/billing/balance/${tenantId}`),

  getUsageCosts: (tenantId: string) =>
    api.get(`/billing/usage-costs/${tenantId}`),
}

// CRM API
export const crmApi = {
  getAccounts: (tenantId: string) =>
    api.get(`/support-crm/accounts?tenant_id=${tenantId}`),

  createAccount: (data: {
    tenant_id: string
    name: string
    industry?: string
    website?: string
    phone?: string
    email?: string
    address?: string
    notes?: string
  }) => api.post('/support-crm/accounts', data),

  getContacts: (tenantId: string) =>
    api.get(`/support-crm/contacts?tenant_id=${tenantId}`),

  createContact: (data: {
    tenant_id: string
    first_name: string
    last_name: string
    email?: string
    phone?: string
    account_id?: string
    title?: string
    notes?: string
  }) => api.post('/support-crm/contacts', data),

  getOpportunities: (tenantId: string) =>
    api.get(`/support-crm/opportunities?tenant_id=${tenantId}`),

  createOpportunity: (data: {
    tenant_id: string
    title: string
    description?: string
    estimated_value?: number
    currency?: string
    stage: string
    account_id?: string
    contact_id?: string
    close_date?: string
  }) => api.post('/support-crm/opportunities', data),

  getQuotes: (tenantId: string) =>
    api.get(`/support-crm/quotes?tenant_id=${tenantId}`),

  createQuote: (data: {
    tenant_id: string
    quote_number: string
    currency: string
    total_amount: number
    opportunity_id?: string
    valid_until?: string
    notes?: string
  }) => api.post('/support-crm/quotes', data),

  getTickets: (tenantId: string) =>
    api.get(`/support-crm/tickets?tenant_id=${tenantId}`),

  createTicket: (data: {
    tenant_id: string
    subject: string
    description: string
    priority: string
    contact_id?: string
    account_id?: string
  }) => api.post('/support-crm/tickets', data),

  getPublicTicket: (publicToken: string) =>
    api.get(`/support-crm/public/tickets/${publicToken}`),

  createPublicTicket: (data: {
    tenant_id: string
    name: string
    email: string
    subject: string
    description: string
    priority: string
  }) => api.post('/support-crm/public/tickets', data),

  replyToPublicTicket: (publicToken: string, data: {
    message: string
    email: string
    name: string
  }) => api.post(`/support-crm/public/tickets/${publicToken}/reply`, data),
}

// Shipment API
export const shipmentApi = {
  getAll: (tenantId: string, params?: {
    page?: number
    page_size?: number
    status?: string
  }) => api.get(`/shipments/${tenantId}` + (params ? `?${new URLSearchParams(params as any)}` : '')),

  getById: (tenantId: string, shipmentId: string) =>
    api.get(`/shipments/${tenantId}/${shipmentId}`),

  create: (tenantId: string, data: {
    customer_name: string
    title: string
    description?: string
    pickup: {
      label: string
      latitude: number
      longitude: number
      address?: string
    }
    dropoff: {
      label: string
      latitude: number
      longitude: number
      address?: string
    }
    weight_kg?: number
    dimensions?: {
      length_cm: number
      width_cm: number
      height_cm: number
    }
    package_count?: number
    package_value?: number
    fragile?: boolean
    refrigerated?: boolean
    special_handling_notes?: string
    reference_number?: string
  }) => api.post(`/shipments/${tenantId}`, data),

  update: (tenantId: string, shipmentId: string, data: any) =>
    api.patch(`/shipments/${tenantId}/${shipmentId}`, data),

  delete: (tenantId: string, shipmentId: string) =>
    api.delete(`/shipments/${tenantId}/${shipmentId}`),

  getTracking: (tenantId: string, shipmentId: string) =>
    api.get(`/shipments/${tenantId}/${shipmentId}/tracking/latest`),

  getTrackingHistory: (tenantId: string, shipmentId: string) =>
    api.get(`/shipments/${tenantId}/${shipmentId}/tracking/history`),

  addTrackingPoint: (tenantId: string, shipmentId: string, data: {
    status: string
    location?: {
      latitude: number
      longitude: number
      address?: string
    }
    notes?: string
    timestamp?: string
  }) => api.post(`/shipments/${tenantId}/${shipmentId}/tracking/point`, data),

  addEvent: (tenantId: string, shipmentId: string, data: {
    event_type: string
    description: string
    metadata?: any
  }) => api.post(`/shipments/${tenantId}/${shipmentId}/events`, data),

  getEvents: (tenantId: string, shipmentId: string) =>
    api.get(`/shipments/${tenantId}/${shipmentId}/events`),

  getGpsPings: (tenantId: string, shipmentId: string) =>
    api.get(`/shipments/${shipmentId}/gps`),

  addGpsPing: (shipmentId: string, data: {
    driver_id: string
    latitude: number
    longitude: number
    timestamp?: string
    accuracy?: number
  }) => api.post(`/shipments/${shipmentId}/gps`, data),

  publicTrack: (tenantId: string, trackingNumber: string) =>
    api.get(`/shipments/public/track/${tenantId}/${trackingNumber}`),

  importCsv: (tenantId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/shipments/${tenantId}/import/csv`, formData)
  },
}

// Vendor API
export const vendorApi = {
  register: (data: {
    business_name: string
    business_type: string
    contact_name: string
    email: string
    phone: string
    address: string
    city: string
    country: string
    postal_code: string
    website?: string
    years_in_business?: number
    fleet_size?: number
    service_areas?: string[]
    services_offered?: string[]
    vehicle_types?: string[]
    operating_hours?: string
    insurance_details?: {
      provider: string
      policy_number: string
      expiry_date: string
      coverage_amount: number
    }
    documents?: File[]
  }) => {
    const formData = new FormData()
    
    // Add all text fields
    Object.keys(data).forEach(key => {
      if (key === 'documents') return
      const value = data[key as keyof typeof data]
      if (typeof value === 'string' || typeof value === 'number') {
        formData.append(key, value.toString())
      } else if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value))
      }
    })
    
    // Add documents if provided
    if (data.documents) {
      data.documents.forEach((file, index) => {
        formData.append(`document_${index}`, file)
      })
    }
    
    return api.post('/vendors/register', formData)
  },

  getAll: (tenantId: string, params?: {
    page?: number
    page_size?: number
    status?: string
    business_type?: string
    city?: string
  }) => api.get(`/vendors/marketplace?tenant_id=${tenantId}` + (params ? `&${new URLSearchParams(params as any)}` : '')),

  getById: (tenantId: string, vendorId: string) =>
    api.get(`/vendors/${tenantId}/${vendorId}`),

  getBookings: (tenantId: string, params?: {
    page?: number
    page_size?: number
    status?: string
    vendor_id?: string
  }) => api.get(`/vendors/${tenantId}/bookings` + (params ? `?${new URLSearchParams(params as any)}` : '')),

  createBooking: (tenantId: string, data: {
    vendor_id: string
    service_type: string
    pickup_address: string
    dropoff_address: string
    pickup_latitude: number
    pickup_longitude: number
    dropoff_latitude: number
    dropoff_longitude: number
    scheduled_date?: string
    special_instructions?: string
    contact_name: string
    contact_phone: string
    estimated_cost?: number
  }) => api.post(`/vendors/${tenantId}/bookings`, data),

  updateBooking: (tenantId: string, bookingId: string, data: {
    status?: string
    driver_id?: string
    estimated_cost?: number
    actual_cost?: number
    notes?: string
  }) => api.patch(`/vendors/${tenantId}/bookings/${bookingId}`, data),

  acceptBooking: (tenantId: string, bookingId: string) =>
    api.post(`/vendors/${tenantId}/bookings/${bookingId}/accept`),

  rejectBooking: (tenantId: string, bookingId: string, reason?: string) =>
    api.post(`/vendors/${tenantId}/bookings/${bookingId}/reject`, { reason }),

  completeBooking: (tenantId: string, bookingId: string, data?: {
    actual_cost?: number
    notes?: string
  }) => api.post(`/vendors/${tenantId}/bookings/${bookingId}/complete`, data),

  getAdminVendors: (params?: {
    page?: number
    page_size?: number
    status?: string
  }) => api.get('/vendors/admin' + (params ? `?${new URLSearchParams(params as any)}` : '')),

  getAdminVendorById: (vendorId: string) =>
    api.get(`/vendors/admin/${vendorId}`),

  adminReview: (vendorId: string, data: {
    status: 'approved' | 'rejected' | 'under_review'
    notes?: string
    rejection_reason?: string
  }) => api.post(`/vendors/admin/${vendorId}/review`, data),

  adminSuspend: (vendorId: string, reason: string) =>
    api.post(`/vendors/admin/${vendorId}/suspend`, { reason }),

  adminAddDocuments: (vendorId: string, documents: File[]) => {
    const formData = new FormData()
    documents.forEach((file, index) => {
      formData.append(`document_${index}`, file)
    })
    return api.post(`/vendors/admin/${vendorId}/documents`, formData)
  },
}

// AI API
export const aiApi = {
  chat: (message: string, tenantId?: string) =>
    api.post('/ai/chat', {
      message,
      tenant_id: tenantId,
    }),

  getWidgetConfig: (tenantId: string) =>
    api.get(`/ai/widget/${tenantId}`),

  updateWidgetConfig: (tenantId: string, config: {
    enabled: boolean
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
    primary_color?: string
    welcome_message?: string
    placeholder?: string
    model?: string
    max_tokens?: number
    temperature?: number
  }) => api.patch(`/ai/widget/${tenantId}`, config),

  getChatHistory: (tenantId: string, params?: {
    page?: number
    page_size?: number
    date_from?: string
    date_to?: string
  }) => api.get(`/ai/chat/history/${tenantId}` + (params ? `?${new URLSearchParams(params as any)}` : '')),

  deleteChatHistory: (tenantId: string, chatId?: string) =>
    api.delete(`/ai/chat/history/${tenantId}` + (chatId ? `/${chatId}` : '')),
}

// Fleetbase API
export const fleetbaseApi = {
  getDrivers: (tenantId: string, params?: {
    page?: number
    page_size?: number
    status?: string
    vehicle_type?: string
    current_location?: boolean
  }) => api.get(`/navigator/${tenantId}/drivers` + (params ? `?${new URLSearchParams(params as any)}` : '')),

  getDriverById: (tenantId: string, driverId: string) =>
    api.get(`/navigator/${tenantId}/drivers/${driverId}`),

  createDriver: (tenantId: string, data: {
    name: string
    email: string
    phone: string
    license_number: string
    license_expiry: string
    vehicle_type: string
    vehicle_make?: string
    vehicle_model?: string
    vehicle_year?: number
    vehicle_plate?: string
    insurance_details?: {
      provider: string
      policy_number: string
      expiry_date: string
    }
    address?: string
    city?: string
    country?: string
  }) => api.post(`/navigator/${tenantId}/drivers`, data),

  updateDriver: (tenantId: string, driverId: string, data: any) =>
    api.patch(`/navigator/${tenantId}/drivers/${driverId}`, data),

  deleteDriver: (tenantId: string, driverId: string) =>
    api.delete(`/navigator/${tenantId}/drivers/${driverId}`),

  getVehicles: (tenantId: string, params?: {
    page?: number
    page_size?: number
    status?: string
    vehicle_type?: string
  }) => api.get(`/fleetbase-runtime/${tenantId}/vehicles` + (params ? `?${new URLSearchParams(params as any)}` : '')),

  getVehicleById: (tenantId: string, vehicleId: string) =>
    api.get(`/fleetbase-runtime/${tenantId}/vehicles/${vehicleId}`),

  createVehicle: (tenantId: string, data: {
    make: string
    model: string
    year: number
    plate_number: string
    vehicle_type: string
    capacity_kg?: number
    dimensions?: {
      length_cm: number
      width_cm: number
      height_cm: number
    }
    insurance_details?: {
      provider: string
      policy_number: string
      expiry_date: string
    }
    registration_details?: {
      registration_number: string
      expiry_date: string
    }
  }) => api.post(`/fleetbase-runtime/${tenantId}/vehicles`, data),

  updateVehicle: (tenantId: string, vehicleId: string, data: any) =>
    api.patch(`/fleetbase-runtime/${tenantId}/vehicles/${vehicleId}`, data),

  deleteVehicle: (tenantId: string, vehicleId: string) =>
    api.delete(`/fleetbase-runtime/${tenantId}/vehicles/${vehicleId}`),

  getExtensions: (tenantId: string) =>
    api.get(`/fleetbase-runtime/${tenantId}/extensions`),

  installExtension: (tenantId: string, data: {
    extension_name: string
    version?: string
    config?: any
  }) => api.post(`/fleetbase-runtime/${tenantId}/extensions/install`, data),

  uninstallExtension: (tenantId: string, extensionName: string) =>
    api.delete(`/fleetbase-runtime/${tenantId}/extensions/${extensionName}`),

  getTracking: (tenantId: string, params?: {
    driver_id?: string
    vehicle_id?: string
    date_from?: string
    date_to?: string
  }) => api.get(`/navigator/${tenantId}/tracking` + (params ? `?${new URLSearchParams(params as any)}` : '')),

  getRuntimes: (params?: {
    page?: number
    page_size?: number
    status?: string
  }) => api.get('/fleetbase-runtime' + (params ? `?${new URLSearchParams(params as any)}` : '')),

  getRuntimeById: (runtimeId: string) =>
    api.get(`/fleetbase-runtime/${runtimeId}`),

  createRuntime: (data: {
    tenant_id: string
    runner_id: string
    install_directory?: string
    environment?: 'production' | 'staging' | 'development'
    fleetbase_version?: string
  }) => api.post('/fleetbase-runtime', data),

  updateRuntime: (runtimeId: string, data: any) =>
    api.patch(`/fleetbase-runtime/${runtimeId}`, data),

  deleteRuntime: (runtimeId: string) =>
    api.delete(`/fleetbase-runtime/${runtimeId}`),

  deployRuntime: (runtimeId: string) =>
    api.post(`/fleetbase-runtime/${runtimeId}/deploy`),

  getRuntimeEvents: (runtimeId: string) =>
    api.get(`/fleetbase-runtime/${runtimeId}/events`),
}

// Admin API
export const adminApi = {
  getCredits: (tenantId: string) =>
    api.get(`/admin/credits/${tenantId}`),

  topupCredits: (tenantId: string, credits: number, reason?: string) =>
    api.post(`/admin/credits/${tenantId}/topup/${credits}`, { reason }),

  adjustCredits: (data: {
    tenant_id: string
    amount: number
    reason: string
    type: 'credit' | 'debit'
  }) => api.post('/admin/credits/adjust', data),

  getSubscriptions: (params?: {
    page?: number
    page_size?: number
    status?: string
    plan_code?: string
  }) => api.get('/admin/subscriptions' + (params ? `?${new URLSearchParams(params as any)}` : '')),

  getSubscriptionFeatures: (tenantId: string, featureCode: string) =>
    api.get(`/admin/subscriptions/${tenantId}/features/${featureCode}`),

  assignSubscription: (data: {
    tenant_id: string
    plan_code: string
    trial_days?: number
    features?: string[]
  }) => api.post('/admin/subscriptions/assign', data),

  getMarketplaceVendors: (params?: {
    page?: number
    page_size?: number
    status?: string
  }) => api.get('/admin/marketplace' + (params ? `?${new URLSearchParams(params as any)}` : '')),

  getMarketplaceVendorById: (vendorId: string) =>
    api.get(`/admin/marketplace/${vendorId}`),

  getDashboard: () => api.get('/admin/dashboard'),

  getSummary: () => api.get('/admin/summary'),

  getTickets: (params?: {
    page?: number
    page_size?: number
    status?: string
    priority?: string
  }) => api.get('/admin/tickets' + (params ? `?${new URLSearchParams(params as any)}` : '')),

  updateTicketStatus: (ticketId: string, status: string, notes?: string) =>
    api.patch(`/admin/tickets/${ticketId}/status`, { status, notes }),

  getAuditLogs: (params?: {
    page?: number
    page_size?: number
    tenant_id?: string
    action?: string
    date_from?: string
    date_to?: string
  }) => api.get('/admin/audit' + (params ? `?${new URLSearchParams(params as any)}` : '')),

  getUsers: (params?: {
    page?: number
    page_size?: number
    status?: string
    role?: string
  }) => api.get('/admin/users' + (params ? `?${new URLSearchParams(params as any)}` : '')),

  updateUserRole: (userId: string, role: string) =>
    api.patch(`/admin/users/${userId}/role`, { role }),

  updateUserStatus: (userId: string, status: 'active' | 'inactive' | 'suspended') =>
    api.patch(`/admin/users/${userId}/status`, { status }),

  getRunners: (params?: {
    page?: number
    page_size?: number
    status?: string
  }) => api.get('/admin/runners' + (params ? `?${new URLSearchParams(params as any)}` : '')),

  createRunner: (data: {
    name: string
    host: string
    port: number
    username: string
    ssh_key_path: string
    description?: string
    capabilities?: string[]
  }) => api.post('/admin/runners', data),

  updateRunner: (runnerId: string, data: any) =>
    api.patch(`/admin/runners/${runnerId}`, data),

  deleteRunner: (runnerId: string) =>
    api.delete(`/admin/runners/${runnerId}`),

  getKycRequests: (params?: {
    page?: number
    page_size?: number
    status?: string
  }) => api.get('/admin/kyc' + (params ? `?${new URLSearchParams(params as any)}` : '')),

  approveKyc: (kycId: string) =>
    api.post(`/admin/kyc/approve/${kycId}`),

  revokeKyc: (kycId: string, reason: string) =>
    api.post(`/admin/kyc/revoke/${kycId}`, { reason }),

  setReadOnly: (tenantId: string, reason: string) =>
    api.post('/admin/read-only', { tenant_id: tenantId, reason }),
}

// Analytics API
export const analyticsApi = {
  getDashboard: (tenantId: string, params?: {
    date_from?: string
    date_to?: string
    period?: 'day' | 'week' | 'month' | 'year'
  }) => api.get(`/analytics/${tenantId}/dashboard` + (params ? `?${new URLSearchParams(params as any)}` : '')),

  getShipmentStats: (tenantId: string, params?: {
    date_from?: string
    date_to?: string
    group_by?: 'day' | 'week' | 'month'
  }) => api.get(`/analytics/${tenantId}/shipments` + (params ? `?${new URLSearchParams(params as any)}` : '')),

  getRevenueStats: (tenantId: string, params?: {
    date_from?: string
    date_to?: string
    group_by?: 'day' | 'week' | 'month'
  }) => api.get(`/analytics/${tenantId}/revenue` + (params ? `?${new URLSearchParams(params as any)}` : '')),

  getCustomerStats: (tenantId: string, params?: {
    date_from?: string
    date_to?: string
  }) => api.get(`/analytics/${tenantId}/customers` + (params ? `?${new URLSearchParams(params as any)}` : '')),

  getVendorStats: (tenantId: string, params?: {
    date_from?: string
    date_to?: string
  }) => api.get(`/analytics/${tenantId}/vendors` + (params ? `?${new URLSearchParams(params as any)}` : '')),

  getUsageStats: (tenantId: string, params?: {
    date_from?: string
    date_to?: string
  }) => api.get(`/analytics/${tenantId}/usage` + (params ? `?${new URLSearchParams(params as any)}` : '')),

  getReports: (tenantId: string, params?: {
    page?: number
    page_size?: number
    report_type?: string
  }) => api.get(`/analytics/${tenantId}/reports` + (params ? `?${new URLSearchParams(params as any)}` : '')),

  generateReport: (tenantId: string, data: {
    report_type: string
    date_from: string
    date_to: string
    format?: 'json' | 'csv' | 'pdf'
    filters?: any
  }) => api.post(`/analytics/${tenantId}/reports/generate`, data),

  getReportById: (tenantId: string, reportId: string) =>
    api.get(`/analytics/${tenantId}/reports/${reportId}`),

  downloadReport: (tenantId: string, reportId: string) =>
    api.get(`/analytics/${tenantId}/reports/${reportId}/download`),
}

// KYC API
export const kycApi = {
  submitKyc: (data: {
    tenant_id: string
    business_type: 'individual' | 'registered' | 'fleet'
    business_name?: string
    registration_number?: string
    tax_id?: string
    contact_person: {
      name: string
      email: string
      phone: string
      position?: string
    }
    business_address: {
      street: string
      city: string
      state: string
      country: string
      postal_code: string
    }
    documents: {
      id_document: File
      proof_of_address: File
      business_registration?: File
      tax_certificate?: File
      bank_statement?: File
    }
  }) => {
    const formData = new FormData()
    
    // Add all text fields
    Object.keys(data).forEach(key => {
      if (key === 'documents') return
      const value = data[key as keyof typeof data]
      if (typeof value === 'string' || typeof value === 'number') {
        formData.append(key, value.toString())
      } else if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value))
      }
    })
    
    // Add documents
    Object.keys(data.documents).forEach(docKey => {
      const file = data.documents[docKey as keyof typeof data.documents]
      if (file instanceof File) {
        formData.append(docKey, file)
      }
    })
    
    return api.post('/kyc/submit', formData)
  },

  getKycStatus: (tenantId: string) =>
    api.get(`/kyc/status/${tenantId}`),

  getKycDetails: (tenantId: string) =>
    api.get(`/kyc/details/${tenantId}`),

  updateKyc: (tenantId: string, data: any) =>
    api.patch(`/kyc/update/${tenantId}`, data),

  uploadAdditionalDocument: (tenantId: string, documentType: string, file: File) => {
    const formData = new FormData()
    formData.append('document_type', documentType)
    formData.append('file', file)
    return api.post(`/kyc/upload/${tenantId}`, formData)
  },

  getAdminKycRequests: (params?: {
    page?: number
    page_size?: number
    status?: string
    business_type?: string
  }) => api.get('/admin/kyc' + (params ? `?${new URLSearchParams(params as any)}` : '')),

  getAdminKycById: (kycId: string) =>
    api.get(`/admin/kyc/${kycId}`),

  adminApproveKyc: (kycId: string, notes?: string) =>
    api.post(`/admin/kyc/approve/${kycId}`, { notes }),

  adminRejectKyc: (kycId: string, reason: string) =>
    api.post(`/admin/kyc/reject/${kycId}`, { reason }),

  adminRequestMoreInfo: (kycId: string, requiredDocuments: string[], notes?: string) =>
    api.post(`/admin/kyc/request-info/${kycId}`, {
      required_documents: requiredDocuments,
      notes,
    }),
}

// Custom Domain API
export const customDomainApi = {
  requestDomain: (data: {
    tenant_id: string
    domain: string
    subdomain?: string
    ssl_required?: boolean
    redirect_to_tenant_subdomain?: boolean
  }) => api.post('/custom-domains/request', data),

  getDomainRequests: (tenantId: string) =>
    api.get(`/custom-domains/${tenantId}`),

  getDomainById: (domainId: string) =>
    api.get(`/custom-domains/${domainId}`),

  verifyDomain: (domainId: string, verificationMethod: 'dns' | 'http' | 'txt') =>
    api.post(`/custom-domains/${domainId}/verify`, { verification_method: verificationMethod }),

  getVerificationStatus: (domainId: string) =>
    api.get(`/custom-domains/${domainId}/verification`),

  getSslStatus: (domainId: string) =>
    api.get(`/custom-domains/${domainId}/ssl`),

  updateDomainSettings: (domainId: string, data: {
    ssl_required?: boolean
    redirect_to_tenant_subdomain?: boolean
    custom_headers?: Record<string, string>
    security_settings?: {
      force_https?: boolean
      hsts_enabled?: boolean
      cors_origins?: string[]
    }
  }) => api.patch(`/custom-domains/${domainId}`, data),

  deleteDomain: (domainId: string) =>
    api.delete(`/custom-domains/${domainId}`),

  getAdminDomains: (params?: {
    page?: number
    page_size?: number
    status?: string
    tenant_id?: string
  }) => api.get('/admin/custom-domains' + (params ? `?${new URLSearchParams(params as any)}` : '')),

  getAdminDomainById: (domainId: string) =>
    api.get(`/admin/custom-domains/${domainId}`),

  adminApproveDomain: (domainId: string) =>
    api.post(`/admin/custom-domains/${domainId}/approve`),

  adminRejectDomain: (domainId: string, reason: string) =>
    api.post(`/admin/custom-domains/${domainId}/reject`, { reason }),

  getDnsRecords: (domainId: string) =>
    api.get(`/custom-domains/${domainId}/dns`),

  addDnsRecord: (domainId: string, data: {
    type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX'
    name: string
    value: string
    ttl?: number
    priority?: number
  }) => api.post(`/custom-domains/${domainId}/dns`, data),

  deleteDnsRecord: (domainId: string, recordId: string) =>
    api.delete(`/custom-domains/${domainId}/dns/${recordId}`),
}

// WhatsApp API
export const whatsappApi = {
  sendMessage: (data: {
    tenant_id: string
    to: string
    message: string
    template_name?: string
    template_data?: Record<string, any>
  }) => api.post('/whatsapp/send', data),

  getMessages: (tenantId: string, params?: {
    page?: number
    page_size?: number
    phone_number?: string
    date_from?: string
    date_to?: string
  }) => api.get(`/whatsapp/${tenantId}/messages` + (params ? `?${new URLSearchParams(params as any)}` : '')),

  getMessageById: (tenantId: string, messageId: string) =>
    api.get(`/whatsapp/${tenantId}/messages/${messageId}`),

  getWebhookUrl: (tenantId: string) =>
    api.get(`/whatsapp/${tenantId}/webhook`),

  updateWebhookUrl: (tenantId: string, webhookUrl: string) =>
    api.patch(`/whatsapp/${tenantId}/webhook`, { webhook_url: webhookUrl }),

  getTemplates: (tenantId: string) =>
    api.get(`/whatsapp/${tenantId}/templates`),

  createTemplate: (tenantId: string, data: {
    name: string
    category: 'marketing' | 'utility' | 'authentication'
    language: string
    components: any[]
  }) => api.post(`/whatsapp/${tenantId}/templates`, data),

  getAnalytics: (tenantId: string, params?: {
    date_from?: string
    date_to?: string
    group_by?: 'day' | 'week' | 'month'
  }) => api.get(`/whatsapp/${tenantId}/analytics` + (params ? `?${new URLSearchParams(params as any)}` : '')),

  importContacts: (tenantId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/whatsapp/${tenantId}/import-contacts`, formData)
  },

  getContacts: (tenantId: string, params?: {
    page?: number
    page_size?: number
    status?: string
  }) => api.get(`/whatsapp/${tenantId}/contacts` + (params ? `?${new URLSearchParams(params as any)}` : '')),

  addContact: (tenantId: string, data: {
    phone_number: string
    name?: string
    email?: string
    tags?: string[]
    custom_fields?: Record<string, any>
  }) => api.post(`/whatsapp/${tenantId}/contacts`, data),

  updateContact: (tenantId: string, contactId: string, data: any) =>
    api.patch(`/whatsapp/${tenantId}/contacts/${contactId}`, data),

  deleteContact: (tenantId: string, contactId: string) =>
    api.delete(`/whatsapp/${tenantId}/contacts/${contactId}`),

  getCsvImportStatus: (tenantId: string, importId: string) =>
    api.get(`/whatsapp-csv/${tenantId}/status/${importId}`),

  processCsvImport: (tenantId: string, file: File, options?: {
    has_headers?: boolean
    phone_column?: string
    name_column?: string
    email_column?: string
    skip_duplicates?: boolean
  }) => {
    const formData = new FormData()
    formData.append('file', file)
    if (options) {
      Object.keys(options).forEach(key => {
        const value = options[key as keyof typeof options]
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })
    }
    return api.post(`/whatsapp-csv/${tenantId}/import`, formData)
  },

  handleWebhook: (webhookData: any) =>
    api.post('/whatsapp/webhook', webhookData),

  getBotSettings: (tenantId: string) =>
    api.get(`/whatsapp-bot/${tenantId}/settings`),

  updateBotSettings: (tenantId: string, data: {
    auto_reply_enabled?: boolean
    greeting_message?: string
    away_message?: string
    business_hours?: {
      enabled: boolean
      timezone: string
      hours: Array<{
        day: string
        open_time: string
        close_time: string
      }>
    }
    keywords?: Array<{
      keyword: string
      response: string
      enabled: boolean
    }>
  }) => api.patch(`/whatsapp-bot/${tenantId}/settings`, data),
}

// Commercial API (existing)
export const commercialApi = {
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

// Payment Hub API (existing)
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

// Admin Credits API (existing)
export const adminCreditsApi = {
  get: (tenantId: string) =>
    api.get(`/admin/credits/${tenantId}`),

  topup: (tenantId: string, credits: number) =>
    api.post(`/admin/credits/${tenantId}/topup/${credits}`),
}

// Admin Subscriptions API (existing)
export const adminSubscriptionsApi = {
  feature: (tenantId: string, featureCode: string) =>
    api.get(`/admin/subscriptions/${tenantId}/features/${featureCode}`),
}

// Marketplace API (existing)
export const marketplaceApi = {
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
      timestamp?: string
      accuracy?: number
    }
  ) => api.post(`/marketplace/shipments/${jobId}/gps`, data),
}
