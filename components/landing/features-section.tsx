'use client'

import { 
  MapPin, 
  Bot, 
  FileText, 
  Users, 
  BarChart3, 
  Shield,
  Truck,
  Clock,
  Globe,
  Zap,
  MessageSquare,
  Package
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
    icon: FileText,
    title: 'Document Management',
    description: 'Digitize bills of lading, customs declarations, and invoices. Never lose a document again.',
    badge: null,
  },
  {
    icon: Users,
    title: 'Group Management',
    description: 'Manage thousands of customers and their shipments efficiently with our bulk tools.',
    badge: null,
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Gain insights into your operations with comprehensive reports and performance metrics.',
    badge: null,
  },
  {
    icon: Shield,
    title: 'Customs Clearance',
    description: 'Streamlined customs processing with automated document verification and status tracking.',
    badge: null,
  },
]

const stats = [
  { value: '10K+', label: 'Shipments Tracked Monthly', icon: Package },
  { value: '45+', label: 'Countries Served', icon: Globe },
  { value: '98.5%', label: 'On-time Delivery', icon: Clock },
  { value: '< 2s', label: 'AI Response Time', icon: Zap },
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

        {/* Stats Row */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center rounded-xl border bg-card p-6 text-center shadow-sm"
            >
              <stat.icon className="mb-2 h-6 w-6 text-primary" />
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
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
