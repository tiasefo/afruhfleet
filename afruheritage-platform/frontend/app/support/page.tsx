import { Metadata } from 'next'
import Link from 'next/link'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { SupportHero } from '@/components/support/support-hero'
import { CreateTicketForm } from '@/components/support/create-ticket-form'
import { TrackTicketSection } from '@/components/support/track-ticket-section'
import { FAQSection } from '@/components/support/faq-section'
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
      
      {/* AFRU_MARKETING_VIDEO_SECTION */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight">AfruHeritage freight in motion</h2>
          <p className="mt-3 text-muted-foreground">
            See how airport cargo, seaport movement, customs processing, trucking, and final-mile delivery connect through the AfruHeritage platform.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border bg-black shadow-sm">
            <video autoPlay muted loop playsInline preload="auto" className="h-80 w-full object-cover opacity-90">
              <source src="/assets/videos/airport-footage-panama-city-panama-ground-crew-unloading-cargo-shipment-from-airplane-on.webm" type="video/webm" />
              <source src="/assets/videos/Truck20004964.mp4" type="video/mp4" />
            </video>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-black shadow-sm">
            <video autoPlay muted loop playsInline preload="auto" className="h-80 w-full object-cover opacity-90">
              <source src="/assets/videos/27427654-preview.mp4" type="video/mp4" />
              <source src="/assets/videos/istockphoto-945121252-640_adpp_is.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
