import { Metadata } from 'next'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { AIChatWidget } from '@/components/ai-chat-widget'

export const metadata: Metadata = {
  title: 'Terms of Service | Afruheritage',
  description: 'Contract terms governing use of Afruheritage services.',
}

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navigation />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-semibold text-slate-900">Terms of Service</h1>
          <p className="mt-2 text-sm text-slate-600">Effective date: June 1, 2026</p>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">1. Agreement</h2>
            <p>
              By using Afruheritage services, you agree to these terms on behalf of yourself and, where applicable, your organization.
            </p>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">2. Service Access</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>You are responsible for account security and all actions performed using your credentials.</li>
              <li>You must provide accurate information for onboarding, billing, and compliance workflows.</li>
              <li>Access may be suspended for abuse, fraud, legal violations, or severe operational risk.</li>
            </ul>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">3. Billing and Credits</h2>
            <p>
              Subscription plans, add-ons, and usage-based credits are billed according to your selected package. You are responsible for applicable
              taxes, fees, and payment instrument validity.
            </p>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">4. Acceptable Use</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>No unauthorized access attempts, reverse engineering, malware, or service disruption.</li>
              <li>No unlawful shipment activity, prohibited cargo processing, or fraudulent records.</li>
              <li>No misuse of marketplace systems to manipulate bidding, routing, or settlement outcomes.</li>
            </ul>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">5. Data and Intellectual Property</h2>
            <p>
              You retain ownership of your business data. Afruheritage retains ownership of platform software, trademarks, and proprietary methods.
              You grant us rights necessary to host and process your data to provide contracted services.
            </p>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">6. Availability and Changes</h2>
            <p>
              We work to keep services available and secure, but uptime is not guaranteed. We may improve or modify features, APIs, and workflows with
              operational notice where practical.
            </p>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Afruheritage is not liable for indirect, consequential, or special damages arising from service use,
              interruption, or third-party system failures.
            </p>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">8. Termination</h2>
            <p>
              Either party may terminate according to contractual terms. Upon termination, service access may be revoked and data handled per legal,
              contractual, and retention obligations.
            </p>
          </section>
        </article>
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  )
}
