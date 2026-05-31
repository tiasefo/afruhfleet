import { Metadata } from 'next'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { TrackingSearch } from '@/components/tracking/tracking-search'
import { AIChatWidget } from '@/components/ai-chat-widget'

export const metadata: Metadata = {
  title: 'Track Shipment | Afruheritage',
  description: 'Track your shipment in real-time. Enter your tracking number to see the current status, location, and estimated delivery time.',
}

export default function TrackPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <TrackingSearch />
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  )
}
