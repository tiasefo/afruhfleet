import type { Metadata } from 'next'
import { generateTenantMetadata } from '@/lib/tenant-metadata'
import { fetchTenantContextServer } from '@/lib/tenant-context-server'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { AIChatWidget } from '@/components/ai-chat-widget'
import { TrackingSearch } from '@/components/tracking/tracking-search'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const tenant = await fetchTenantContextServer(slug)
  const base = generateTenantMetadata(tenant, '/track')
  if (tenant) {
    base.title = `Track Shipment | ${tenant.company_name}`
    base.description = `Track your shipment in real-time with ${tenant.company_name}.`
  }
  return base
}

export default async function StorefrontTrackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await fetchTenantContextServer(slug)
  return (
    <div className="tenant-themed">
      <Navigation />
      <main className="flex-1">
        <TrackingSearch />
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  )
}
