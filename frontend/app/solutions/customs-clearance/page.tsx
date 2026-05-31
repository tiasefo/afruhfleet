import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { Button } from '@/components/ui/button'

export default function CustomsClearancePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" className="-ml-2">
          <Link href="/solutions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Solutions
          </Link>
        </Button>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Customs Clearance</h1>
        <p className="mt-3 text-slate-600">
          Manage declarations, document checks, and customs status in a single operational workflow.
        </p>
      </main>
      <Footer />
    </div>
  )
}
