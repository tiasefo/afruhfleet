'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plug, Loader2, ShieldCheck, Check, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { pluginsAPI } from '@/lib/api'

interface GlobalPlugin {
  name: string
  feature_name: string
  description: string
  required_endpoints: string[]
  feature_flags: string[]
}

export default function AdminPluginsPage() {
  const [plugins, setPlugins] = useState<GlobalPlugin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPlugins()
  }, [])

  const loadPlugins = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await pluginsAPI.listCatalog()
      setPlugins(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load plugin catalog.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Global Plugin Catalog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the global plugin catalog. These plugins are available to all tenants for installation.
          </p>
        </div>
        <Link href="/admin/templates">
          <Button variant="outline" size="sm">
            Templates
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4" />
        You are signed in as a Platform Super Admin. You can publish, version, and retire plugins globally.
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plugins.map((plugin) => (
          <Card key={plugin.name}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Plug className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{plugin.feature_name}</CardTitle>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{plugin.name}</p>
                  </div>
                </div>
                <Badge variant="default" className="gap-1">
                  <Check className="h-3 w-3" />
                  Published
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {plugin.description}
              </p>

              {plugin.feature_flags && plugin.feature_flags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {plugin.feature_flags.map((flag) => (
                    <Badge key={flag} variant="outline" className="text-xs">
                      {flag}
                    </Badge>
                  ))}
                </div>
              )}

              {plugin.required_endpoints && plugin.required_endpoints.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Requires:</span> {plugin.required_endpoints.length} endpoint(s)
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Badge variant="secondary" className="text-xs">
                  <Package className="h-3 w-3 mr-1" />
                  Global
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plugins.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plug className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No plugins in the global catalog.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
