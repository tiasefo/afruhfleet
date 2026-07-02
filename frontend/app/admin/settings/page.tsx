'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe } from 'lucide-react'

export default function GlobalSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Global Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform-wide configuration, feature flags, and default settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Platform Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Platform Name</span>
            <span className="text-sm font-medium text-foreground">Afruheritage</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Default Language</span>
            <span className="text-sm font-medium text-foreground">en</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Supported Languages</span>
            <span className="text-sm font-medium text-foreground">en, zh</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Global settings are managed via environment variables and backend configuration.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
