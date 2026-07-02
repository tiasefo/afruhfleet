'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Palette, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage theme templates, page layouts, and branding presets available to tenants.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Template Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No templates to display. Create theme presets and page layout templates here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
