'use client'

import { Badge } from '@/components/ui/badge'
import { Headphones, MessageSquare, Clock } from 'lucide-react'

const supportFeatures = [
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Our team is always available',
  },
  {
    icon: MessageSquare,
    title: 'Quick Response',
    description: 'Average reply within 2 hours',
  },
  {
    icon: Clock,
    title: 'Track Tickets',
    description: 'Real-time status updates',
  },
]

export function SupportHero() {
  return (
    <section className="relative overflow-hidden bg-primary py-16 sm:py-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Badge variant="secondary" className="mb-4 bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20">
            Support Center
          </Badge>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl">
            How can we help you today?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-primary-foreground/80">
            Create a support ticket, track your existing requests, or browse our FAQ. 
            We&apos;re here to help you with all your freight forwarding needs.
          </p>
        </div>

        {/* Support Features */}
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {supportFeatures.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 p-6 text-center backdrop-blur"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/10">
                <feature.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mt-4 font-semibold text-primary-foreground">
                {feature.title}
              </h3>
              <p className="mt-1 text-sm text-primary-foreground/70">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
