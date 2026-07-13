import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from './providers'
import { AppShell } from '@/components/app-shell'
import { FAQChatWidget } from '@/components/faq-chat-widget'
import { TenantContextProvider } from '@/components/tenant-context-provider'
import { fetchTenantContextServer, fetchTenantContextByHostServer, getDefaultTenantContext } from '@/lib/tenant-context'
import { readEnvTenantId } from '@/lib/tenant'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  let tenant = getDefaultTenantContext()

  // Server-side resolution: check middleware slug, then env override, then host header.
  const envTenantId = readEnvTenantId()
  const headerList = await headers()
  const host = headerList.get('x-forwarded-host') || headerList.get('host') || ''
  const hostname = host.split(':')[0].toLowerCase()
  const middlewareSlug = headerList.get('x-tenant-slug') || ''

  const reservedHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', 'afruheritage.com', 'www.afruheritage.com', 'app.afruheritage.com'])

  // Priority 1: middleware-injected tenant slug (from cookie or /store/[slug] path)
  if (middlewareSlug) {
    try {
      const fetched = await fetchTenantContextServer(middlewareSlug)
      if (fetched) {
        tenant = fetched
      }
    } catch (error) {
      console.error('Failed to fetch tenant context from middleware slug:', error)
    }
  }
  // Priority 2: env override
  else if (envTenantId) {
    try {
      const fetchedTenant = await fetchTenantContextServer(envTenantId)
      if (fetchedTenant) {
        tenant = fetchedTenant
      }
    } catch (error) {
      console.error('Failed to fetch tenant context for metadata:', error)
    }
  }
  // Priority 3: hostname resolution (custom domain or subdomain)
  else if (hostname && !reservedHosts.has(hostname) && !/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    try {
      const fetched = await fetchTenantContextByHostServer(hostname)
      if (fetched) {
        tenant = fetched
      }
    } catch (error) {
      console.error('Failed to fetch tenant context by host:', error)
    }
  }

  const companyName = tenant.company_name
  const isPlatform = tenant.id === 'platform'
  const templateCode = tenant.theme_code || (tenant as any).template_code || 'default'

  // Template-specific taglines
  const taglines: Record<string, string> = {
    freight: 'Freight & Customs Services',
    fleet: 'Transport & Fleet Operations',
    ecommerce: 'Online Shopping & Delivery',
    mall: 'Marketplace & Retail',
    bookings: 'Bookings & Reservations',
    realestate: 'Property & Real Estate',
    restaurant: 'Food & Dining',
    default: 'Professional Logistics & Freight Forwarding',
  }
  const tagline = isPlatform
    ? 'The Only African TransUnion Multi-Tenant Freight Forwarding Platform'
    : (taglines[templateCode] || taglines.default)

  const descriptions: Record<string, string> = {
    freight: `Professional freight forwarding and logistics services by ${companyName}. Track shipments, manage cargo, and streamline your supply chain.`,
    fleet: `Professional transport and fleet operations by ${companyName}. Route management, vehicle tracking, and dispatch from one platform.`,
    ecommerce: `Online shopping and delivery by ${companyName}. Browse products, place orders, and track deliveries.`,
    mall: `Marketplace and retail services by ${companyName}. Shop from multiple vendors, compare prices, and order online.`,
    bookings: `Booking and reservation services by ${companyName}. Schedule appointments, manage availability, and confirm reservations.`,
    realestate: `Property and real estate services by ${companyName}. Browse listings, schedule viewings, and manage properties.`,
    restaurant: `Food and dining services by ${companyName}. Browse menus, place orders, and make reservations.`,
    default: `Professional logistics and freight forwarding services by ${companyName}. Track shipments, manage cargo, and streamline your supply chain.`,
  }
  const description = isPlatform
    ? 'The complete logistics platform for Africa. Track shipments, manage cargo, and streamline your supply chain with AI-powered intelligence. Serving Ghana, Kenya, Somalia, Djibouti, Nigeria, and global trade corridors.'
    : (descriptions[templateCode] || descriptions.default)

  return {
    title: `${companyName} | ${tagline}`,
    description,
    keywords: ['freight forwarding', 'logistics', 'shipping', 'cargo', 'Africa', 'Ghana', 'Kenya', 'Somalia', 'Djibouti', 'Nigeria', 'supply chain', companyName.toLowerCase()],
    authors: [{ name: companyName }],
    openGraph: {
      title: `${companyName} | ${tagline}`,
      description,
      type: 'website',
    },
    twitter: {
      title: `${companyName} | ${tagline}`,
      description,
    },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1a3a4a' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1f28' },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const showAnalytics = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'

  // Read tenant slug/id injected by middleware (for custom domains where hostname
  // alone can't determine the tenant). The client-side provider reads this meta tag.
  const headerList = await headers()
  const tenantSlug = headerList.get('x-tenant-slug') || ''
  const tenantId = headerList.get('x-tenant-id') || ''
  const tenantMeta = tenantSlug || tenantId

  // Resolve tenant context server-side so SSR HTML shows correct tenant branding.
  let serverTenant = getDefaultTenantContext()
  if (tenantSlug) {
    try {
      const fetched = await fetchTenantContextServer(tenantSlug)
      if (fetched) {
        serverTenant = fetched
      }
    } catch (error) {
      console.error('Failed to fetch tenant context for SSR:', error)
    }
  }

  return (
    <html lang="en" className="font-sans">
      <head>
        {tenantMeta && (
          <meta name="x-tenant-id" content={tenantMeta} />
        )}
      </head>
      <body className="font-sans antialiased">
        <TenantContextProvider initialTenant={serverTenant}>
          <Providers>
            <AppShell>
              {children}
            </AppShell>
          </Providers>
          <FAQChatWidget />
        </TenantContextProvider>
        {showAnalytics ? <Analytics /> : null}
      </body>
    </html>
  )
}
