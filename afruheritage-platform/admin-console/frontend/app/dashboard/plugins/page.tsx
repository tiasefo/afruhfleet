'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  Puzzle,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Settings,
  Shield,
  Zap,
} from 'lucide-react'

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [checking, setChecking] = useState<string | null>(null)
  const [fixing, setFixing] = useState<string | null>(null)

  const loadPlugins = async () => {
    setLoading(true)
    try {
      const data = await api.get('/admin/plugins')
      setPlugins(Array.isArray(data) ? data : [])
    } catch (err: any) {
      toast.error('Failed to load plugins: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlugins()
  }, [])

  const handleCheck = async (pluginName: string) => {
    if (!selectedTenantId) {
      toast.error('Please enter a tenant ID first')
      return
    }
    setChecking(pluginName)
    try {
      const result = await api.post(`/admin/plugins/${pluginName}/check/${selectedTenantId}`)
      toast.success(`Check complete: ${result.healthy ? 'Healthy' : 'Needs attention'}`)
      loadPlugins()
    } catch (err: any) {
      toast.error('Check failed: ' + err.message)
    } finally {
      setChecking(null)
    }
  }

  const handleAutoFix = async (pluginName: string) => {
    if (!selectedTenantId) {
      toast.error('Please enter a tenant ID first')
      return
    }
    setFixing(pluginName)
    try {
      const result = await api.post(`/admin/plugins/${pluginName}/auto-fix/${selectedTenantId}`)
      if (result.success) {
        toast.success(`Auto-fix successful: ${result.message}`)
      } else {
        toast.warning(`Auto-fix attempted: ${result.message}`)
      }
      loadPlugins()
    } catch (err: any) {
      toast.error('Auto-fix failed: ' + err.message)
    } finally {
      setFixing(null)
    }
  }

  const getHealthIcon = (health: any) => {
    if (health?.healthy) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    return <AlertCircle className="h-4 w-4 text-amber-500" />
  }

  const getHealthBadge = (health: any) => {
    if (health?.healthy) {
      return <Badge className="bg-green-100 text-green-800">Healthy</Badge>
    }
    return <Badge className="bg-amber-100 text-amber-800">Needs Attention</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plugin Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Auto-fix plugins enable and configure platform features automatically
          </p>
        </div>
        <Button onClick={loadPlugins} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tenant Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter tenant ID to check plugins..."
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="max-w-md"
            />
            <Button variant="outline" disabled={!selectedTenantId}>
              <Settings className="h-4 w-4 mr-2" />
              Set Tenant
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plugins.map((plugin) => (
            <Card key={plugin.name}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Puzzle className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{plugin.feature_name}</CardTitle>
                  </div>
                  {getHealthIcon(plugin.health)}
                </div>
                <p className="text-xs text-gray-500 font-mono mt-1">{plugin.name}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {getHealthBadge(plugin.health)}
                  {plugin.health?.auto_fixed && (
                    <Badge variant="outline" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Auto-fixed
                    </Badge>
                  )}
                </div>

                {plugin.required_endpoints && plugin.required_endpoints.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Required Endpoints</p>
                    <div className="flex flex-wrap gap-1">
                      {plugin.required_endpoints.map((ep: string) => (
                        <Badge key={ep} variant="outline" className="text-xs">
                          {ep}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {plugin.feature_flags && plugin.feature_flags.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Feature Flags</p>
                    <div className="flex flex-wrap gap-1">
                      {plugin.feature_flags.map((flag: string) => (
                        <Badge key={flag} variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {plugin.health?.details && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    {plugin.health.details}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={!selectedTenantId || checking === plugin.name}
                    onClick={() => handleCheck(plugin.name)}
                  >
                    {checking === plugin.name ? (
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3 w-3 mr-2" />
                    )}
                    Check
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={!selectedTenantId || fixing === plugin.name}
                    onClick={() => handleAutoFix(plugin.name)}
                  >
                    {fixing === plugin.name ? (
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-3 w-3 mr-2" />
                    )}
                    Auto-Fix
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
