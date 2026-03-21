'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { AIChatWidget } from '@/components/ai-chat-widget'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Check, Zap, Shield, Globe, Headphones } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'

interface Plan {
  code: string
  name: string
  currency: string
  price_amount: number
  monthly_credit_allowance: number
  includes_custom_domain: boolean
  includes_priority_support: boolean
}

const planFeatures: Record<string, string[]> = {
  trial: [
    'Basic shipment tracking',
    'Up to 50 shipments/month',
    'Email support',
    'AI assistant (limited)',
  ],
  pro: [
    'Unlimited shipments',
    'Real-time tracking & maps',
    'CSV bulk import',
    'AI assistant (full)',
    'Priority email support',
    'Group members (up to 1,000)',
  ],
  business: [
    'Everything in Pro',
    'Custom domain',
    'Priority phone & email support',
    'Dedicated account manager',
    'Group members (up to 5,000)',
    'API access',
    'Advanced analytics',
  ],
  delivery_services: [
    'Vendor marketplace access',
    'Vehicle fleet management',
    'Service booking system',
    'Earnings dashboard',
    'Automated payouts',
  ],
}

const planIcons: Record<string, any> = {
  trial: Zap,
  pro: Shield,
  business: Globe,
  delivery_services: Headphones,
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { token } = useAuth()
  const { t } = useI18n()
  const router = useRouter()

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const res = await fetch('/api/v1/billing/plans')
      if (!res.ok) throw new Error('Failed to load plans')
      const data = await res.json()
      setPlans(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load pricing')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = (plan: Plan) => {
    if (!token) {
      router.push('/register')
      return
    }
    router.push(`/dashboard?plan=${plan.code}`)
  }

  const formatPrice = (plan: Plan) => {
    if (plan.price_amount === 0) return 'Free'
    return `${plan.currency} ${plan.price_amount.toFixed(2)}`
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Simple, Transparent Pricing
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Choose the plan that fits your freight forwarding needs. All plans include core platform features.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="mx-auto mt-12 max-w-md text-center">
                <p className="text-red-600">{error}</p>
                <Button onClick={loadPlans} className="mt-4">Retry</Button>
              </div>
            ) : (
              <div className="mt-16 grid gap-8 lg:grid-cols-3 xl:grid-cols-4">
                {plans.map((plan) => {
                  const features = planFeatures[plan.code] || []
                  const Icon = planIcons[plan.code] || Zap
                  const isPopular = plan.code === 'pro'

                  return (
                    <Card
                      key={plan.code}
                      className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg ring-1 ring-primary' : ''}`}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                        </div>
                      )}
                      <CardHeader className="text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <CardDescription>
                          {plan.monthly_credit_allowance > 0
                            ? `${plan.monthly_credit_allowance.toLocaleString()} credits/month`
                            : 'Pay as you go'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col">
                        <div className="mb-6 text-center">
                          <span className="text-4xl font-bold">{formatPrice(plan)}</span>
                          {plan.price_amount > 0 && (
                            <span className="text-muted-foreground">/month</span>
                          )}
                        </div>

                        <ul className="mb-8 flex-1 space-y-3">
                          {features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-sm">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <span>{feature}</span>
                            </li>
                          ))}
                          {plan.includes_custom_domain && (
                            <li className="flex items-start gap-2 text-sm">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <span>Custom domain included</span>
                            </li>
                          )}
                          {plan.includes_priority_support && (
                            <li className="flex items-start gap-2 text-sm">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <span>Priority support</span>
                            </li>
                          )}
                        </ul>

                        <Button
                          onClick={() => handleSelectPlan(plan)}
                          variant={isPopular ? 'default' : 'outline'}
                          className="w-full"
                        >
                          {plan.price_amount === 0 ? 'Start Free Trial' : 'Get Started'}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  )
}
