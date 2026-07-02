'use client'

import { useTenant } from '@/components/tenant-context-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Warehouse } from 'lucide-react'

export default function WarehousePage() {
  const tenant = useTenant()
  const companyName = tenant?.company_name || 'Afruheritage'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Warehouse className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Warehouse</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{companyName} — Warehouse Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Manage inventory, receiving, and dispatch operations. Connect your backend to populate this view.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
