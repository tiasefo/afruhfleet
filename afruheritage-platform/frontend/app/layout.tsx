import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from './providers'
import { AppShell } from '@/components/app-shell'
import { FAQChatWidget } from '@/components/faq-chat-widget'
import { TenantContextProvider } from '@/components/tenant-context-provider'
import { fetchTenantContextServer, getDefaultTenantContext } from '@/lib/tenant-context'
import { resolvePublicTenantId } from '@/lib/tenant'
import './globals.css'
import '@/styles/tenants/amooksco.css'

export async function generateMetadata(): Promise<Metadata> {
  const tenantId = resolvePublicTenantId()
  let tenant = getDefaultTenantContext()
  
  if (tenantId) {
    const fetchedTenant = await fetchTenantContextServer(tenantId)
    if (fetchedTenant) {
      tenant = fetchedTenant
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

  return (
    <html lang="en" className="font-sans">
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
