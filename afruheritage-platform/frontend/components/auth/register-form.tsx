'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { Loader2, ArrowRight, Ship, Eye, EyeOff, Github, Mail } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/hooks/useTranslation'
import { useBranding } from '@/hooks/useBranding'

export function RegisterForm() {
  const router = useRouter()
  const { t } = useTranslation()
  const { login } = useAuth()
  const { branding } = useBranding()
  const [isLoading, setIsLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
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
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
      })
      
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: 'Registration failed' }))
        if (res.status === 409) {
          throw new Error('Email already exists')
        }
        throw new Error(body.detail || 'Registration failed')
      }
      
      const data = await res.json()
      login(data.access_token, data.user)
      router.push('/dashboard')
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
              {branding?.company_name || 'Afruheritage'}
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
                  onClick={() => handleSocialRegister('github')}
                  disabled={socialLoading === 'github'}
                >
                  {socialLoading === 'github' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Github className="mr-2 h-4 w-4" />
                  )}
                  Continue with GitHub
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
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Powered by Afruheritage</p>
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
              Join thousands of businesses already using Afruheritage to streamline their logistics operations, track shipments in real-time, and grow their global reach.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
