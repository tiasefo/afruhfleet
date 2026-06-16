'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useBranding } from '@/hooks/useBranding'
import { tenantApi } from '@/lib/api_updated'
import {
  Building2,
  Package,
  Users,
  CreditCard,
  Globe,
  Plus,
  Ship,
  ArrowRight,
  Loader2,
  BarChart3,
  Settings,
  MapPin,
  X,
} from 'lucide-react'

/** Reads ?welcome=1 and returns the portal URL stored in localStorage. */
function WelcomeReader({ onPortal }: { onPortal: (v: { portalUrl: string; subdomain: string } | null) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams?.get('welcome') === '1') {
      const portalUrl = localStorage.getItem('portal_url') ?? ''
      const subdomain = localStorage.getItem('tenant_subdomain') ?? ''
      if (portalUrl) onPortal({ portalUrl, subdomain })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  return null
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, token, isLoading, logout } = useAuth()
  const { branding } = useBranding()
  const [tenants, setTenants] = useState<any[]>([])
  const [tenantsLoading, setTenantsLoading] = useState(false)
  const [welcomeBanner, setWelcomeBanner] = useState<{ portalUrl: string; subdomain: string } | null>(null)

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login')
    }
  }, [isLoading, token, router])

  useEffect(() => {
    if (user?.is_superuser && token) {
      loadTenants()
    }
  }, [user, token])

  const loadTenants = async () => {
    setTenantsLoading(true)
    try {
      const data = await tenantApi.getAll({ page: 1, page_size: 10 })
      setTenants(data.items || [])
    } catch (error) {
      console.error('Failed to load tenants:', error)
    } finally {
      setTenantsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (isLoading) {
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
    <>
      {/* Reads ?welcome=1 query param safely (requires Suspense for SSR) */}
      <Suspense fallback={null}>
        <WelcomeReader onPortal={setWelcomeBanner} />
      </Suspense>
      {/* Top nav removed - AppShell sidebar handles navigation */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Welcome Banner — shown once after registration */}
        {welcomeBanner && (
          <div className="mb-6 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1">🎉 Your company portal is ready!</h2>
                <p className="text-orange-100 text-sm mb-3">
                  Share this URL with your team and customers. Each company on AfruHeritage gets its own branded portal.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={welcomeBanner.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-orange-600 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    {welcomeBanner.portalUrl}
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(welcomeBanner.portalUrl)
                    }}
                    className="text-orange-100 text-sm underline hover:text-white"
                  >
                    Copy link
                  </button>
                </div>
              </div>
              <button
                onClick={() => setWelcomeBanner(null)}
                className="p-1 hover:bg-orange-400 rounded transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back, {user?.full_name}
          </p>
        </div>

        {/* Quick actions — role-aware */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Personal Shipper cards */}
          {(user?.role === 'personal_shipper' || user?.is_superuser || !user?.role) && (
            <>
              <Link href="/shipments">
                <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold">My Shipments</p>
                      <p className="text-sm text-muted-foreground">Track & manage</p>
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
                      <p className="text-sm text-muted-foreground">Send a package</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/track">
                <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold">Track Package</p>
                      <p className="text-sm text-muted-foreground">Real-time tracking</p>
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
            </>
          )}

          {/* Delivery Driver cards */}
          {user?.role === 'delivery_driver' && (
            <>
              <Link href="/vendors">
                <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <Ship className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold">Available Jobs</p>
                      <p className="text-sm text-muted-foreground">Browse shipments</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/shipments">
                <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold">My Bids</p>
                      <p className="text-sm text-muted-foreground">Active bids</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/kyc">
                <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
                      <Globe className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold">KYC Status</p>
                      <p className="text-sm text-muted-foreground">Verification</p>
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
            </>
          )}

          {/* Company Admin cards */}
          {user?.role === 'company_admin' && (
            <>
              <Link href="/shipments">
                <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold">Shipments</p>
                      <p className="text-sm text-muted-foreground">Manage all</p>
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
                      <p className="font-semibold">New Shipment</p>
                      <p className="text-sm text-muted-foreground">Create booking</p>
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
                      <p className="text-sm text-muted-foreground">Subscription</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </>
          )}
        </div>

        {/* Secondary actions (all roles) */}
        {user?.role !== 'delivery_driver' && (
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
        )}

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
                  <div className="mt-4 flex justify-center gap-3">
                    <Button asChild>
                      <a href="/admin/runtime">Create Tenant Instance</a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="/admin/runtime">Open Admin Console</a>
                    </Button>
                  </div>
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

    </>
  )
}
