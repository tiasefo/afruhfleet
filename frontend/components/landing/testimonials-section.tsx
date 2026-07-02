'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Quote } from 'lucide-react'
import { useTenant } from '@/components/tenant-context-provider'

const testimonials = [
  {
    quote: "This platform transformed how we manage shipments between Guangzhou and Accra. The AI assistant handles customer queries in both English and Chinese, saving us hours daily.",
    author: "James Mensah",
    role: "Operations Director",
    company: "Golden Star Logistics",
    initials: "JM",
  },
  {
    quote: "The bulk CSV import feature is a game-changer. We import 500+ shipments weekly from our China warehouse and everything syncs perfectly with customer tracking.",
    author: "Chen Wei",
    role: "Supply Chain Manager",
    company: "Sino-Africa Trade Co.",
    initials: "CW",
  },
  {
    quote: "Our customers love the real-time tracking. The WeChat-friendly interface means our Chinese suppliers can check shipment status without language barriers.",
    author: "Kwame Asante",
    role: "CEO",
    company: "Heritage Freight Ghana",
    initials: "KA",
  },
]

const trustedBy = [
  'Golden Star Logistics',
  'Sino-Africa Trade',
  'Heritage Freight',
  'West African Cargo',
  'China Link Express',
  'Accra Shipping Co.',
]

export function TestimonialsSection() {
  const tenant = useTenant()
  const companyName = tenant?.company_name || 'Afruheritage'
  return (
    <section className="bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">
            Testimonials
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Trusted by freight forwarders across Africa and Asia
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            See what our customers say about transforming their logistics operations with {companyName}.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <Quote className="absolute right-4 top-4 h-8 w-8 text-primary/10" />
                <p className="relative text-muted-foreground leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-primary/10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trusted By Logos */}
        <div className="mt-20">
          <p className="text-center text-sm font-medium text-muted-foreground">
            TRUSTED BY LEADING FREIGHT FORWARDERS
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {trustedBy.map((company) => (
              <div
                key={company}
                className="text-lg font-semibold text-muted-foreground/50 transition-colors hover:text-muted-foreground"
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
