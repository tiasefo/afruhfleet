import { Metadata } from 'next'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'

export const metadata: Metadata = {
  title: 'Cookie Policy | Afruheritage',
  description: 'Cookie usage and controls for Afruheritage websites and applications.',
}

export default function CookiePolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navigation />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-semibold text-slate-900">Cookie Policy</h1>
          <p className="mt-2 text-sm text-slate-600">Effective date: June 1, 2026</p>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">1. What Cookies Are</h2>
            <p>
              Cookies are small data files placed on your browser or device to help websites remember settings, session state, and preferences.
            </p>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">2. How We Use Cookies</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Essential cookies for authentication, security checks, and core platform functionality.</li>
              <li>Preference cookies for language, UX settings, and persistent session behavior.</li>
              <li>Analytics cookies to understand usage and improve reliability and usability.</li>
            </ul>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">3. Third-Party Technologies</h2>
            <p>
              Some integrations may set cookies or similar identifiers through embedded services. Their processing is governed by the relevant provider
              policies and contractual controls.
            </p>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">4. Managing Cookies</h2>
            <p>
              You can manage or disable cookies in browser settings. Disabling essential cookies may impact login, billing, support, and workflow
              continuity across the platform.
            </p>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">5. Updates</h2>
            <p>
              We may update this policy when technologies or legal requirements change. Material changes are reflected on this page with an updated
              effective date.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  )
}
