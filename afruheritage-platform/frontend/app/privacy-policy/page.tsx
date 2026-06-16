import { Metadata } from 'next'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'

export const metadata: Metadata = {
  title: 'Privacy Policy | Afruheritage',
  description: 'How Afruheritage collects, uses, stores, and protects personal data.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navigation />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-semibold text-slate-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-600">Effective date: June 1, 2026</p>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">1. Scope</h2>
            <p>
              This policy explains how Afruheritage, powered by Infotech Freight Forwarding, handles personal data when you use our websites,
              applications, logistics tools, and support channels.
            </p>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">2. Data We Collect</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Account and company profile information, including names, email addresses, and phone numbers.</li>
              <li>Shipment, route, tracking, marketplace, and transactional data required to deliver logistics services.</li>
              <li>Billing and payment metadata, subscription records, and support communication details.</li>
              <li>Technical telemetry such as browser type, IP address, request logs, and security event data.</li>
            </ul>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">3. How We Use Data</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>To provide shipment management, marketplace dispatching, and GPS tracking services.</li>
              <li>To operate subscriptions, payments, invoicing, and wallet credit management.</li>
              <li>To prevent abuse, maintain platform integrity, and investigate incidents.</li>
              <li>To improve platform performance, reliability, and customer support outcomes.</li>
            </ul>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">4. Sharing and Processors</h2>
            <p>
              We share data only with service providers and partners needed to operate the platform, such as infrastructure, payment, communication,
              and support tooling providers. We require processors to apply contractual and technical safeguards.
            </p>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">5. Retention</h2>
            <p>
              We retain personal data only as long as necessary for contractual, operational, legal, and security requirements, then securely delete
              or anonymize it according to internal retention schedules.
            </p>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">6. Security</h2>
            <p>
              We use layered controls, including access control, encryption where appropriate, auditing, and incident response workflows. No system is
              fully risk-free, but we continuously improve controls and monitoring.
            </p>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">7. Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may have rights to access, correct, delete, restrict processing, object, or request data portability.
              You may also withdraw consent where processing relies on consent.
            </p>
          </section>

          <section className="mt-6 space-y-3 text-sm text-slate-700">
            <h2 className="text-lg font-semibold text-slate-900">8. Contact</h2>
            <p>
              For privacy requests, contact our support team through the Help Center at /support. We may request verification before processing
              account-level data requests.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  )
}
