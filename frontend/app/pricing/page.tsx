import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { Button } from '@/components/ui/button'

const plans = [
  {
    key: 'professional',
    name: 'Starter',
    price: '$49',
    cadence: '/month',
    description: 'For small import/export teams starting digital operations.',
    monthlyCredits: 1200,
    features: ['Customer portal and shipment tracking', 'Manual KYC workflow', 'Vendor operations', 'AI assistant access'],
  },
  {
    key: 'business',
    name: 'Growth',
    price: '$199',
    cadence: '/month',
    description: 'For fast-moving freight teams running multi-country operations.',
    monthlyCredits: 3500,
    features: ['Everything in Starter', 'API integrations', 'Custom domain support', 'Priority support'],
  },
  {
    key: 'delivery_services',
    name: 'Enterprise',
    price: 'Custom',
    cadence: '',
    description: 'For high-volume operators needing dedicated onboarding and integrations.',
    monthlyCredits: 10000,
    features: ['Everything in Growth', 'Dedicated onboarding', 'Large-volume operations support', 'Highest credit allocation'],
  },
]

const usageCosts = [
  'AI chat message: 2 credits per message',
  'Manual KYC submission: 15 credits per submission',
  'Vendor document upload: 8 credits per file',
]

const flow = [
  'Choose a plan and create your company account',
  'Complete KYC and tenant provisioning',
  'Connect Fleetbase/live API endpoints',
  'Go live with tracking, vendors, and customer portal',
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button asChild variant="ghost" className="-ml-2">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">Pricing & Subscription</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Transparent plans for freight teams at every stage. Start with a trial account, then upgrade when your tenant is provisioned and live API connections are in place.
          </p>
        </div>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">{plan.name}</h2>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {plan.price}
                <span className="text-base font-medium text-slate-500">{plan.cadence}</span>
              </p>
              <p className="mt-3 text-sm text-slate-600">{plan.description}</p>
              <div className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-800">
                Monthly credits assigned: {plan.monthlyCredits.toLocaleString()}
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full">
                <Link href={`/register?plan=${plan.key}`}>Start Trial</Link>
              </Button>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Usage credit deduction rules</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {usageCosts.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Current subscription flow</h3>
          <ol className="mt-4 space-y-3 text-sm text-slate-700">
            {flow.map((step, idx) => (
              <li key={step} className="flex gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/register">Create Account</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/support">Talk to Sales</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
