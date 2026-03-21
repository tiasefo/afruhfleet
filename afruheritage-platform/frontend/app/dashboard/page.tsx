'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AIChatWidget } from '@/components/ai-chat-widget'
import { useAuth } from '@/hooks/useAuth'
import { useBranding } from '@/hooks/useBranding'
import {
  Building2,
  Package,
  Users,
  CreditCard,
  Globe,
  LogOut,
  Plus,
  Ship,
  ArrowRight,
  Loader2,
  BarChart3,
  Settings,
  MapPin,
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, token, loading, logout } = useAuth()
  const { branding } = useBranding()
  const [tenants, setTenants] = useState<any[]>([])
  const [tenantsLoading, setTenantsLoading] = useState(false)

  useEffect(() => {
    if (!loading && !token) {
      router.push('/login')
    }
  }, [loading, token, router])

  useEffect(() => {
    if (user?.is_superuser && token) {
      loadTenants(token)
    }
  }, [user, token])

  const loadTenants = async (t: string) => {
    setTenantsLoading(true)
    try {
      const res = await fetch('/api/v1/tenants/?page=1&page_size=10', {
        headers: { Authorization: `Bearer ${t}` },
      })
      if (res.ok) {
        const data = await res.json()
        setTenants(data.items || [])
      }
    } catch {
      // Tenants endpoint may not exist yet
    } finally {
      setTenantsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">A</span>
            </div>
            <span className="text-lg font-semibold">Afruheritage</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            {user?.is_superuser && <Badge>Superuser</Badge>}
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back, {user?.full_name}
          </p>
        </div>

        {/* Quick actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/shipments">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Shipments</p>
                  <p className="text-sm text-muted-foreground">Manage shipments</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/shipments/new">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Create Shipment</p>
                  <p className="text-sm text-muted-foreground">New shipment</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/members">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Team Members</p>
                  <p className="text-sm text-muted-foreground">Manage team</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/billing">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Billing</p>
                  <p className="text-sm text-muted-foreground">Subscription & wallet</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Secondary Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/track">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Track Shipment</p>
                  <p className="text-sm text-muted-foreground">Public tracking</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/support">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Support</p>
                  <p className="text-sm text-muted-foreground">Get help</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                  <Settings className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Settings</p>
                  <p className="text-sm text-muted-foreground">Configure</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/vendors">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Ship className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Vendors</p>
                  <p className="text-sm text-muted-foreground">Partners</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Tenant list for superusers */}
        {user?.is_superuser && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" /> Tenants
                  </CardTitle>
                  <CardDescription>Manage platform tenants</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tenantsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : tenants.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed p-8 text-center">
                  <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-3 text-lg font-semibold">No tenants yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tenants can be created from the Admin Console at{' '}
                    <span className="font-mono text-xs">:3001</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tenants.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">{t.company_name || t.name || t.subdomain}</p>
                        <p className="text-sm text-muted-foreground">{t.contact_email || t.email}</p>
                      </div>
                      <Badge variant={t.status === 'active' ? 'default' : 'outline'}>
                        {t.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <AIChatWidget />
    </div>
  )
}
