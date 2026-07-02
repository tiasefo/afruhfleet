
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, CreditCard, Users, Store } from 'lucide-react'

export default function AdminDashboardPage() {
  const stats = [
    { label: 'Total Tenants', value: '—', icon: Building2 },
    { label: 'Active Subscriptions', value: '—', icon: CreditCard },
    { label: 'Total Users', value: '—', icon: Users },
    { label: 'Marketplace Items', value: '—', icon: Store },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platform Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of all tenants, subscriptions, and platform activity.
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
                <Icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AnalyticsDashboard />
    </div>
  )
}
