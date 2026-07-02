import type { Metadata } from 'next'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { TrackingSearch } from '@/components/tracking/tracking-search'
import { AIChatWidget } from '@/components/ai-chat-widget'
import { resolveTenantContext, generateTenantMetadata } from '@/lib/tenant-metadata'

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await resolveTenantContext()
  const base = generateTenantMetadata(tenant, '/track')
  if (tenant) {
    base.title = `Track Shipment | ${tenant.company_name}`
    base.description = `Track your shipment in real-time with ${tenant.company_name}. Enter your tracking number to see the current status, location, and estimated delivery time.`
  }
  return base
}

export default function TrackPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <TrackingSearch />
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  )
}
