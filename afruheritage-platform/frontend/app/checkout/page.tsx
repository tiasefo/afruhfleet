'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Check, ArrowLeft, ArrowRight, CreditCard, Building2, Mail, Phone, Zap, Shield, Globe, Headphones } from 'lucide-react'
import { commercialApi } from '@/lib/api_updated'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'

interface Plan {
  code: string
  name: string
  monthly_price: number
  credits: number
}

const planFeatures: Record<string, string[]> = {
  free: [
    'Basic shipment tracking',
    '50 credits included',
    'Email support',
    'AI assistant (limited)',
  ],
  professional: [
    'Unlimited shipments',
    'Real-time tracking & maps',
    'CSV bulk import',
    '500 credits/month',
    'Priority email support',
  ],
  business: [
    'Everything in Professional',
    'Custom domain support',
    'Priority phone & email support',
    '1,500 credits/month',
    'Advanced analytics',
    'API access',
  ],
  vendor_driver: [
    'Vendor marketplace access',
    'Vehicle fleet management',
    'Service booking system',
    '100 credits/month',
    'Earnings dashboard',
  ],
}

const planIcons: Record<string, any> = {
  free: Zap,
  professional: Shield,
  business: Globe,
  vendor_driver: Headphones,
}

const STEPS = ['Account', 'Plan', 'Payment'] as const

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetPlan = searchParams.get('plan') || ''

  const [step, setStep] = useState(0)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('')
  const [signupId, setSignupId] = useState('')
  const [checkoutUrl, setCheckoutUrl] = useState('')

  useEffect(() => {
    loadPlans()
  }, [])

  useEffect(() => {
    if (presetPlan && plans.length > 0) {
      setSelectedPlan(presetPlan)
      setStep(1)
    }
  }, [presetPlan, plans])

  const loadPlans = async () => {
    try {
      const res = await fetch('/api/v1/commercial/catalog')
      const data = await res.json()
      const catalogPlans = (data.plans || []).map((p: any) => ({
        code: p.code,
        name: p.name,
        monthly_price: p.monthly_price,
        credits: p.credits,
      }))
      setPlans(catalogPlans)
      if (!presetPlan && catalogPlans.length > 0) {
        setSelectedPlan(catalogPlans[0].code)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load plans')
    } finally {
      setLoadingPlans(false)
    }
  }

  const handleStartSignup = async () => {
    if (!email) {
      setError('Email is required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await commercialApi.startSignup({
        email,
        phone: phone || undefined,
        account_type: 'tenant_org',
      })
      const data = (res as any)?.data ?? res
      setSignupId(data.signup_id)
      setStep(1)
    } catch (err: any) {
      setError(err.message || 'Failed to start signup')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelectPlan = async () => {
    if (!signupId || !selectedPlan) {
      setError('Missing signup or plan selection')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const plan = plans.find(p => p.code === selectedPlan)
      const isFree = plan?.monthly_price === 0 || selectedPlan === 'free'

      const res = await commercialApi.selectPlan({
        signup_id: signupId,
        plan_code: selectedPlan,
        addons: [],
        payment_method: 'paystack',
        callback_url: `${window.location.origin}/billing`,
      })
      const data = (res as any)?.data ?? res

      if (data.checkout_url) {
        setCheckoutUrl(data.checkout_url)
        setStep(2)
      } else if (data.status === 'free_tier_ready' || isFree) {
        router.push('/billing?status=active')
      } else {
        setError('Unexpected response from server')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to select plan')
    } finally {
      setSubmitting(false)
    }
  }

  const redirectToCheckout = () => {
    if (checkoutUrl) {
      window.location.href = checkoutUrl
    }
  }

  const formatPrice = (plan: Plan) => {
    if (plan.monthly_price === 0) return 'Free'
    return `GHS ${plan.monthly_price.toLocaleString()}`
  }

  const selectedPlanObj = plans.find(p => p.code === selectedPlan)

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <div className="bg-white border-b">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/pricing" className="inline-flex items-center text-sm font-medium text-[#063f4f] hover:text-[#052f3b] transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pricing
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
          {/* Step indicator */}
          <div className="mb-10 flex items-center justify-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  i <= step ? 'bg-[#063f4f] text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`ml-2 text-sm ${i <= step ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                  {label}
                </span>
                {i < STEPS.length - 1 && <div className={`mx-3 h-px w-12 ${i < step ? 'bg-[#063f4f]' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Step 0: Account */}
          {step === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#063f4f]" />
                  Create Your Account
                </CardTitle>
                <CardDescription>Enter your details to get started with Afruheritage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    placeholder="Acme Logistics Ltd"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="+233 50 000 0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleStartSignup}
                  disabled={submitting || !email}
                  className="w-full bg-[#063f4f] hover:bg-[#052f3b]"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Continue to Plan Selection
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#063f4f] font-medium hover:underline">Sign in</Link>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Plan Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Choose Your Plan</h2>
                <p className="mt-2 text-muted-foreground">Select the plan that fits your business needs.</p>
              </div>

              {loadingPlans ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#063f4f]" />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {plans.map((plan) => {
                    const features = planFeatures[plan.code] || []
                    const Icon = planIcons[plan.code] || Zap
                    const isSelected = selectedPlan === plan.code
                    const isPopular = plan.code === 'professional'

                    return (
                      <Card
                        key={plan.code}
                        className={`relative cursor-pointer transition-all ${
                          isSelected ? 'border-[#063f4f] ring-2 ring-[#063f4f]' : 'hover:border-muted-foreground/30'
                        }`}
                        onClick={() => setSelectedPlan(plan.code)}
                      >
                        {isPopular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <Badge className="bg-[#063f4f] text-white">Most Popular</Badge>
                          </div>
                        )}
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#063f4f]/10 text-[#063f4f]">
                                <Icon className="h-5 w-5" />
                              </div>
                              <CardTitle className="text-lg">{plan.name}</CardTitle>
                            </div>
                            {isSelected && (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#063f4f]">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          <CardDescription>
                            {plan.credits > 0
                              ? `${plan.credits.toLocaleString()} credits/month`
                              : 'Pay as you go'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-4">
                            <span className="text-2xl font-bold">{formatPrice(plan)}</span>
                            {plan.monthly_price > 0 && <span className="text-muted-foreground text-sm">/month</span>}
                          </div>
                          <ul className="space-y-2">
                            {features.map((feature) => (
                              <li key={feature} className="flex items-start gap-2 text-sm">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#063f4f]" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleSelectPlan}
                  disabled={submitting || !selectedPlan}
                  className="flex-1 bg-[#063f4f] hover:bg-[#052f3b]"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {selectedPlanObj?.monthly_price === 0 ? 'Activate Free Trial' : 'Continue to Payment'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#063f4f]" />
                  Complete Payment
                </CardTitle>
                <CardDescription>You'll be redirected to Paystack's secure checkout to complete your subscription.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium">{selectedPlanObj?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{email}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium">Total</span>
                    <span className="text-xl font-bold text-[#063f4f]">
                      {selectedPlanObj ? formatPrice(selectedPlanObj) : ''}
                      {selectedPlanObj?.monthly_price ? <span className="text-sm text-muted-foreground">/month</span> : null}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-medium mb-1">What happens next?</p>
                  <ol className="list-decimal list-inside space-y-1 text-amber-700">
                    <li>Click "Pay with Paystack" to redirect to secure checkout</li>
                    <li>Complete payment on Paystack's platform</li>
                    <li>You'll be redirected back to your billing dashboard</li>
                    <li>Your tenant will be provisioned automatically</li>
                  </ol>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={redirectToCheckout}
                    className="flex-1 bg-[#063f4f] hover:bg-[#052f3b]"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay with Paystack
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
