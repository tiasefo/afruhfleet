const HOSTS_WITHOUT_TENANT = new Set([
  'localhost',
  '127.0.0.1',
  'afruheritage.com',
  'www.afruheritage.com',
  'app.afruheritage.com',
])

function isIpAddressHost(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':')
}

export function readEnvTenantId(): string | null {
  const configured = process.env.NEXT_PUBLIC_TENANT_ID?.trim()
  return configured ? configured : null
}

export function getStoredTenantId(): string | null {
  if (typeof window === 'undefined') return readEnvTenantId()
  const stored = window.localStorage.getItem('tenant_id')?.trim()
  if (stored) return stored
  return readEnvTenantId()
}

export function persistTenantId(tenantId?: string | null) {
  if (typeof window === 'undefined') return
  const value = (tenantId || '').trim()
  if (!value) {
    window.localStorage.removeItem('tenant_id')
    return
  }
  window.localStorage.setItem('tenant_id', value)
}

export function getTenantFromHostname(): string | null {
  if (typeof window === 'undefined') return null
  const host = window.location.hostname.toLowerCase().trim()
  if (!host || HOSTS_WITHOUT_TENANT.has(host) || isIpAddressHost(host)) return null

  const parts = host.split('.')
  if (parts.length < 2) return null
  const subdomain = parts[0]?.trim()
  return subdomain || null
}

export function getQueryTenantId(): string | null {
  if (typeof window === 'undefined') return null
  const tid = new URLSearchParams(window.location.search).get('tenant_id')?.trim()
  return tid || null
}

export function resolveTenantId(options?: { preferHost?: boolean }): string | null {
  const preferHost = options?.preferHost ?? false
  const stored = getStoredTenantId()
  const hostTenant = getTenantFromHostname()
  return preferHost ? (hostTenant || stored) : (stored || hostTenant)
}

/** For fully custom domains the Next.js middleware resolves hostname → tenant_id
 *  and stores it in a meta tag injected via the x-tenant-id response header. */
export function getTenantFromMetaTag(): string | null {
  if (typeof document === 'undefined') return null
  const meta = document.querySelector('meta[name="x-tenant-id"]') as HTMLMetaElement | null
  return meta?.content?.trim() || null
}

export function getTenantFromPath(): string | null {
  if (typeof window === 'undefined') return null
  const path = window.location.pathname
  const match = path.match(/^\/store\/([^/]+)/)
  if (match && match[1] !== 'storefront') {
    return match[1]
  }
  return null
}

export function getTenantFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)tenant_slug=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function resolvePublicTenantId(): string | null {
  return getQueryTenantId() || getTenantFromMetaTag() || getTenantFromPath() || getTenantFromCookie() || resolveTenantId({ preferHost: true })
}
