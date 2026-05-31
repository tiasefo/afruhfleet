'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'

const steps = [
  {
    number: '01',
    title: 'Create Your Account',
    description: 'Sign up in minutes and customize your branded freight portal. Your customers will see your brand, not ours.',
    features: ['White-label branding', 'Custom domain support', 'Multi-language setup'],
  },
  {
    number: '02',
    title: 'Import Your Shipments',
    description: 'Bulk import thousands of shipments via CSV or create them individually. Our AI validates and enriches your data.',
    features: ['CSV bulk import', 'Real-time validation', 'Auto-geocoding'],
  },
  {
    number: '03',
    title: 'Track & Manage',
    description: 'Monitor all shipments on an interactive map. Update statuses, add events, and keep customers informed automatically.',
    features: ['Live GPS tracking', 'Automated notifications', 'Event timeline'],
  },
  {
    number: '04',
    title: 'Scale with AI',
    description: 'Let our AI handle customer inquiries, generate quotes, and provide 24/7 support in English and Chinese.',
    features: ['AI chatbot support', 'Bilingual (EN/中文)', 'Smart automation'],
  },
]

export function HowItWorks() {
  return (
    <section id="platform" className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">
            How It Works
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Go live in days, not months
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Our platform is designed for rapid deployment. Start managing shipments immediately with zero infrastructure setup.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-16 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector Line (desktop) */}
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-8 hidden h-0.5 w-full bg-gradient-to-r from-primary/50 to-primary/10 lg:block" />
              )}
              
              <div className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
                {/* Step Number */}
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-background text-xl font-bold text-primary shadow-sm">
                  {step.number}
                </div>
                
                <h3 className="mt-6 text-xl font-semibold text-foreground">
                  {step.title}
                </h3>
                
                <p className="mt-3 text-muted-foreground">
                  {step.description}
                </p>
                
                <ul className="mt-4 space-y-2">
                  {step.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
