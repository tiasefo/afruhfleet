'use client'

import { useTenant } from '@/components/tenant-context-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ShoppingCart, Users, Truck } from 'lucide-react'

export default function PortalDashboardPage() {
  const tenant = useTenant()
  const companyName = tenant?.company_name || 'Afruheritage'

  const stats = [
    { label: 'Active Shipments', value: '—', icon: Package, color: 'text-primary' },
    { label: 'Pending Orders', value: '—', icon: ShoppingCart, color: 'text-accent' },
    { label: 'Customers', value: '—', icon: Users, color: 'text-chart-3' },
    { label: 'Fleet Vehicles', value: '—', icon: Truck, color: 'text-chart-4' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome to {companyName} portal. Overview of your operations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No recent activity to display. Connect your backend to populate this dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
