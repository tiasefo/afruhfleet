'use client'

import { useTenant } from '@/components/tenant-context-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  const tenant = useTenant()
  const companyName = tenant?.company_name || 'Afruheritage'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{companyName} — Tenant Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Company Name</span>
            <span className="text-sm font-medium text-foreground">{companyName}</span>
          </div>
          {tenant?.slug && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Slug</span>
              <span className="text-sm font-medium text-foreground">{tenant.slug}</span>
            </div>
          )}
          {tenant?.default_language && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Default Language</span>
              <span className="text-sm font-medium text-foreground">{tenant.default_language}</span>
            </div>
          )}
          {tenant?.theme?.primary_color && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Primary Color</span>
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="h-4 w-4 rounded border" style={{ backgroundColor: tenant.theme.primary_color }} />
                {tenant.theme.primary_color}
              </span>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Tenant settings are managed via the platform admin. Contact your platform administrator for changes.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
