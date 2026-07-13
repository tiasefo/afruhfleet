"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTenant } from "@/components/tenant-context-provider"

type Mode = "sign-in" | "sign-up"

export function GenericAuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const { loginWithToken } = useAuth()
  const { tenant } = useTenant()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSignUp = mode === "sign-up"
  const companyName = tenant.company_name || "Afruheritage"
  const logoUrl = tenant.logo_url || "/favicon.ico"

  const taglines: Record<string, string> = {
    freight: 'Logistics & Freight Platform',
    fleet: 'Transport & Fleet Platform',
    default: 'Logistics & Freight Platform',
  }
  const tagline = taglines[tenant.theme_code || (tenant as any).template_code] || taglines.default

  const heroHeadlines: Record<string, string> = {
    freight: 'Your goods are in trusted hands.',
    fleet: 'Your fleet, fully under control.',
    default: 'Your goods are in trusted hands.',
  }
  const heroHeadline = heroHeadlines[tenant.theme_code || (tenant as any).template_code] || heroHeadlines.default

  const heroSubtext: Record<string, string> = {
    freight: 'Track shipments, manage billing, and reach our departments — all from one secure account.',
    fleet: 'Track vehicles, manage routes, and monitor dispatch — all from one secure account.',
    default: 'Track shipments, manage billing, and reach our departments — all from one secure account.',
  }
  const heroSub = heroSubtext[tenant.theme_code || (tenant as any).template_code] || heroSubtext.default

  const signUpSubtext: Record<string, string> = {
    freight: 'Sign up to track shipments and manage your account.',
    fleet: 'Sign up to track vehicles and manage your operations.',
    default: 'Sign up to track shipments and manage your account.',
  }
  const signUpSub = signUpSubtext[tenant.theme_code || (tenant as any).template_code] || signUpSubtext.default

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (isSignUp) {
        const result = await api.post('/auth/register', {
          email,
          password,
          full_name: name,
        })
        if (result.access_token) {
          await loginWithToken(result.access_token)
          router.push("/")
        }
      } else {
        const response = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email, password }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Login failed')
        }

        const data = await response.json()
        await loginWithToken(data.access_token)
        router.push("/")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
        <Link href="/" className="relative flex items-center gap-3">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={`${companyName} logo`}
              width={48}
              height={48}
              className="rounded-full bg-white/95 p-1"
            />
          )}
          <div>
            <p className="text-lg font-bold leading-none">{companyName}</p>
            <p className="text-xs text-primary-foreground/70">
              {tagline}
            </p>
          </div>
        </Link>
        <div className="relative">
          <h2 className="text-balance text-3xl font-bold">
            {heroHeadline}
          </h2>
          <p className="mt-3 max-w-sm text-pretty text-primary-foreground/80">
            {heroSub}
          </p>
        </div>
        <p className="relative text-xs text-primary-foreground/60">
          &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt={`${companyName} logo`}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}
              <span className="font-bold text-primary">{companyName}</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-foreground">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignUp
              ? signUpSub
              : "Sign in to access tracking, billing and support."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {isSignUp ? "Create account" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : `New to ${companyName}?`}{" "}
            <Link
              href={isSignUp ? "/sign-in" : "/sign-up"}
              className="font-semibold text-primary hover:underline"
            >
              {isSignUp ? "Sign in" : "Create one"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
