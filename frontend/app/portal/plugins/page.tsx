'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plug, Check, Loader2, Power, PowerOff, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { getAuthToken } from '@/lib/auth'
import { getCurrentUser, isPlatformAdmin } from '@/lib/auth'

interface PluginCatalogItem {
  name: string
  feature_name: string
  description: string
  required_endpoints: string[]
  feature_flags: string[]
  installed: boolean
  status?: string
}

interface InstalledPlugin {
  plugin_code: string
  status: string
  installed_at: string
  enabled: boolean
}

export default function PortalPluginsPage() {
  const [plugins, setPlugins] = useState<PluginCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [uninstalling, setUninstalling] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showConsent, setShowConsent] = useState<string | null>(null)

  const user = getCurrentUser()
  const canPublishGlobally = isPlatformAdmin(user)

  useEffect(() => {
    loadPlugins()
  }, [])

  const loadPlugins = async () => {
    setLoading(true)
    setError('')
    try {
      const token = getAuthToken()
      const res = await fetch('/api/v1/plugins/installed', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPlugins(data)
      } else if (res.status === 403) {
        setError('Only tenant admins can manage plugins.')
      } else {
        setError('Failed to load plugins.')
      }
    } catch (err) {
      setError('Network error loading plugins.')
    } finally {
      setLoading(false)
    }
  }

  const installPlugin = async (pluginName: string) => {
    setInstalling(pluginName)
    setError('')
    setSuccess('')
    try {
      const token = getAuthToken()
      const res = await fetch('/api/v1/plugins/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plugin_name: pluginName,
          consent_ui_change: true,
          consent_business_type_change: true,
          consent_data_impact: true,
          acknowledged_risks: ['ui_change', 'business_type_change', 'data_impact'],
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setSuccess(`Installed ${data.feature_name}. ${data.message || ''}`)
        loadPlugins()
      } else {
        const errData = await res.json().catch(() => ({}))
        setError(errData.detail || 'Failed to install plugin.')
      }
    } catch (err) {
      setError('Network error installing plugin.')
    } finally {
      setInstalling(null)
      setShowConsent(null)
    }
  }

  const togglePlugin = async (pluginName: string, currentlyEnabled: boolean) => {
    setToggling(pluginName)
    setError('')
    setSuccess('')
    try {
      const token = getAuthToken()
      const endpoint = currentlyEnabled
        ? `/api/v1/plugins/${pluginName}/disable`
        : `/api/v1/plugins/${pluginName}/enable`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setSuccess(`${currentlyEnabled ? 'Disabled' : 'Enabled'} ${pluginName}.`)
        loadPlugins()
      } else {
        const errData = await res.json().catch(() => ({}))
        setError(errData.detail || `Failed to ${currentlyEnabled ? 'disable' : 'enable'} plugin.`)
      }
    } catch (err) {
      setError('Network error toggling plugin.')
    } finally {
      setToggling(null)
    }
  }

  const uninstallPlugin = async (pluginName: string) => {
    setUninstalling(pluginName)
    setError('')
    setSuccess('')
    try {
      const token = getAuthToken()
      const res = await fetch(`/api/v1/plugins/${pluginName}/uninstall`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setSuccess(`Uninstalled ${pluginName}.`)
        loadPlugins()
      } else {
        const errData = await res.json().catch(() => ({}))
        setError(errData.detail || 'Failed to uninstall plugin.')
      }
    } catch (err) {
      setError('Network error uninstalling plugin.')
    } finally {
      setUninstalling(null)
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
          <h1 className="text-2xl font-bold text-foreground">Plugin Store</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse and manage plugins for your tenant. Plugins add features to your storefront.
          </p>
        </div>
        <Link href="/portal/templates">
          <Button variant="outline" size="sm" className="gap-1">
            Templates
          </Button>
        </Link>
      </div>

      {!canPublishGlobally && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          You are signed in as a Tenant Admin. You can browse, install, enable, disable, and uninstall plugins for your tenant only. Global plugin publishing is restricted to Platform Super Admins.
        </div>
      )}

      {canPublishGlobally && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          You are signed in as a Platform Super Admin. <Link href="/admin/plugins" className="underline">Manage global plugin catalog</Link>
        </div>
      )}

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
                {plugin.installed && (
                  <Badge variant="default" className="gap-1">
                    <Check className="h-3 w-3" />
                    Installed
                  </Badge>
                )}
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

              {showConsent === plugin.name && (
                <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 space-y-2">
                  <div className="flex items-center gap-1 font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    Installation consent
                  </div>
                  <p>This plugin may change your storefront UI, business type classification, or data. Confirm to proceed.</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => installPlugin(plugin.name)}>
                      Confirm & Install
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowConsent(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {showConsent !== plugin.name && (
                <div className="flex gap-2 pt-2">
                  {!plugin.installed ? (
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={installing === plugin.name}
                      onClick={() => setShowConsent(plugin.name)}
                    >
                      {installing === plugin.name ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Install'
                      )}
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={toggling === plugin.name}
                        onClick={() => togglePlugin(plugin.name, true)}
                      >
                        {toggling === plugin.name ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <PowerOff className="h-4 w-4 mr-1" />
                            Disable
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={uninstalling === plugin.name}
                        onClick={() => uninstallPlugin(plugin.name)}
                      >
                        {uninstalling === plugin.name ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {plugins.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plug className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No plugins available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
