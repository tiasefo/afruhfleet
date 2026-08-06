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
import { TemplateRenderer, isSupportedRenderer } from '@/components/storefront/template-renderer'

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
  const rendererKey = tenant?.template_code || null
  const hasRealTemplate = isSupportedRenderer(rendererKey)

  // When the tenant has selected a real production template, render it
  // directly. The template owns its own navigation, footer, and theme.
  if (hasRealTemplate && rendererKey) {
    return <TemplateRenderer rendererKey={rendererKey} />
  }

  // Fallback: legacy generic storefront for tenants without a selected template
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
