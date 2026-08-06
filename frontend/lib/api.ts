import { getAuthToken } from './auth'

export function getApiBaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || null
}

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null

interface RequestOptions {
  headers?: Record<string, string>
}

async function request<T>(method: string, endpoint: string, body?: Json | FormData, options?: RequestOptions): Promise<T> {
  const base = getApiBaseUrl() || ''
  const url = base.endsWith('/api/v1') && endpoint.startsWith('/api/v1/')
    ? `${base}${endpoint.slice('/api/v1'.length)}`
    : `${base}${endpoint}`
  const token = getAuthToken()
  const finalHeaders: Record<string, string> = { ...(options?.headers || {}) }
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`
  if (!(body instanceof FormData) && body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json'
  }
  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }))
    throw detail
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: <T = any>(endpoint: string) => request<T>('GET', endpoint),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post: <T = any>(endpoint: string, body?: Json | FormData, options?: RequestOptions) => request<T>('POST', endpoint, body, options),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patch: <T = any>(endpoint: string, body?: Json) => request<T>('PATCH', endpoint, body),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete: <T = any>(endpoint: string) => request<T>('DELETE', endpoint),
}

export function joinApiUrl(apiBaseUrl: string, endpoint: string): string {
  const normalizedBase = apiBaseUrl.replace(/\/$/, '')
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  if (normalizedBase.endsWith('/api/v1') && normalizedEndpoint.startsWith('/api/v1/')) {
    return `${normalizedBase}${normalizedEndpoint.slice('/api/v1'.length)}`
  }

  return `${normalizedBase}${normalizedEndpoint}`
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null

  const raw = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))
    ?.split('=')
    .slice(1)
    .join('=')

  return raw ? decodeURIComponent(raw) : null
}