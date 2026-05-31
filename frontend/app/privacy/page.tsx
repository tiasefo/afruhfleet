import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { Button } from '@/components/ui/button'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" className="-ml-2">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        <article className="mt-4 rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: May 22, 2026</p>

          <section className="mt-6 space-y-4 text-sm leading-6 text-slate-700">
            <p>
              Afruheritage collects account, shipment, and operational data required to deliver freight forwarding services,
              customer tracking, vendor operations, and compliance workflows.
            </p>
            <p>
              We use this data to authenticate users, process shipments, provide support, improve platform reliability,
              and meet legal and regulatory obligations across supported regions.
            </p>
            <p>
              We do not sell personal data. Data may be shared with service providers and logistics partners strictly for
              service delivery, security, and compliance purposes.
            </p>
            <p>
              You may request access, correction, or deletion of your personal data by contacting
              <a className="ml-1 text-blue-600 hover:underline" href="mailto:support@afruheritage.com">support@afruheritage.com</a>.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  )
}
