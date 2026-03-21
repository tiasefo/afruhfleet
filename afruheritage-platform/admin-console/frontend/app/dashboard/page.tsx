'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import {
  Building2,
  Truck,
  Server,
  CreditCard,
  Globe,
  Container,
  Users,
  TrendingUp,
} from 'lucide-react'

interface DashboardStats {
  tenants: { total: number; active: number; pending: number }
  vendors: { total: number; pending: number; approved: number }
  runners: { total: number; online: number }
  runtimes: { total: number; running: number }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [tenants, setTenants] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [tenantsRes, vendorsRes, runnersRes] = await Promise.allSettled([
          api.get('/admin/tenants?page=1&page_size=5'),
          api.get('/admin/vendors?status=pending&page=1&page_size=5'),
          api.get('/admin/runners'),
        ])

        const t = tenantsRes.status === 'fulfilled' ? tenantsRes.value : { items: [], total: 0 }
        const v = vendorsRes.status === 'fulfilled' ? vendorsRes.value : { items: [], total: 0 }
        const r = runnersRes.status === 'fulfilled' ? runnersRes.value : { items: [], total: 0 }

        setTenants(t.items || [])
        setVendors(v.items || [])

        setStats({
          tenants: {
            total: t.total || t.items?.length || 0,
            active: (t.items || []).filter((i: any) => i.status === 'active').length,
            pending: (t.items || []).filter((i: any) => i.status === 'pending').length,
          },
          vendors: {
            total: v.total || 0,
            pending: v.total || 0,
            approved: 0,
          },
          runners: {
            total: Array.isArray(r) ? r.length : (r.items?.length || 0),
            online: Array.isArray(r) ? r.filter((n: any) => n.status === 'online').length : 0,
          },
          runtimes: { total: 0, running: 0 },
        })
      } catch {
        // Stats may partially fail — show what we have
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const statCards = [
    { label: 'Total Tenants', value: stats?.tenants.total ?? 0, icon: Building2, sub: `${stats?.tenants.pending ?? 0} pending` },
    { label: 'Delivery Vendors', value: stats?.vendors.total ?? 0, icon: Truck, sub: `${stats?.vendors.pending ?? 0} pending review` },
    { label: 'Runner Nodes', value: stats?.runners.total ?? 0, icon: Server, sub: `${stats?.runners.online ?? 0} online` },
    { label: 'Active Runtimes', value: stats?.runtimes.running ?? 0, icon: Container, sub: `${stats?.runtimes.total ?? 0} total` },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Afruheritage Control Plane overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-sm font-medium text-foreground">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.sub}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent tenants & pending vendors */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" /> Recent Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tenants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tenants yet</p>
            ) : (
              <div className="space-y-3">
                {tenants.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="font-medium">{t.company_name || t.name || t.subdomain}</div>
                      <div className="text-xs text-muted-foreground">{t.contact_email || t.email}</div>
                    </div>
                    <Badge variant={t.status === 'active' ? 'default' : 'outline'}>{t.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="h-5 w-5" /> Pending Vendor Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vendors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending applications</p>
            ) : (
              <div className="space-y-3">
                {vendors.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="font-medium">{v.full_name}</div>
                      <div className="text-xs text-muted-foreground">{v.email} &middot; {v.business_type}</div>
                    </div>
                    <Badge variant="outline" className="text-amber-600 border-amber-300">{v.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
