import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0].toLowerCase();

  // Skip for localhost and IP addresses
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
    return NextResponse.next();
  }

  // Skip for API routes
  if (url.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip for Next.js internals
  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // Check if this is a subdomain of the platform domain
  const parts = hostname.split('.');
  const isSubdomain = parts.length >= 3;

  // Check if this is a /store/{slug} path
  const storeMatch = url.pathname.match(/^\/store\/([^/]+)(.*)$/);
  if (storeMatch) {
    const tenantSlug = storeMatch[1];
    const rest = storeMatch[2] || '';
    // Rewrite to the storefront route group with tenant slug as a header
    const response = NextResponse.rewrite(
      new URL(`/storefront/${tenantSlug}${rest}`, request.url)
    );
    response.headers.set('x-tenant-slug', tenantSlug);
    return response;
  }

  // If subdomain, inject tenant slug as header for downstream resolution
  if (isSubdomain) {
    const subdomain = parts[0];
    // Don't treat 'www' as a tenant
    if (subdomain !== 'www') {
      const response = NextResponse.next();
      response.headers.set('x-tenant-slug', subdomain);
      response.headers.set('x-tenant-resolved-from', 'subdomain');
      return response;
    }
  }

  // For custom domains (no subdomain pattern, not localhost)
  // Let the backend resolve it — pass the host header through
  if (parts.length <= 2 && hostname !== 'localhost') {
    const response = NextResponse.next();
    response.headers.set('x-tenant-host', hostname);
    response.headers.set('x-tenant-resolved-from', 'custom-domain');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /api/ (API routes)
     * - /_next/ (Next.js internals)
     * - /favicon.ico, /favicon.* (favicon files)
     */
    '/((?!api|_next|favicon).*)',
  ],
};
