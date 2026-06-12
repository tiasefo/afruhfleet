import { Metadata } from 'next'
import Link from 'next/link'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { SupportHero } from '@/components/support/support-hero'
import { CreateTicketForm } from '@/components/support/create-ticket-form'
import { TrackTicketSection } from '@/components/support/track-ticket-section'
import { FAQSection } from '@/components/support/faq-section'
import { AIChatWidget } from '@/components/ai-chat-widget'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Support | Afruheritage',
  description: 'Get help with your shipments, create support tickets, and track existing requests. Our team is available 24/7 to assist you.',
}

export default function SupportPage() {
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
        <SupportHero />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <CreateTicketForm />
            <TrackTicketSection />
          </div>
        </div>
        <FAQSection />
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  )
}
