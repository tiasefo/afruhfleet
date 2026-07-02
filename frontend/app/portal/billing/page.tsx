'use client'

import { useTenant } from '@/components/tenant-context-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'

export default function BillingPage() {
  const tenant = useTenant()
  const companyName = tenant?.company_name || 'Afruheritage'
  const tier = tenant?.subscription?.plan_code || 'Free'
  const status = tenant?.subscription?.status || 'active'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Billing</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{companyName} — Subscription & Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Plan</span>
            <span className="text-sm font-medium text-foreground">{tier}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className="text-sm font-medium text-foreground">{status}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your subscription, invoices, and payment methods. Connect your billing provider to populate this view.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
