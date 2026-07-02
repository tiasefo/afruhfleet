import type { Metadata } from 'next'
import { generateTenantMetadata } from '@/lib/tenant-metadata'
import { fetchTenantContextServer } from '@/lib/tenant-context-server'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { AIChatWidget } from '@/components/ai-chat-widget'
import { TenantAboutContent } from '@/components/tenant-about-content'
import { Globe2, ShieldCheck, Route, Users, Sparkles, Building2 } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const tenant = await fetchTenantContextServer(slug)
  const base = generateTenantMetadata(tenant, '/about')
  if (tenant) {
    base.title = `About Us | ${tenant.company_name}`
    base.description = `Learn about ${tenant.company_name}, our mission, and the logistics infrastructure we are building.`
  }
  return base
}

const principles = [
  { title: 'Trust Through Visibility', description: 'From first-mile pickup to final delivery, we build for transparent shipment status and clear accountability.', icon: ShieldCheck },
  { title: 'Africa-First Logistics Infrastructure', description: 'Our product design starts with regional realities and scales to global trade routes.', icon: Globe2 },
  { title: 'AI That Solves Real Operations', description: 'We prioritize practical automation that reduces delays, paperwork friction, and dispatch overhead.', icon: Sparkles },
]

const timeline = [
  { year: '2024', label: 'Platform Foundations', detail: 'Built core shipment, customer, and operations modules for multi-tenant freight workflows.' },
  { year: '2025', label: 'Regional Operations Expansion', detail: 'Extended service coverage across key West Africa trade corridors and vendor networks.' },
  { year: '2026', label: 'AI + Mobile Operations', detail: 'Shipped practical GPS, support ticketing, and mobile execution capabilities for field teams.' },
]

const impact = [
  { title: 'Cross-Border Focus', value: 'Ghana <> China', icon: Route },
  { title: 'Operational Model', value: 'Multi-Tenant SaaS', icon: Building2 },
  { title: 'Who We Serve', value: 'Shippers, Vendors, Teams', icon: Users },
]

export default async function StorefrontAboutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await fetchTenantContextServer(slug)
  return (
    <div className="tenant-themed flex min-h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <TenantAboutContent principles={principles} timeline={timeline} impact={impact} />
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  )
}
