'use client'

import Link from 'next/link'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { VendorHero } from '@/components/vendors/vendor-hero'
import { VendorBenefits } from '@/components/vendors/vendor-benefits'
import { VendorRegistration } from '@/components/vendors/vendor-registration'
import { VendorFAQ } from '@/components/vendors/vendor-faq'
import { ArrowLeft } from 'lucide-react'

export default function VendorsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        {/* Back Button */}
        <div className="bg-white border-b">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href="/"
              className="inline-flex items-center text-sm font-medium text-[#063f4f] hover:text-[#052f3b] transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
        <VendorHero />
        <VendorBenefits />
        <VendorRegistration />
        <VendorFAQ />
      </main>
      <Footer />
    </div>
  )
}
