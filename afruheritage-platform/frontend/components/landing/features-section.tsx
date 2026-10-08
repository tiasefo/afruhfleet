'use client'

import {
  MapPin,
  Bot,
  Users,
  BarChart3,
  Shield,
  Truck,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const features = [
  {
    icon: MapPin,
    title: 'Real-time Tracking',
    description: 'Track every shipment from origin to destination with live GPS updates and milestone notifications.',
    badge: null,
  },
  {
    icon: Bot,
    title: 'AI Assistant',
    description: 'Get instant answers about shipments, quotes, and customs with our intelligent chatbot available 24/7.',
    badge: 'AI Powered',
  },
  {
    icon: Truck,
    title: 'Fleet Management',
    description: 'Register drivers and vehicles, then assign them to shipments for dispatch and delivery.',
    badge: null,
  },
  {
    icon: Users,
    title: 'Team & Contact Management',
    description: 'Invite team members with role-based access and manage customer contacts and quotes.',
    badge: null,
  },
  {
    icon: BarChart3,
    title: 'Operational Dashboard',
    description: 'See shipment status, wallet balance, and fleet activity from a single dashboard.',
    badge: null,
  },
  {
    icon: Shield,
    title: 'Customs Duty Estimation',
    description: 'Estimate import duties upfront with the built-in customs duty calculator.',
    badge: null,
  },
]

export function FeaturesSection() {
  return (
    <section id="solutions" className="bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">
            Platform Features
          </Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to manage freight operations
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            From tracking to customs, our platform handles the complexity so you can focus on growing your business.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/20">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  {feature.badge && (
                    <Badge variant="secondary" className="bg-accent/10 text-accent-foreground border-accent/20">
                      {feature.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="mt-4">{feature.title}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary to-accent transition-all group-hover:w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
