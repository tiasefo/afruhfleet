import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://api:8000/api/v1'

// Hosts that are the platform itself — never resolve as tenant subdomains
const PLATFORM_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  'afruheritage.com',
  'www.afruheritage.com',
  'app.afruheritage.com',
  'api.afruheritage.com',
])

function isIp(host: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':')
}

function isPlatformSubdomain(host: string): string | null {
  // e.g. demo-freight-ghana.afruheritage.com → return "demo-freight-ghana"
  const parts = host.split('.')
  if (parts.length >= 3 && parts.slice(1).join('.') === 'afruheritage.com') {
    return parts[0]
  }
  return null
}

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host')?.toLowerCase().split(':')[0] ?? ''

  // Skip for platform hosts and IPs
  if (!host || PLATFORM_HOSTS.has(host) || isIp(host)) {
    return NextResponse.next()
  }

  // Skip for *.afruheritage.com subdomains — those use the subdomain as slug directly
  const subdomain = isPlatformSubdomain(host)
  if (subdomain) {
    // Inject x-tenant-slug header so pages can use it as fallback
    const res = NextResponse.next()
    res.headers.set('x-tenant-slug', subdomain)
    return res
  }

  // For fully custom domains (e.g. freight.acmeco.com) — resolve via API
  try {
    const resolveUrl = `${API_BASE}/domains/resolve?hostname=${encodeURIComponent(host)}`
    const apiRes = await fetch(resolveUrl, {
      headers: { 'Content-Type': 'application/json' },
      // Short timeout — don't stall page loads
      signal: AbortSignal.timeout(3000),
    })

    if (apiRes.ok) {
      const data: { tenant_id: string } = await apiRes.json()
      if (data.tenant_id) {
        const res = NextResponse.next()
        // Inject resolved tenant_id as a header — the client reads it on load
        res.headers.set('x-tenant-id', data.tenant_id)
        res.headers.set('x-tenant-host', host)
        return res
      }
    }
  } catch {
    // Resolution failed (unknown domain or API down) — let the page handle it
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ],
}
