'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  Globe,
  ArrowRight,
  Ship,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type SocialProvider = {
  provider: string
  name: string
  available: boolean
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.6-2.5C16.8 2.9 14.6 2 12 2 6.9 2 2.8 6.3 2.8 11.6S6.9 21.2 12 21.2c6.1 0 9.1-4.3 9.1-6.5 0-.4 0-.8-.1-1.1H12Z" />
      <path fill="#34A853" d="M2.8 11.6c0 1.7.6 3.3 1.7 4.5l3-2.3c-.4-.7-.7-1.4-.7-2.2s.2-1.6.7-2.2l-3-2.3c-1.1 1.3-1.7 2.8-1.7 4.5Z" />
      <path fill="#FBBC05" d="M12 21.2c2.5 0 4.7-.8 6.2-2.3l-3-2.4c-.8.6-1.9 1-3.2 1-2.6 0-4.8-1.7-5.6-4.1l-3.1 2.4C4.8 18.9 8.1 21.2 12 21.2Z" />
      <path fill="#4285F4" d="M21.1 13.6c.1-.4.1-.8.1-1.2 0-.4 0-.8-.1-1.2H12v2.4h5.2c-.3 1.4-1.1 2.5-2 3.1l3 2.4c1.8-1.7 2.9-4.2 2.9-7.5Z" />
    </svg>
  )
}

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <defs>
        <linearGradient id="instagramGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F58529" />
          <stop offset="50%" stopColor="#DD2A7B" />
          <stop offset="100%" stopColor="#515BD4" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="url(#instagramGradient)" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
    </svg>
  )
}

function TikTokMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#25F4EE" d="M14.6 4.2c.6 1.6 1.6 2.8 3.2 3.5v2.7c-1.2-.1-2.3-.5-3.2-1.2v5.2a5.1 5.1 0 1 1-5.1-5.1c.3 0 .6 0 .9.1v2.8a2.3 2.3 0 1 0 1.4 2.2V2.8h2.8v1.4Z" />
      <path fill="#FE2C55" d="M13.5 3c.6 1.6 1.6 2.8 3.2 3.5v1.9a5.7 5.7 0 0 1-3.2-1V13a4 4 0 1 1-4-4c.2 0 .4 0 .6.1v2c-.2 0-.4-.1-.6-.1a2 2 0 1 0 2 2V1.6h2v1.3Z" />
      <path fill="#111111" d="M13.9 2.8c.6 1.6 1.6 2.8 3.2 3.5v1.3a6 6 0 0 1-3.2-1v6a4.4 4.4 0 1 1-4.4-4.4v1.6a2.8 2.8 0 1 0 2.8 2.8V2.8h1.6Z" />
    </svg>
  )
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 1-2 2v2.2h3.4l-.6 3.5h-2.8v8.4A12 12 0 0 0 24 12Z"
      />
      <path
        fill="#fff"
        d="M16.6 15.5l.6-3.5h-3.4V9.8c0-1 .5-2 2-2h1.5v-3s-1.4-.2-2.7-.2c-2.7 0-4.5 1.7-4.5 4.7V12H7v3.5h3.1v8.4c.6.1 1.2.1 1.9.1s1.3 0 1.9-.1v-8.4h2.7Z"
      />
    </svg>
  )
}

