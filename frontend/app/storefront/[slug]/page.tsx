import type { Metadata } from 'next'
import { resolveTenantContext, generateTenantMetadata, generateTenantIcons } from '@/lib/tenant-metadata'
import { fetchTenantContextServer } from '@/lib/tenant-context-server'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { AIChatWidget } from '@/components/ai-chat-widget'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { HowItWorks } from '@/components/landing/how-it-works'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { CTASection } from '@/components/landing/cta-section'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const tenant = await fetchTenantContextServer(slug)
  const metadata = generateTenantMetadata(tenant)
  const icons = generateTenantIcons(tenant)
  if (icons) {
    metadata.icons = icons
  }
  return metadata
}

export default async function StorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await fetchTenantContextServer(slug)
  return (
    <div className="tenant-themed">
      <Navigation />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  )
}
