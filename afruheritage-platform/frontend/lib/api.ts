const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  const lang = typeof window !== 'undefined' ? localStorage.getItem('language') || 'en' : 'en'
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': lang,
    ...(options.headers as Record<string, string> || {}),
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new ApiError(body.detail || body.message || res.statusText, res.status)
  }

  if (res.status === 204) return {} as T
  return res.json()
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),
  post: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
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

// Tenant-specific API endpoints
export const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo'

export const shipmentsAPI = {
  list: (params?: {
    q?: string
    status?: string
    payment_status?: string
    page?: number
    page_size?: number
  }) => api.get(`/shipments/${tenantId}${params ? '?' + new URLSearchParams(params as any).toString() : ''}`),
  
  get: (id: string) => api.get(`/shipments/${tenantId}/${id}`),
  
  create: (data: any) => api.post(`/shipments/${tenantId}`, data),
  
  update: (id: string, data: any) => api.patch(`/shipments/${tenantId}/${id}`, data),
  
  getEvents: (id: string) => api.get(`/shipments/${tenantId}/${id}/events`),
  
  addEvent: (id: string, data: any) => api.post(`/shipments/${tenantId}/${id}/events`, data),
  
  importCSV: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/shipments/${tenantId}/import/csv`, formData)
  },
  
  publicTrack: (trackingNumber: string) => 
    api.get(`/shipments/public/track/${tenantId}/${trackingNumber}`),
}

export const membersAPI = {
  list: (params?: { q?: string; page?: number; page_size?: number }) =>
    api.get(`/shipments/${tenantId}/members${params ? '?' + new URLSearchParams(params as any).toString() : ''}`),
  
  get: (id: string) => api.get(`/shipments/${tenantId}/members/${id}`),
  
  create: (data: any) => api.post(`/shipments/${tenantId}/members`, data),
  
  update: (id: string, data: any) => api.patch(`/shipments/${tenantId}/members/${id}`, data),
}

export const billingAPI = {
  getPlans: () => api.get('/billing/plans'),
  
  getSubscription: () => api.get(`/billing/subscriptions/${tenantId}`),
  
  getWallet: () => api.get(`/billing/wallets/${tenantId}`),
  
  initPayment: (data: any) => api.post('/billing/payments/init', data),
  
  verifyPayment: (reference: string) => api.post(`/billing/payments/verify/${reference}`),
}

export const brandingAPI = {
  get: () => api.get(`/branding/${tenantId}`),
  
  getPublic: () => api.get(`/branding/public/${tenantId}`),
  
  update: (data: any) => api.patch(`/branding/${tenantId}`, data),
}

export const supportAPI = {
  createTicket: (data: any) => api.post('/support-crm/public/tickets', data),
  
  getTicket: (token: string) => api.get(`/support-crm/public/tickets/${token}`),
  
  replyTicket: (token: string, message: string) => 
    api.post(`/support-crm/public/tickets/${token}/reply`, { message }),
}

export const aiAPI = {
  getWidgetConfig: (host: string) => api.get(`/ai/widget/config?host=${host}`),
  
  sendMessage: (message: string) => api.post('/ai/chat', { message }),
}
