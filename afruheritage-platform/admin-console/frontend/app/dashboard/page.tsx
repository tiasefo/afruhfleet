'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { BackButton } from '@/components/back-button'
import { BillingDrawer } from '@/components/billing-drawer'
import {
  Building2,
  Truck,
  Server,
  CreditCard,
  Globe,
  Container,
  Users,
  TrendingUp,
  Settings,
} from 'lucide-react'

interface DashboardStats {
  total_users: number
  active_users: number
  total_tenants: number
  active_tenants: number
  total_vendors: number
  pending_vendors: number
  total_revenue: number
  monthly_revenue: number
  total_shipments: number
  active_shipments: number
}

interface SystemHealth {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  database_status: string
  redis_status: string
  api_status: string
  uptime: string
}

interface AlertItem {
  id: string
  type: string
  severity: string
  title: string
  message: string
  created_at: string
  is_read: boolean
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [billingDrawerOpen, setBillingDrawerOpen] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        // Load real-time dashboard data
        const [dashboardRes, healthRes, alertsRes, tenantsRes, vendorsRes] = await Promise.allSettled([
          api.get('/admin/dashboard/overview'),
          api.get('/admin/dashboard/health'),
          api.get('/admin/dashboard/alerts?limit=5'),
          api.get('/admin/tenants?page=1&page_size=5'),
          api.get('/admin/vendors?status=pending&page=1&page_size=5'),
        ])

        if (dashboardRes.status === 'fulfilled') {
          setStats(dashboardRes.value.stats)
          setAlerts(dashboardRes.value.alerts)
        }
        
        if (healthRes.status === 'fulfilled') {
          setHealth(healthRes.value)
        }

        const t = tenantsRes.status === 'fulfilled' ? tenantsRes.value : { items: [], total: 0 }
        const v = vendorsRes.status === 'fulfilled' ? vendorsRes.value : { items: [], total: 0 }

        setTenants(t.items || [])
        setVendors(v.items || [])
      } catch (error) {
        console.error('Dashboard load failed:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
    
    // Set up real-time updates
    const interval = setInterval(load, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
    <>
      <BackButton />
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
      </>
    )
  }

  const statCards = [
    { label: 'Total Users', value: stats?.total_users ?? 0, icon: Users, sub: `${stats?.active_users ?? 0} active` },
    { label: 'Total Tenants', value: stats?.total_tenants ?? 0, icon: Building2, sub: `${stats?.active_tenants ?? 0} active` },
    { label: 'Delivery Vendors', value: stats?.total_vendors ?? 0, icon: Truck, sub: `${stats?.pending_vendors ?? 0} pending` },
    { label: 'Monthly Revenue', value: `₵${(stats?.monthly_revenue ?? 0).toFixed(0)}`, icon: CreditCard, sub: `Total: ₵${(stats?.total_revenue ?? 0).toFixed(0)}` },
  ]

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Afruheritage Control Plane overview</p>
        </div>
        <Button onClick={() => setBillingDrawerOpen(true)}>
          <Settings className="mr-2 h-4 w-4" /> Billing Settings
        </Button>
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

      {/* System Health & Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Server className="h-5 w-5" /> System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {health ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">CPU Usage</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          health.cpu_usage > 80 ? 'bg-red-500' : 
                          health.cpu_usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${health.cpu_usage}%` }}
                      />
                    </div>
                    <span className="text-sm">{health.cpu_usage.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          health.memory_usage > 85 ? 'bg-red-500' : 
                          health.memory_usage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${health.memory_usage}%` }}
                      />
                    </div>
                    <span className="text-sm">{health.memory_usage.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database</span>
                  <Badge variant={health.database_status === 'healthy' ? 'default' : 'destructive'}>
                    {health.database_status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Status</span>
                  <Badge variant={health.api_status === 'healthy' ? 'default' : 'destructive'}>
                    {health.api_status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uptime</span>
                  <span className="text-sm text-muted-foreground">{health.uptime}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading health data...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" /> System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active alerts</p>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      alert.severity === 'critical' ? 'bg-red-500' :
                      alert.severity === 'high' ? 'bg-orange-500' :
                      alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{alert.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{alert.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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

      <BillingDrawer open={billingDrawerOpen} onOpenChange={setBillingDrawerOpen} />
    </div>
  )
}
