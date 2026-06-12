import { Metadata } from 'next'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { AIChatWidget } from '@/components/ai-chat-widget'

export const metadata: Metadata = {
  title: 'GDPR Notice | Afruheritage',
  description: 'GDPR data processing, legal basis, and data subject rights notice.',
}

export default function GDPRNoticePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navigation />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-semibold text-slate-900">GDPR Notice</h1>
          <p className="mt-2 text-sm text-slate-600">Effective date: June 1, 2026</p>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">1. Roles</h2>
            <p>
              Depending on context, Afruheritage may act as controller or processor. Tenant organizations may also act as independent controllers for
              their customer and operational data.
            </p>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">2. Legal Bases</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Performance of a contract for service delivery and account operations.</li>
              <li>Legitimate interests including security, abuse prevention, and service improvement.</li>
              <li>Legal obligations such as tax, accounting, and compliance recordkeeping.</li>
              <li>Consent where required for specific communications or optional processing.</li>
            </ul>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">3. International Transfers</h2>
            <p>
              Where personal data is transferred across borders, we apply appropriate transfer safeguards, contractual clauses, and security controls
              designed to meet GDPR obligations.
            </p>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">4. Data Subject Rights</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Right of access, correction, deletion, and processing restriction.</li>
              <li>Right to object and right to data portability where applicable.</li>
              <li>Right to withdraw consent where processing relies on consent.</li>
              <li>Right to lodge a complaint with your supervisory authority.</li>
            </ul>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">5. Requests</h2>
            <p>
              You may submit GDPR requests through our support channels at /support. We may require identity verification and additional context before
              fulfilling requests.
            </p>
          </section>
        </article>
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  )
}
