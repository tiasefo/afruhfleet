const API_BASE = ''  // Same-origin: Next.js rewrites proxy /admin/* to the admin backend

import { TokenManager } from './token-manager'

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
  // Get auth headers using TokenManager
  const authHeaders = TokenManager.getAuthHeaders();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...(options.headers as Record<string, string> || {}),
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

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
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T = any>(path: string) => request<T>(path, { method: 'DELETE' }),
}

// Auth helpers
export function setToken(token: string, cpToken?: string | null) {
  TokenManager.setTokens(token, cpToken)
}

export function clearToken() {
  TokenManager.clearTokens()
}

export function getToken(): string | null {
  return TokenManager.getAdminToken()
}

export function debugTokens() {
  return TokenManager.debugTokens()
}
