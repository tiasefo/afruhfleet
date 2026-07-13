'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { Loader2, ArrowRight, Eye, EyeOff, Github, Mail, Music2, Ship } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/hooks/useTranslation'
import { useBranding } from '@/hooks/useBranding'
import { useTenant } from '@/components/tenant-context-provider'
import { authApi } from '@/lib/api_updated'

const PLANS = [
  { code: 'free_trial', name: 'Free Trial (14 days)', price: '0 GHS', monthly: 'Includes basic features' },
  { code: 'professional', name: 'Starter', price: '1,000 GHS/month', monthly: 'Advanced tracking & vendors' },
  { code: 'business', name: 'Growth', price: '2,500 GHS/month', monthly: 'Custom domain & priority support' },
  { code: 'delivery_services', name: 'Enterprise', price: '6,000 GHS/month', monthly: 'Full platform + API access' },
]

export function RegisterForm() {
  const router = useRouter()
  const { t } = useTranslation()
  const { login } = useAuth()
  const { branding } = useBranding()
  const { tenant } = useTenant()
  const [isLoading, setIsLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>('professional')
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('freight')
  const [templateLoading, setTemplateLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const companyName = formData.get('company_name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full_name') as string
    const confirmPassword = formData.get('confirm_password') as string

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setIsLoading(false)
      return
    }

    try {
      const regRes = await authApi.register({
        email,
        password,
        full_name: fullName,
        company_name: companyName || fullName,
      })
      // Store portal URL before login so dashboard can show it
      const regData = (regRes as any)?.data ?? regRes
      if (regData?.portal_url) {
        localStorage.setItem('portal_url', regData.portal_url)
        localStorage.setItem('tenant_subdomain', regData.subdomain ?? '')
      }
      if (regData?.tenant_id) {
        localStorage.setItem('tenant_id', regData.tenant_id)
      }
      // If tenant was created, require subscription selection before provisioning
      if (regData?.requires_subscription) {
        setRegisteredEmail(email)
        setShowSubscriptionModal(true)
      } else {
        // Regular user registration (no tenant created)
        await login(email, password)
        router.push('/onboarding')
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialRegister = async (provider: string) => {
    setSocialLoading(provider)
    try {
      // Get OAuth URL from backend
      const res = await fetch(`/api/v1/auth/social/${provider}`)
      const data = await res.json()
      
      // Redirect to OAuth provider
      window.location.href = data.authorization_url
    } catch (err) {
      setError(`Failed to register with ${provider}`)
      setSocialLoading(null)
    }
  }

  const handleSelectSubscription = async () => {
    setSubscriptionLoading(true)
    try {
      // Get tenant_id from localStorage (set during registration)
      const tenantId = localStorage.getItem('tenant_id') || ''
      // Initialize payment for selected plan
      const selectedPlanObj = PLANS.find(p => p.code === selectedPlan)
      const res = await fetch('/api/v1/billing/payments/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          amount_major: selectedPlan === 'free_trial' ? 0 : 1000,
          email: registeredEmail,
          purpose: 'subscription',
          plan_code: selectedPlan,
          currency: 'GHS',
        }),
      })
      const paymentData = await res.json()
      
      if (paymentData.authorization_url) {
        // Redirect to Paystack checkout
        window.location.href = paymentData.authorization_url
      } else if (selectedPlan === 'free_trial') {
        // Free trial: show template picker before dashboard
        setShowSubscriptionModal(false)
        // Fetch templates
        try {
          const res = await fetch('/api/v1/storefront-templates', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`, 'Content-Type': 'application/json' }
          })
          if (res.ok) {
            const data = await res.json()
            setTemplates(data)
            if (data.length > 0) setSelectedTemplate(data[0].template_code)
          }
        } catch (e) { /* ignore */ }
        setShowTemplatePicker(true)
      }
    } catch (err: any) {
      setError('Failed to initialize payment: ' + (err.message || 'Unknown error'))
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const handleSelectTemplate = async () => {
    setTemplateLoading(true)
    try {
      await fetch('/api/v1/storefront-templates/select', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_code: selectedTemplate }),
      })
      setShowTemplatePicker(false)
      router.push('/dashboard')
    } catch (err: any) {
      setError('Failed to select template: ' + (err.message || 'Unknown error'))
    } finally {
      setTemplateLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Form */}
      <div className="flex flex-1 flex-col justify-between p-6 sm:p-8 lg:p-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-xl font-bold text-primary-foreground">
                {branding?.company_name?.[0] || 'A'}
              </span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">
              {branding?.company_name || tenant.company_name}
            </span>
          </Link>
        </div>

        {/* Form */}
        <div className="mx-auto w-full max-w-md">
          <Card className="border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="space-y-1 px-0 sm:px-6">
              <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
              <CardDescription>Get started with your freight forwarding journey</CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              {/* Social Login Buttons */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSocialRegister('google')}
                  disabled={socialLoading === 'google'}
                >
                  {socialLoading === 'google' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Continue with Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSocialRegister('instagram')}
                  disabled={socialLoading === 'instagram'}
                >
                  {socialLoading === 'instagram' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Github className="mr-2 h-4 w-4" />
                  )}
                  Continue with Instagram
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSocialRegister('tiktok')}
                  disabled={socialLoading === 'tiktok'}
                >
                  {socialLoading === 'tiktok' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Music2 className="mr-2 h-4 w-4" />
                  )}
                  Continue with TikTok
                </Button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or register with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="company_name">Company Name</FieldLabel>
                    <Input
                      id="company_name"
                      name="company_name"
                      type="text"
                      placeholder="Enter your company name"
                      required
                      autoComplete="organization"
                      className="h-11"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
                    <Input
                      id="full_name"
                      name="full_name"
                      type="text"
                      placeholder="Enter your full name"
                      required
                      autoComplete="name"
                      className="h-11"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      required
                      autoComplete="email"
                      className="h-11"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password (min 8 characters)"
                        required
                        autoComplete="new-password"
                        className="h-11 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="confirm_password">Confirm Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        name="confirm_password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        required
                        autoComplete="new-password"
                        className="h-11 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </Field>
                </FieldGroup>

                <Button
                  type="submit"
                  className="h-11 w-full gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
                <p className="text-center text-sm text-muted-foreground">
                  Need a company tenant workspace?{' '}
                  <Link href="/tenant-request" className="text-primary hover:underline">
                    Submit tenant request
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Powered by {tenant.company_name}</p>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="relative hidden flex-1 bg-primary lg:flex">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-12">
          <div className="mx-auto max-w-md text-center">
            {/* Animated Icon */}
            <div className="relative mx-auto mb-8 h-32 w-32">
              <div className="absolute inset-0 animate-pulse rounded-full bg-primary-foreground/10" />
              <div className="absolute inset-4 animate-pulse rounded-full bg-primary-foreground/10" style={{ animationDelay: '0.2s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Ship className="h-16 w-16 text-primary-foreground" />
              </div>
            </div>

            <h2 className="text-balance text-3xl font-bold tracking-tight text-primary-foreground">
              Start Your Freight Forwarding Journey
            </h2>
            <p className="mt-4 text-pretty text-primary-foreground/80">
              {`Join thousands of businesses already using ${branding?.company_name || tenant.company_name} to streamline their logistics operations, track shipments in real-time, and grow their global reach.`}
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Modal — BLOCKING: user MUST select a plan */}
      {showSubscriptionModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) e.stopPropagation() }}
        >
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Choose Your Plan</CardTitle>
              <CardDescription>
                Select a plan to complete your setup. You can upgrade or downgrade anytime.
                <span className="block text-orange-600 font-medium mt-1">Required before accessing your dashboard.</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PLANS.map((plan) => (
                  <div
                    key={plan.code}
                    onClick={() => setSelectedPlan(plan.code)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedPlan === plan.code
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        checked={selectedPlan === plan.code}
                        onChange={() => setSelectedPlan(plan.code)}
                        className="h-4 w-4"
                      />
                      <h3 className="font-semibold">{plan.name}</h3>
                    </div>
                    <p className="text-sm font-bold text-orange-600 mb-1">{plan.price}</p>
                    <p className="text-xs text-gray-600">{plan.monthly}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push('/')}
                  disabled={subscriptionLoading}
                  className="flex-1"
                >
                  Cancel Registration
                </Button>
                <Button
                  onClick={handleSelectSubscription}
                  disabled={subscriptionLoading}
                  className="flex-1 gap-2"
                >
                  {subscriptionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Template Picker Modal */}
      {showTemplatePicker && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Choose Your Storefront Template</CardTitle>
              <CardDescription>Pick a design that fits your brand. You can customize colors later.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((tmpl) => (
                  <div
                    key={tmpl.template_code}
                    onClick={() => setSelectedTemplate(tmpl.template_code)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedTemplate === tmpl.template_code
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        checked={selectedTemplate === tmpl.template_code}
                        onChange={() => setSelectedTemplate(tmpl.template_code)}
                        className="h-4 w-4"
                      />
                      <h3 className="font-semibold">{tmpl.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{tmpl.description}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: tmpl.preset?.primary_color }} />
                      <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: tmpl.preset?.accent_color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => { setShowTemplatePicker(false); router.push('/dashboard') }}
                  disabled={templateLoading}
                  className="flex-1"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleSelectTemplate}
                  disabled={templateLoading}
                  className="flex-1 gap-2"
                >
                  {templateLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      Launch Storefront
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
