'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Check, Zap, Shield, Globe, Headphones, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { billingAPI } from '@/lib/api'
import { resolvePublicTenantId, resolveTenantId } from '@/lib/tenant'

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
  free_trial: [
    'Basic shipment tracking',
    'Up to 50 shipments/month',
    'Email support',
    'AI assistant (limited)',
  ],
  professional: [
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
  free_trial: Zap,
  professional: Shield,
  business: Globe,
  delivery_services: Headphones,
}


const AFRU_PLAN_ORDER: Record<string, number> = {
  'Free Trial': 0,
  'Starter': 1,
  'Growth': 2,
  'Enterprise': 3,
}

function orderPlans<T extends { name?: string; title?: string }>(plans: T[]): T[] {
  return [...plans].sort((a, b) => {
    const an = a.name || a.title || ''
    const bn = b.name || b.title || ''
    return (AFRU_PLAN_ORDER[an] ?? 99) - (AFRU_PLAN_ORDER[bn] ?? 99)
  })
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const data = await billingAPI.getPlans()
      setPlans(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load pricing')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = (plan: Plan) => {
    const tenantId = resolvePublicTenantId() || resolveTenantId()
    const suffix = tenantId ? `&tenant_id=${encodeURIComponent(tenantId)}` : ''

    if (!token) {
      router.push(`/checkout?plan=${encodeURIComponent(plan.code)}${suffix}`)
      return
    }

    router.push(`/billing?plan=${encodeURIComponent(plan.code)}${tenantId ? `&tenant_id=${encodeURIComponent(tenantId)}` : ''}`)
  }

  const formatPrice = (plan: Plan) => {
    if (plan.price_amount === 0) return 'Free'
    return `${plan.currency} ${plan.price_amount.toFixed(2)}`
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        {/* Back Button */}
        <div className="bg-white border-b">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href="/"
              className="inline-flex items-center text-sm font-medium text-[#063f4f] hover:text-[#052f3b] transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>

        {/* Marketing Video Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-16">
          <div className="absolute inset-0 opacity-25">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            >
              <source src="/assets/videos/istockphoto-918314666-640_adpp_is.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/70 to-blue-900/40" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-bold">Pricing for Every Logistics Scale</h2>
              <p className="mt-4 text-lg text-white/85">
                From startups to enterprises, choose a plan that grows with your freight forwarding business. 
                No hidden fees, no surprises.
              </p>
            </div>
          </div>
        </section>

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
                {orderPlans(plans).map((plan) => {
                  const features = planFeatures[plan.code] || []
                  const Icon = planIcons[plan.code] || Zap
                  const isPopular = plan.code === 'professional'

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
    </div>
  )
}
