import { NextRequest, NextResponse } from 'next/server'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'http://api:8000' : 'http://localhost:8100')) + '/api/v1'
const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY || ''

// Hosts that are the platform itself — never resolve as tenant subdomains
const PLATFORM_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  'afruheritage.com',
  'www.afruheritage.com',
  'app.afruheritage.com',
  'api.afruheritage.com',
  'admin.afruheritage.com',
  'sentinel.afruheritage.com',
])

// Subdomains that should render specific storefront templates.
const STOREFRONT_SUBDOMAINS: Record<string, string> = {}

// EXPLICIT PUBLIC ALLOWLIST — default-deny for everything else.
// A route is only public if it is intentionally exposed to unauthenticated
// users: marketing landing, auth flows, legal pages, public tracking,
// public support ticket-by-token, and the guest customs calculator which
// uses no tenant-scoped or user-scoped data.
const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/sign-in',
  '/register',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/terms-of-service',
  '/privacy-policy',
  '/cookie-policy',
  '/gdpr',
  '/pricing',
  '/checkout',
  '/track',
  '/tracking',
  '/tenant-request',
  '/support',
  '/customs',
  '/docs',
  '/documentation',
  '/locations',
  '/store',
  '/storefront',
  '/templates',
  '/fleetbase/console',
  '/fleetbase/live-map',
])

// Public prefixes. /api/ is public at the edge because the backend is
// responsible for its own auth; blocking it here would break legitimate
// public endpoints (health, tenant context, customs calculate, etc.).
const PUBLIC_PREFIXES = [
  '/api/',
  '/customs/',
  '/docs/',
  '/documentation/',
  '/support/ticket/',
  '/locations/',
  '/store/',
  '/storefront/',
  '/templates/',
  '/_next/',
  '/favicon',
  '/static/',
  '/assets/',
]

function isIp(host: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':')
}

function isPlatformSubdomain(host: string): string | null {
  const parts = host.split('.')
  if (parts.length >= 3 && parts.slice(1).join('.') === 'afruheritage.com') {
    return parts[0]
  }
  return null
}

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true
  return false
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4))
  return atob(base64 + pad)
}

async function verifyJwt(token: string): Promise<Record<string, any> | null> {
  if (!JWT_SECRET) {
    console.error('[middleware] JWT_SECRET/SECRET_KEY not configured; cannot verify session')
    return null
  }
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.')
    if (!headerB64 || !payloadB64 || !signatureB64) return null

    const header = JSON.parse(base64UrlDecode(headerB64))
    if (header.alg !== 'HS256') return null

    const payload = JSON.parse(base64UrlDecode(payloadB64))
    if (payload.exp && payload.exp * 1000 < Date.now()) return null

    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const data = encoder.encode(`${headerB64}.${payloadB64}`)
    const sigBuf = await crypto.subtle.sign('HMAC', key, data)
    const computed = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    if (computed !== signatureB64) return null
    return payload
  } catch {
    return null
  }
}

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('access_token')?.value
  if (!token || token.length < 10) return false
  const payload = await verifyJwt(token)
  return payload !== null
}

function redirectToLogin(req: NextRequest, pathname: string) {
  const target = pathname.startsWith('/admin') ? '/admin/login' : '/login'
  const url = new URL(target, req.url)
  url.searchParams.set('next', pathname + req.nextUrl.search)
  return NextResponse.redirect(url)
}

const TENANT_COOKIE = 'tenant_slug'

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host')?.toLowerCase().split(':')[0] ?? ''
  const pathname = req.nextUrl.pathname

  // 0. Storefront subdomain routing
  const subdomain = isPlatformSubdomain(host)
  if (subdomain && STOREFRONT_SUBDOMAINS[subdomain]) {
    const storefrontPath = STOREFRONT_SUBDOMAINS[subdomain]
    if (pathname.startsWith('/api/')) {
      const res = NextResponse.next()
      res.headers.set('x-tenant-slug', subdomain)
      return res
    }
    if (!pathname.startsWith(storefrontPath)) {
      const storefrontUrl = new URL(storefrontPath, req.url)
      const res = NextResponse.redirect(storefrontUrl)
      res.headers.set('x-tenant-slug', subdomain)
      return res
    }
    const res = NextResponse.next()
    res.headers.set('x-tenant-slug', subdomain)
    return res
  }

  // 0a. Storefront path routing — /store/[slug]
  // Extract tenant slug from URL and persist in cookie for downstream pages.
  const storeMatch = pathname.match(/^\/store\/([^/]+)/)
  if (storeMatch && storeMatch[1] !== 'storefront') {
    const slug = storeMatch[1]
    const res = NextResponse.next()
    res.headers.set('x-tenant-slug', slug)
    // Persist cookie so /sign-in, /sign-up, /dashboard etc. can resolve tenant
    res.cookies.set(TENANT_COOKIE, slug, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
    })
    return res
  }

  // 1. DEFAULT-DENY AUTH GATE
  if (!isPublicPath(pathname)) {
    const isAuthenticated = await hasValidSession(req)
    if (!isAuthenticated) {
      return redirectToLogin(req, pathname)
    }
  }

  // 1a. Propagate tenant slug from cookie to header for all non-storefront pages.
  // This allows generateMetadata and TenantContextProvider to resolve the
  // correct tenant even when the URL doesn't contain the slug.
  const cookieSlug = req.cookies.get(TENANT_COOKIE)?.value
  if (cookieSlug && !subdomain) {
    const res = NextResponse.next()
    res.headers.set('x-tenant-slug', cookieSlug)
    return res
  }

  // 2. Skip subdomain resolution for platform hosts and IPs
  if (!host || PLATFORM_HOSTS.has(host) || isIp(host)) {
    return NextResponse.next()
  }

  // 3. *.afruheritage.com subdomains — inject slug header
  const tenantSubdomain = isPlatformSubdomain(host)
  if (tenantSubdomain) {
    const res = NextResponse.next()
    res.headers.set('x-tenant-slug', tenantSubdomain)
    return res
  }

  // 4. Fully custom domains — resolve via API
  try {
    const resolveUrl = `${API_BASE}/domains/resolve?hostname=${encodeURIComponent(host)}`
    const apiRes = await fetch(resolveUrl, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    })

    if (apiRes.ok) {
      const data: { tenant_id: string } = await apiRes.json()
      if (data.tenant_id) {
        const res = NextResponse.next()
        res.headers.set('x-tenant-id', data.tenant_id)
        res.headers.set('x-tenant-host', host)
        return res
      }
    }
  } catch {
    // Resolution failed — let the page handle it
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ],
}
