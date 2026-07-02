'use client'

import { useTenant } from '@/components/tenant-context-provider'
import type { LucideIcon } from 'lucide-react'

interface Principle {
  title: string
  description: string
  icon: LucideIcon
}

interface TimelineItem {
  year: string
  label: string
  detail: string
}

interface ImpactItem {
  title: string
  value: string
  icon: LucideIcon
}

interface TenantAboutContentProps {
  principles: Principle[]
  timeline: TimelineItem[]
  impact: ImpactItem[]
}

export function TenantAboutContent({ principles, timeline, impact }: TenantAboutContentProps) {
  const tenant = useTenant()
  const companyName = tenant?.company_name || 'Afruheritage'
  const tagline = tenant?.tagline || 'AI-powered freight forwarding platform'

  return (
    <>
      <section className="border-b bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <p className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            About {companyName}
          </p>
          <h1 className="mt-6 max-w-4xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Building dependable freight operations for African trade at global scale
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            {companyName} is {tagline}. We combine shipment orchestration, vendor operations, and customer support into one operating layer for teams moving cargo across complex corridors.
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
    </>
  )
}