function ProviderIcon({ provider }: { provider: string }) {
  switch (provider) {
    case 'google':
      return <GoogleMark />
    case 'instagram':
      return <InstagramMark />
    case 'facebook':
      return <FacebookMark />
    case 'tiktok':
      return <TikTokMark />
    default:
      return <div className="h-4 w-4 rounded-full bg-current" />
  }
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedPlan = searchParams.get('plan')
  const resetToken = searchParams.get('reset_token') || ''
  const isResetMode = resetToken.length > 0
  const [isLoading, setIsLoading] = useState(false)
  const [isSocialLoading, setIsSocialLoading] = useState(true)
  const [isSocialCallbackLoading, setIsSocialCallbackLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [socialProviders, setSocialProviders] = useState<SocialProvider[]>([])
  const [language, setLanguage] = useState<'en' | 'zh'>('en')
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL

  const finalizeLogin = async (accessToken: string, fallbackEmail: string) => {
    const meResponse = await fetch(`${apiBaseUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const profile = meResponse.ok ? await meResponse.json() : null
    const role = profile?.is_superuser || profile?.is_tenant_admin ? 'admin' : 'customer'

    document.cookie = `afruheritage_access_token=${encodeURIComponent(accessToken)}; path=/; SameSite=Lax`
    document.cookie = `afruheritage_user=${encodeURIComponent(JSON.stringify({
      id: profile?.id || fallbackEmail,
      email: profile?.email || fallbackEmail,
      fullName: profile?.full_name || fallbackEmail,
      role,
      tenantId: profile?.tenant_id || null,
    }))}; path=/; SameSite=Lax`

    router.push(role === 'admin' ? '/admin' : '/customer')
    router.refresh()
  }

  useEffect(() => {
    let isMounted = true

    const loadProviders = async () => {
      if (!apiBaseUrl) {
        if (isMounted) {
          setError('API base URL is not configured for this environment.')
          setIsSocialLoading(false)
        }
        return
      }

      try {
        const response = await fetch(`${apiBaseUrl}/auth/social/providers`, {
          cache: 'no-store',
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error('Failed to load providers')
        }

        if (isMounted) {
          setSocialProviders(Array.isArray(data.providers) ? data.providers : [])
        }
      } catch {
        if (isMounted) {
          setSocialProviders([])
        }
      } finally {
        if (isMounted) {
          setIsSocialLoading(false)
        }
      }
    }

    loadProviders()

    return () => {
      isMounted = false
    }
  }, [apiBaseUrl])

  useEffect(() => {
    const socialToken = searchParams.get('social_token')
    const provider = searchParams.get('provider')

    if (!socialToken || !provider || !apiBaseUrl || isResetMode) {
      return
    }

    let isMounted = true

    const completeSocialLogin = async () => {
      setIsSocialCallbackLoading(true)
      setError('')

      try {
        await finalizeLogin(socialToken, `${provider}@afruheritage.social`)
      } catch {
        if (isMounted) {
          setError('Social sign in completed at the provider, but Afruheritage could not finish the session locally.')
          setIsSocialCallbackLoading(false)
        }
      }
    }

    completeSocialLogin()

    return () => {
      isMounted = false
    }
  }, [apiBaseUrl, isResetMode, router, searchParams])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = String(formData.get('email') || '').trim().toLowerCase()
    const password = String(formData.get('password') || '')
    const confirmPassword = String(formData.get('confirm_password') || '')

    if (!apiBaseUrl) {
      setError('API base URL is not configured for this environment.')
      setIsLoading(false)
      return
    }

    try {
      if (isResetMode) {
        if (password.length < 8) {
          setError('Password must be at least 8 characters long.')
          return
        }

        if (password !== confirmPassword) {
          setError('Passwords do not match.')
          return
        }

        const resetResponse = await fetch(`${apiBaseUrl}/auth/password-reset/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: resetToken,
            new_password: password,
          }),
        })
        const resetData = await resetResponse.json()
        if (!resetResponse.ok) {
          setError(typeof resetData.detail === 'string' ? resetData.detail : 'Password setup failed. Please request a new reset link.')
          return
        }
        setSuccess('Password set successfully. You can now sign in with your email and new password.')
        router.replace('/login')
        return
      }

      const loginResponse = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const loginData = await loginResponse.json()

      if (!loginResponse.ok) {
        setError(typeof loginData.detail === 'string' ? loginData.detail : 'Sign in failed. Please check your credentials.')
        return
      }

      await finalizeLogin(loginData.access_token, email)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = (provider: string) => {
    if (!apiBaseUrl) {
      setError('API base URL is not configured for this environment.')
      return
    }

    window.location.href = `${apiBaseUrl}/auth/social/${provider}/login`
  }

  const content = {
    en: {
      title: 'Welcome back',
      subtitle: isResetMode ? 'Set your password to activate your account' : 'Sign in to your account to continue',
      email: 'Email Address',
      emailPlaceholder: 'you@example.com',
      password: 'Password',
      passwordPlaceholder: 'Enter your password',
      confirmPassword: 'Confirm Password',
      confirmPasswordPlaceholder: 'Re-enter your password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      signIn: isResetMode ? 'Set Password' : 'Sign In',
      signingIn: isResetMode ? 'Saving password...' : 'Signing in...',
      socialDivider: 'Or continue with',
      socialLoading: 'Loading social sign-in options...',
      socialCompleting: 'Completing social sign-in...',
      noSocialProviders: 'Social sign-in providers are not available yet.',
      noAccount: "Don't have an account?",
      getStarted: 'Get Started',
      poweredBy: 'Powered by Afruheritage',
    },
    zh: {
      title: '欢迎回来',
      subtitle: isResetMode ? '设置您的密码以激活账户' : '登录您的账户以继续',
      email: '邮箱地址',
      emailPlaceholder: 'you@example.com',
      password: '密码',
      passwordPlaceholder: '输入您的密码',
      confirmPassword: '确认密码',
      confirmPasswordPlaceholder: '请再次输入密码',
      rememberMe: '记住我',
      forgotPassword: '忘记密码？',
      signIn: isResetMode ? '设置密码' : '登录',
      signingIn: isResetMode ? '正在保存密码...' : '登录中...',
      socialDivider: '或使用以下方式继续',
      socialLoading: '正在加载社交登录选项...',
      socialCompleting: '正在完成社交登录...',
      noSocialProviders: '社交登录暂时不可用。',
      noAccount: '还没有账户？',
      getStarted: '立即注册',
      poweredBy: '由 Afruheritage 提供支持',
    },
  }

  const t = content[language]

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Form */}
      <div className="flex flex-1 flex-col justify-between p-6 sm:p-8 lg:p-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-xl font-bold text-primary-foreground">A</span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">
              Afruheritage
            </span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Globe className="h-4 w-4" />
                {language === 'en' ? 'EN' : '中文'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('en')}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('zh')}>
                中文
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Form */}
        <div className="mx-auto w-full max-w-md">
          <Card className="border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="space-y-1 px-0 sm:px-6">
              <CardTitle className="text-2xl font-bold">{t.title}</CardTitle>
              <CardDescription>{t.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    {success}
                  </div>
                )}

                {isSocialCallbackLoading && !isResetMode && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    {t.socialCompleting}
                  </div>
                )}

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">{t.email}</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={t.emailPlaceholder}
                      required={!isResetMode}
                      disabled={isResetMode}
                      autoComplete="email"
                      className="h-11"
                    />
                  </Field>

                  <Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="password">{t.password}</FieldLabel>
                      <Link
                        href="#"
                        className="text-sm text-primary hover:underline"
                      >
                        {t.forgotPassword}
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t.passwordPlaceholder}
                        required
                        autoComplete={isResetMode ? 'new-password' : 'current-password'}
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

                  {isResetMode && (
                    <Field>
                      <FieldLabel htmlFor="confirm_password">{t.confirmPassword}</FieldLabel>
                      <div className="relative">
                        <Input
                          id="confirm_password"
                          name="confirm_password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder={t.confirmPasswordPlaceholder}
                          required
                          autoComplete="new-password"
                          className="h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </Field>
                  )}
                </FieldGroup>

                {!isResetMode && <div className="flex items-center gap-2">
                  <Checkbox id="remember" />
                  <label
                    htmlFor="remember"
                    className="text-sm text-muted-foreground"
                  >
                    {t.rememberMe}
                  </label>
                </div>}

                <Button
                  type="submit"
                  className="h-11 w-full gap-2"
                  disabled={isLoading || isSocialCallbackLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.signingIn}
                    </>
                  ) : (
                    <>
                      {t.signIn}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                {!isResetMode && <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-3 text-muted-foreground">
                        {t.socialDivider}
                      </span>
                    </div>
                  </div>

                  {isSocialLoading ? (
                    <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.socialLoading}
                    </div>
                  ) : socialProviders.some((provider) => provider.available) ? (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {socialProviders.filter((provider) => provider.available).map((provider) => (
                        <Button
                          key={provider.provider}
                          type="button"
                          variant="outline"
                          className="h-11 gap-2"
                          onClick={() => handleSocialLogin(provider.provider)}
                          disabled={isLoading || isSocialCallbackLoading}
                        >
                          <ProviderIcon provider={provider.provider} />
                          <span>{provider.name}</span>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                      <AlertCircle className="h-4 w-4" />
                      {t.noSocialProviders}
                    </div>
                  )}
                </div>}

                {!isResetMode && <p className="text-center text-sm text-muted-foreground">
                  {t.noAccount}{' '}
                  <Link href={selectedPlan ? `/register?plan=${encodeURIComponent(selectedPlan)}` : '/register'} className="text-primary hover:underline">
                    {t.getStarted}
                  </Link>
                </p>}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{t.poweredBy}</p>
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
              Manage Your Freight Operations with Confidence
            </h2>
            <p className="mt-4 text-pretty text-primary-foreground/80">
              Track shipments, manage customs clearance, and scale your business with AI-powered logistics.
            </p>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-primary-foreground/10 bg-primary-foreground/5 p-4">
                <div className="text-2xl font-bold text-primary-foreground">500+</div>
                <div className="text-sm text-primary-foreground/60">Active Users</div>
              </div>
              <div className="rounded-lg border border-primary-foreground/10 bg-primary-foreground/5 p-4">
                <div className="text-2xl font-bold text-primary-foreground">45+</div>
                <div className="text-sm text-primary-foreground/60">Countries</div>
              </div>
              <div className="rounded-lg border border-primary-foreground/10 bg-primary-foreground/5 p-4">
                <div className="text-2xl font-bold text-primary-foreground">24/7</div>
                <div className="text-sm text-primary-foreground/60">AI Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
