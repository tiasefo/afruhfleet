'use client'

import { Card, CardContent } from '@/components/ui/card'
import { 
  DollarSign, 
  Users, 
  Shield, 
  Clock, 
  TrendingUp, 
  Smartphone,
  CreditCard,
  MapPin
} from 'lucide-react'

const benefits = [
  {
    icon: DollarSign,
    title: 'Flexible Credit System',
    description: 'Use our credit-based payment model. Get paid reliably and manage your earnings transparently.',
  },
  {
    icon: Users,
    title: 'Access to Network',
    description: 'Connect with verified freight forwarders and tenants actively looking for delivery services.',
  },
  {
    icon: Shield,
    title: 'Insurance & Protection',
    description: 'Your deliveries are protected. We provide coverage for goods in transit.',
  },
  {
    icon: Clock,
    title: 'Flexible Schedule',
    description: 'Work on your own terms. Accept jobs that fit your schedule and location.',
  },
  {
    icon: TrendingUp,
    title: 'Grow Your Business',
    description: 'Scale from individual operator to fleet owner with our business tools.',
  },
  {
    icon: Smartphone,
    title: 'Easy Mobile App',
    description: 'Manage deliveries, track earnings, and communicate with clients via our app.',
  },
  {
    icon: CreditCard,
    title: 'Quick Payments',
    description: 'Get paid promptly through mobile money, bank transfer, or our credit wallet.',
  },
  {
    icon: MapPin,
    title: 'Route Optimization',
    description: 'Our AI helps you find the most efficient routes and maximize your earnings.',
  },
]

export function VendorBenefits() {
  return (
    <section id="benefits" className="py-20 lg:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Why Partner With Us?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Join hundreds of delivery partners who are growing their businesses with Afruheritage.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <Card key={index} className="border-border/50 bg-card/50 backdrop-blur transition-all hover:border-primary/30 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <benefit.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{benefit.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 rounded-2xl bg-primary p-8 sm:p-12">
          <div className="grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-4xl font-bold text-primary-foreground">500+</div>
              <div className="mt-2 text-primary-foreground/80">Active Vendors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-foreground">50K+</div>
              <div className="mt-2 text-primary-foreground/80">Deliveries Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-foreground">98%</div>
              <div className="mt-2 text-primary-foreground/80">Success Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-foreground">GHS 2M+</div>
              <div className="mt-2 text-primary-foreground/80">Paid to Partners</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
