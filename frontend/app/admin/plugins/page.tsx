'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plug, Loader2, ShieldCheck, Check, X, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getAuthToken } from '@/lib/auth'

interface GlobalPlugin {
  plugin_code: string
  name: string
  version: string
  description: string | null
  category: string | null
  is_active: boolean
  capabilities: string[]
  permissions: string[]
  feature_flags: string[]
  dependencies: string[]
  conflicts: string[]
}

export default function AdminPluginsPage() {
  const [plugins, setPlugins] = useState<GlobalPlugin[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadPlugins()
  }, [])

  const loadPlugins = async () => {
    setLoading(true)
    setError('')
    try {
      const token = getAuthToken()
      const res = await fetch('/api/v1/plugins/catalog', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        // Transform catalog format to global plugin format
        const transformed: GlobalPlugin[] = data.map((p: any) => ({
          plugin_code: p.name,
          name: p.feature_name || p.name,
          version: '1.0.0',
          description: p.description,
          category: p.feature_flags?.[0] || 'general',
          is_active: true,
          capabilities: [],
          permissions: [],
          feature_flags: p.feature_flags || [],
          dependencies: [],
          conflicts: [],
        }))
        setPlugins(transformed)
      } else {
        setError('Failed to load plugin catalog.')
      }
    } catch (err) {
      setError('Network error loading plugins.')
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

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plugins.map((plugin) => (
          <Card key={plugin.plugin_code}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Plug className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{plugin.name}</CardTitle>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {plugin.plugin_code} v{plugin.version}
                    </p>
                  </div>
                </div>
                <Badge variant={plugin.is_active ? 'default' : 'outline'} className="gap-1">
                  {plugin.is_active ? (
                    <><Check className="h-3 w-3" /> Published</>
                  ) : (
                    <><X className="h-3 w-3" /> Retired</>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {plugin.description || 'No description available.'}
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

              {plugin.category && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Category:</span> {plugin.category}
                </div>
              )}

              {plugin.dependencies && plugin.dependencies.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Dependencies:</span> {plugin.dependencies.join(', ')}
                </div>
              )}

              {plugin.conflicts && plugin.conflicts.length > 0 && (
                <div className="text-xs text-amber-600">
                  <span className="font-medium">Conflicts:</span> {plugin.conflicts.join(', ')}
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
