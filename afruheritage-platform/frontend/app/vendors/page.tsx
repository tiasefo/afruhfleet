'use client'

import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { VendorHero } from '@/components/vendors/vendor-hero'
import { VendorBenefits } from '@/components/vendors/vendor-benefits'
import { VendorRegistration } from '@/components/vendors/vendor-registration'
import { VendorFAQ } from '@/components/vendors/vendor-faq'
import { AIChatWidget } from '@/components/ai-chat-widget'

export default function VendorsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <VendorHero />
        <VendorBenefits />
        <VendorRegistration />
        <VendorFAQ />
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  )
}
