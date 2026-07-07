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
import '@/styles/tenants/amooksco.css'

export async function generateMetadata(): Promise<Metadata> {
  let tenant = getDefaultTenantContext()

  // Server-side resolution: check env override first, then resolve from host header.
  const envTenantId = readEnvTenantId()
  const headerList = headers()
  const host = headerList.get('x-forwarded-host') || headerList.get('host') || ''
  const hostname = host.split(':')[0].toLowerCase()

  const reservedHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', 'afruheritage.com', 'www.afruheritage.com', 'app.afruheritage.com'])
  const tenantId: string | null = envTenantId

  if (!tenantId && hostname && !reservedHosts.has(hostname) && !/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    // Try resolving by host (custom domain or subdomain-as-identifier)
    try {
      const fetched = await fetchTenantContextByHostServer(hostname)
      if (fetched) {
        tenant = fetched
      }
    } catch (error) {
      console.error('Failed to fetch tenant context by host:', error)
    }
  } else if (tenantId) {
    try {
      const fetchedTenant = await fetchTenantContextServer(tenantId)
      if (fetchedTenant) {
        tenant = fetchedTenant
      }
    } catch (error) {
      console.error('Failed to fetch tenant context for metadata:', error)
    }
  }

  const companyName = tenant.company_name
  const isPlatform = tenant.id === 'platform'

  return {
    title: isPlatform 
      ? `${companyName} | The Only African TransUnion Multi-Tenant Freight Forwarding Platform`
      : `${companyName} | Professional Logistics & Freight Forwarding`,
    description: isPlatform
      ? 'The complete logistics platform for Africa. Track shipments, manage cargo, and streamline your supply chain with AI-powered intelligence. Serving Ghana, Kenya, Somalia, Djibouti, Nigeria, and global trade corridors.'
      : `Professional logistics and freight forwarding services by ${companyName}. Track shipments, manage cargo, and streamline your supply chain.`,
    keywords: ['freight forwarding', 'logistics', 'shipping', 'cargo', 'Africa', 'Ghana', 'Kenya', 'Somalia', 'Djibouti', 'Nigeria', 'supply chain'],
    authors: [{ name: companyName }],
    openGraph: {
      title: `${companyName} | Professional Logistics & Freight Forwarding`,
      description: isPlatform
        ? 'The complete logistics platform for Africa. Track shipments, manage cargo, and streamline your supply chain.'
        : `Professional logistics and freight forwarding services by ${companyName}.`,
      type: 'website',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const showAnalytics = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'

  // Read tenant slug/id injected by middleware (for custom domains where hostname
  // alone can't determine the tenant). The client-side provider reads this meta tag.
  const headerList = headers()
  const tenantSlug = headerList.get('x-tenant-slug') || ''
  const tenantId = headerList.get('x-tenant-id') || ''
  const tenantMeta = tenantSlug || tenantId

  return (
    <html lang="en" className="font-sans">
      <head>
        {tenantMeta && (
          <meta name="x-tenant-id" content={tenantMeta} />
        )}
      </head>
      <body className="font-sans antialiased">
        <TenantContextProvider>
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
