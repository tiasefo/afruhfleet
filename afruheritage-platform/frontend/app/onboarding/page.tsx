'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { authApi } from '@/lib/api_updated'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  Truck,
  Building2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  User,
} from 'lucide-react'

type Role = 'personal_shipper' | 'delivery_driver' | 'company_admin'

const ROLES = [
  {
    id: 'personal_shipper' as Role,
    icon: Package,
    title: 'Personal Shipper',
    description: 'I want to send packages and track deliveries. Free tier included.',
    badge: 'Free',
    badgeVariant: 'secondary' as const,
  },
  {
    id: 'delivery_driver' as Role,
    icon: Truck,
    title: 'Delivery Driver',
    description: 'I pick up and deliver shipments. KYC verification required.',
    badge: 'KYC Required',
    badgeVariant: 'outline' as const,
  },
  {
    id: 'company_admin' as Role,
    icon: Building2,
    title: 'Freight Company',
    description: 'I run a freight forwarding business and need full fleet management.',
    badge: 'Subscription',
    badgeVariant: 'default' as const,
  },
]

const STEPS = ['Welcome', 'Your Role', 'Profile', 'Done']

export default function OnboardingPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, refreshUser } = useAuth()
  const [step, setStep] = useState(0)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [fullName, setFullName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
    if (!isLoading && user?.onboarding_complete) {
      router.replace('/dashboard')
    }
    if (user?.full_name) {
      setFullName(user.full_name)
    }
  }, [isLoading, isAuthenticated, user, router])

  const handleComplete = async () => {
    if (!selectedRole) return
    setSubmitting(true)
    setError('')
    try {
      await authApi.completeOnboarding({
        role: selectedRole,
        full_name: fullName.trim() || undefined,
      })
      await refreshUser()
      if (selectedRole === 'delivery_driver') {
        router.push('/kyc')
      } else if (selectedRole === 'company_admin') {
        router.push('/pricing')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="border-b px-6 py-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">A</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">Afruheritage</span>
        </Link>
      </header>

      {/* Progress steps */}
      <div className="border-b bg-muted/30 px-6 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  i < step
                    ? 'bg-primary text-primary-foreground'
                    : i === step
                    ? 'bg-primary/90 text-primary-foreground ring-2 ring-primary ring-offset-2'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`hidden sm:block text-sm ${
                  i === step ? 'font-semibold text-foreground' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-8 ${i < step ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-2xl">

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Welcome to Afruheritage</h1>
                <p className="text-muted-foreground text-lg">
                  Let's get you set up in just a couple of steps.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 text-left">
                {ROLES.map((role) => {
                  const Icon = role.icon
                  return (
                    <div key={role.id} className="rounded-lg border bg-card p-4 space-y-2">
                      <Icon className="h-6 w-6 text-primary" />
                      <p className="font-semibold">{role.title}</p>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  )
                })}
              </div>
              <Button size="lg" onClick={() => setStep(1)} className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 1: Role selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">What brings you to Afruheritage?</h2>
                <p className="text-muted-foreground">Choose the option that best describes you.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {ROLES.map((role) => {
                  const Icon = role.icon
                  const selected = selectedRole === role.id
                  return (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`rounded-xl border-2 p-5 text-left transition-all hover:border-primary hover:shadow-md ${
                        selected ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Icon className={`h-6 w-6 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <Badge variant={role.badgeVariant}>{role.badge}</Badge>
                      </div>
                      <p className="font-semibold mb-1">{role.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{role.description}</p>
                    </button>
                  )
                })}
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(0)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button disabled={!selectedRole} onClick={() => setStep(2)} className="gap-2">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Profile */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Complete your profile</h2>
                <p className="text-muted-foreground">Confirm how you'd like to appear on the platform.</p>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-5 w-5 text-primary" /> Your Details
                  </CardTitle>
                  <CardDescription>
                    Signed in as <span className="font-medium text-foreground">{user?.email}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Kwame Mensah"
                    />
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4 flex items-center gap-3">
                    {selectedRole === 'personal_shipper' && (
                      <>
                        <Package className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Personal Shipper — Free Tier</p>
                          <p className="text-xs text-muted-foreground">
                            Send packages, track shipments, bid with drivers. No subscription needed.
                          </p>
                        </div>
                      </>
                    )}
                    {selectedRole === 'delivery_driver' && (
                      <>
                        <Truck className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Delivery Driver — KYC Required</p>
                          <p className="text-xs text-muted-foreground">
                            After completing your profile, you'll be guided through identity verification.
                          </p>
                        </div>
                      </>
                    )}
                    {selectedRole === 'company_admin' && (
                      <>
                        <Building2 className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Freight Company — Choose a Plan</p>
                          <p className="text-xs text-muted-foreground">
                            After completing your profile, you'll select a subscription plan.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  {error && (
                    <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{error}</p>
                  )}
                </CardContent>
              </Card>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button disabled={!fullName.trim() || submitting} onClick={handleComplete} className="gap-2">
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    <>Finish Setup <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function OnboardingPage() {
  const [catalog, setCatalog] = React.useState<any>(null)
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [planCode, setPlanCode] = React.useState('business')
  const [addons, setAddons] = React.useState<string[]>(['marketplace', 'gps_tracking'])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [checkoutUrl, setCheckoutUrl] = React.useState('')

  React.useEffect(() => {
    commercialApi.catalog()
      .then((res: any) => setCatalog(res.data ?? res))
      .catch((err: any) => setError(err?.message || 'Could not load catalog'))
  }, [])

  const toggleAddon = (code: string) => {
    setAddons((current) =>
      current.includes(code)
        ? current.filter((x) => x !== code)
        : [...current, code]
    )
  }

  const startCheckout = async () => {
    setLoading(true)
    setError('')
    setCheckoutUrl('')

    try {
      const signupRes: any = await commercialApi.startSignup({
        email,
        phone,
        account_type: 'tenant_org',
      })

      const signup = signupRes.data ?? signupRes
      const signupId = signup.signup_id

      const planRes: any = await commercialApi.selectPlan({
        signup_id: signupId,
        plan_code: planCode,
        addons,
        payment_method: 'paystack',
        callback_url: `${window.location.origin}/billing/callback`,
      })

      const result = planRes.data ?? planRes

      if (result.checkout_url) {
        setCheckoutUrl(result.checkout_url)
        window.location.href = result.checkout_url
      } else {
        setError('Checkout URL was not returned.')
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-bold">Start Afruheritage SaaS Subscription</h1>
      <p className="mt-2 text-gray-600">
        Create your organization, select a plan, choose add-ons, and continue to Paystack checkout.
      </p>

      {error && (
        <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
          {String(error)}
        </div>
      )}

      <section className="mt-6 grid gap-4 rounded border p-4">
        <input
          className="rounded border p-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="rounded border p-3"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <div>
          <h2 className="font-semibold">Choose Plan</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {(catalog?.plans || []).map((plan: any) => (
              <button
                key={plan.code}
                onClick={() => setPlanCode(plan.code)}
                className={`rounded border p-4 text-left ${
                  planCode === plan.code ? 'border-blue-600 bg-blue-50' : ''
                }`}
              >
                <div className="font-bold">{plan.name}</div>
                <div>GHS {plan.monthly_price}/month</div>
                <div className="text-sm text-gray-600">{plan.credits} credits</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-semibold">Choose Add-ons</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {(catalog?.addons || []).map((addon: any) => (
              <button
                key={addon.code}
                onClick={() => toggleAddon(addon.code)}
                className={`rounded border p-4 text-left ${
                  addons.includes(addon.code) ? 'border-green-600 bg-green-50' : ''
                }`}
              >
                <div className="font-bold">{addon.name}</div>
                <div>GHS {addon.monthly_price}/month</div>
                {addon.info && <div className="text-sm text-gray-600">{addon.info}</div>}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={loading || !email}
          onClick={startCheckout}
          className="rounded bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Preparing Checkout...' : 'Continue to Paystack Checkout'}
        </button>

        {checkoutUrl && (
          <a className="text-blue-600 underline" href={checkoutUrl}>
            Open checkout
          </a>
        )}
      </section>
    </main>
  )
}
