import type { Metadata } from 'next'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { TicketDetail } from '@/components/support/ticket-detail'
import { AIChatWidget } from '@/components/ai-chat-widget'
import { resolveTenantContext, generateTenantMetadata } from '@/lib/tenant-metadata'

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await resolveTenantContext()
  const base = generateTenantMetadata(tenant, '/support')
  if (tenant) {
    base.title = `Ticket Details | ${tenant.company_name} Support`
  } else {
    base.title = 'Ticket Details | Afruheritage Support'
  }
  return base
}

interface PageProps {
  params: Promise<{
    token: string
  }>
  searchParams: Promise<{
    tenant?: string
  }>
}

export default async function TicketPage({ params, searchParams }: PageProps) {
  const { token } = await params
  const { tenant } = await searchParams
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <TicketDetail token={token} initialTenant={tenant} />
        </div>
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  )
}
