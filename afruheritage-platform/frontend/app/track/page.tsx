import { Metadata } from 'next'
import Link from 'next/link'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { TrackingSearch } from '@/components/tracking/tracking-search'
import { AIChatWidget } from '@/components/ai-chat-widget'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Track Shipment | Afruheritage',
  description: 'Track your shipment in real-time. Enter your tracking number to see the current status, location, and estimated delivery time.',
}

export default function TrackPage() {
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

        {/* Delivery Image Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#063f4f] to-[#021f2a] py-12">
          <div className="absolute inset-0 opacity-20">
            <Image
              src="/assets/images/delivery.png"
              alt="Delivery Logistics"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#063f4f] via-[#063f4f]/80 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                Track Your Shipments
              </h1>
              <p className="mt-4 text-lg text-white/85">
                Enter your tracking number to see real-time updates on your shipment location, status, and estimated delivery time.
              </p>
            </div>
          </div>
        </div>
        <TrackingSearch />
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  )
}
