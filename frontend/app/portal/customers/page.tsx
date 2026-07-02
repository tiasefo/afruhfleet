'use client'

import { useTenant } from '@/components/tenant-context-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'

export default function CustomersPage() {
  const tenant = useTenant()
  const companyName = tenant?.company_name || 'Afruheritage'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Customers</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{companyName} — Customer Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Manage customer accounts, KYC status, and contact information. Connect your backend to populate this view.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
