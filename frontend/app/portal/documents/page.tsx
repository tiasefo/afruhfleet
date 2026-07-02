'use client'

import { useTenant } from '@/components/tenant-context-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function DocumentsPage() {
  const tenant = useTenant()
  const companyName = tenant?.company_name || 'Afruheritage'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Documents</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{companyName} — Document Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Manage waybills, invoices, customs documents, and compliance records. Connect your backend to populate this view.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
