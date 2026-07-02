import type { Metadata } from 'next'
import { generateTenantMetadata } from '@/lib/tenant-metadata'
import { fetchTenantContextServer } from '@/lib/tenant-context-server'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { SupportHero } from '@/components/support/support-hero'
import { CreateTicketForm } from '@/components/support/create-ticket-form'
import { TrackTicketSection } from '@/components/support/track-ticket-section'
import { FAQSection } from '@/components/support/faq-section'
import { AIChatWidget } from '@/components/ai-chat-widget'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const tenant = await fetchTenantContextServer(slug)
  const base = generateTenantMetadata(tenant, '/support')
  if (tenant) {
    base.title = `Support | ${tenant.company_name}`
    base.description = `Get help with your shipments, create support tickets, and track existing requests with ${tenant.company_name}.`
  }
  return base
}

export default async function StorefrontSupportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await fetchTenantContextServer(slug)
  return (
    <div className="tenant-themed">
      <Navigation />
      <main>
        <SupportHero />
        <CreateTicketForm />
        <TrackTicketSection />
        <FAQSection />
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  )
}
