import { Metadata } from 'next'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { BackButton } from '@/components/back-button'
import { TicketDetail } from '@/components/support/ticket-detail'

export const metadata: Metadata = {
  title: 'Ticket Details | Afruheritage Support',
  description: 'View and respond to your support ticket',
}

interface PageProps {
  params: Promise<{
    token: string
  }>
}

export default async function TicketPage({ params }: PageProps) {
  const { token } = await params
  
  return (
  <>
    <BackButton fallback="/support" />
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <TicketDetail token={token} />
        </div>
      </main>
      <Footer />
    </div>
    </>
  )
}
