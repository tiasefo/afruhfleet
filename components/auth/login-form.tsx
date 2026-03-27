'use client'

import { useState } from 'react'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  Ship
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [language, setLanguage] = useState<'en' | 'zh'>('en')

  const [role, setRole] = useState<'admin' | 'customer'>('customer')
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Simulate login API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Set a cookie for demo (replace with real auth in production)
    document.cookie = `afruheritage_user=${JSON.stringify({id:'demo',email:'demo@afruheritage.com',fullName:'Demo User',role})}; path=/`;

    // Redirect based on role
    if (role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/customer')
    }
  }

  const content = {
    en: {
      title: 'Welcome back',
      subtitle: 'Sign in to your account to continue',
      email: 'Email Address',
      emailPlaceholder: 'you@example.com',
      password: 'Password',
      passwordPlaceholder: 'Enter your password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      signIn: 'Sign In',
      signingIn: 'Signing in...',
      noAccount: "Don't have an account?",
      getStarted: 'Get Started',
      poweredBy: 'Powered by Afruheritage',
    },
    zh: {
      title: '欢迎回来',
      subtitle: '登录您的账户以继续',
      email: '邮箱地址',
      emailPlaceholder: 'you@example.com',
      password: '密码',
      passwordPlaceholder: '输入您的密码',
      rememberMe: '记住我',
      forgotPassword: '忘记密码？',
      signIn: '登录',
      signingIn: '登录中...',
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

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">{t.email}</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t.emailPlaceholder}
                      required
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
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t.passwordPlaceholder}
                        required
                        autoComplete="current-password"
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

                <div className="flex items-center gap-2">
                  <Checkbox id="remember" />
                  <label
                    htmlFor="remember"
                    className="text-sm text-muted-foreground"
                  >
                    {t.rememberMe}
                  </label>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Sign in as:</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1">
                      <input type="radio" name="role" value="customer" checked={role==='customer'} onChange={()=>setRole('customer')} /> Customer
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="radio" name="role" value="admin" checked={role==='admin'} onChange={()=>setRole('admin')} /> Admin
                    </label>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="h-11 w-full gap-2"
                  disabled={isLoading}
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

                <p className="text-center text-sm text-muted-foreground">
                  {t.noAccount}{' '}
                  <Link href="#" className="text-primary hover:underline">
                    {t.getStarted}
                  </Link>
                </p>
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
