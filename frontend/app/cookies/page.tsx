import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { Button } from '@/components/ui/button'

export default function CookiesPage() {
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
          <h1 className="text-3xl font-bold text-slate-900">Cookie Policy</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: May 22, 2026</p>

          <section className="mt-6 space-y-4 text-sm leading-6 text-slate-700">
            <p>
              Afruheritage uses essential cookies to maintain authentication sessions, secure requests, and preserve user
              navigation state.
            </p>
            <p>
              Session cookies such as access token and user profile metadata are used to keep users signed in and route
              them to role-specific dashboards.
            </p>
            <p>
              We may use limited analytics and performance cookies to improve reliability and user experience.
              You can clear cookies from your browser settings at any time.
            </p>
            <p>
              Questions about cookie handling can be sent to
              <a className="ml-1 text-blue-600 hover:underline" href="mailto:support@afruheritage.com">support@afruheritage.com</a>.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  )
}
