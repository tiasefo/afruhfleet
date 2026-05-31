import { Metadata } from 'next'
import { Globe2, ShieldCheck, Route, Users, Sparkles, Building2 } from 'lucide-react'

import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { AIChatWidget } from '@/components/ai-chat-widget'

export const metadata: Metadata = {
  title: 'About Us | Afruheritage',
  description:
    'Learn about Afruheritage mission, leadership focus, and the logistics infrastructure we are building for African and global trade corridors.',
}

const principles = [
  {
    title: 'Trust Through Visibility',
    description:
      'From first-mile pickup to final delivery, we build for transparent shipment status and clear accountability.',
    icon: ShieldCheck,
  },
  {
    title: 'Africa-First Logistics Infrastructure',
    description:
      'Our product design starts with regional realities and scales to global trade routes.',
    icon: Globe2,
  },
  {
    title: 'AI That Solves Real Operations',
    description:
      'We prioritize practical automation that reduces delays, paperwork friction, and dispatch overhead.',
    icon: Sparkles,
  },
]

const timeline = [
  {
    year: '2024',
    label: 'Platform Foundations',
    detail: 'Built core shipment, customer, and operations modules for multi-tenant freight workflows.',
  },
  {
    year: '2025',
    label: 'Regional Operations Expansion',
    detail: 'Extended service coverage across key West Africa trade corridors and vendor networks.',
  },
  {
    year: '2026',
    label: 'AI + Mobile Operations',
    detail: 'Shipped practical GPS, support ticketing, and mobile execution capabilities for field teams.',
  },
]

const impact = [
  {
    title: 'Cross-Border Focus',
    value: 'Ghana <> China',
    icon: Route,
  },
  {
    title: 'Operational Model',
    value: 'Multi-Tenant SaaS',
    icon: Building2,
  },
  {
    title: 'Who We Serve',
    value: 'Shippers, Vendors, Teams',
    icon: Users,
  },
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-b from-primary/10 via-background to-background">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
            <p className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              About Afruheritage
            </p>
            <h1 className="mt-6 max-w-4xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Building dependable freight operations for African trade at global scale
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              Afruheritage is an AI-powered freight forwarding platform focused on practical logistics execution. We
              combine shipment orchestration, vendor operations, and customer support into one operating layer for
              teams moving cargo across complex corridors.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {impact.map((item) => {
              const Icon = item.icon
              return (
                <article
                  key={item.title}
                  className="rounded-xl border bg-card p-6 shadow-sm transition-colors hover:border-primary/30"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{item.title}</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{item.value}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8 lg:pb-16">
          <div className="grid gap-8 lg:grid-cols-3">
            {principles.map((principle) => {
              const Icon = principle.icon
              return (
                <article key={principle.title} className="rounded-xl border bg-card p-6">
                  <div className="mb-4 inline-flex rounded-lg bg-accent/20 p-2 text-accent-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">{principle.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{principle.description}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="border-y bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Our Journey</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {timeline.map((step) => (
                <article key={step.year} className="rounded-xl border bg-card p-6">
                  <p className="text-sm font-semibold text-primary">{step.year}</p>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">{step.label}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{step.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  )
}
