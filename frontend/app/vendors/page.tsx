'use client'

import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { VendorHero } from '@/components/vendors/vendor-hero'
import { VendorBenefits } from '@/components/vendors/vendor-benefits'
import { VendorRegistration } from '@/components/vendors/vendor-registration'
import { VendorOperations } from '@/components/vendors/vendor-operations'
import { VendorFAQ } from '@/components/vendors/vendor-faq'
import Link from 'next/link'
import { AIChatWidget } from '@/components/ai-chat-widget'

export default function VendorsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <VendorHero />
        <VendorBenefits />
        <VendorRegistration />
        <VendorOperations />
        <VendorFAQ />
        <div className="flex justify-center mt-8">
          <Link href="/vendors/whatsapp-csv">
            <button className="bg-emerald-600 text-white px-6 py-2 rounded shadow hover:bg-emerald-700 transition">
              Bulk WhatsApp CSV Upload (Admin)
            </button>
          </Link>
        </div>
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  )
}
