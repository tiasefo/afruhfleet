'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { BackButton } from '@/components/back-button'
import {
  Server,
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Play,
  Power,
  Search,
  Terminal,
} from 'lucide-react'

interface TenantRuntime {
  tenant_id: string
  tenant_name?: string
  status: string
  health: string
  last_restart?: string
  uptime?: string
  memory_usage?: number
  cpu_usage?: number
}

export default function FleetbasePage() {
  const [runtimes, setRuntimes] = useState<TenantRuntime[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRuntime, setSelectedRuntime] = useState<TenantRuntime | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [logsDialogOpen, setLogsDialogOpen] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const loadRuntimes = async () => {
    try {
      setLoading(true)
      // This would normally call the fleetbase ops endpoint
      // For now, we'll simulate with tenant data
      const response = await api.get('/admin/tenants')
      const runtimesData = (response || []).map((tenant: any) => ({
        tenant_id: tenant.id,
        tenant_name: tenant.company_name,
        status: 'active',
        health: 'healthy',
        last_restart: tenant.created_at,
        uptime: '24h',
        memory_usage: 45,
        cpu_usage: 12,
      }))
      setRuntimes(runtimesData)
    } catch (error) {
      toast.error('Failed to load tenant runtimes')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRuntimes()
  }, [])

  const handleRestart = async (tenantId: string) => {
    if (!confirm('Are you sure you want to restart this tenant runtime?')) return
    try {
      await api.post(`/admin/fleetbase/tenant/${tenantId}/restart`)
      toast.success('Tenant runtime restarted successfully')
      loadRuntimes()
    } catch (error) {
      toast.error('Failed to restart tenant runtime')
    }
  }

  const handleDebug = async (tenantId: string) => {
    try {
      await api.post(`/admin/fleetbase/tenant/${tenantId}/debug`)
      toast.success('Debug mode enabled')
    } catch (error) {
      toast.error('Failed to enable debug mode')
    }
  }

  const handleViewLogs = async (tenantId: string) => {
    try {
      const response = await api.get(`/admin/fleetbase/tenant/${tenantId}/logs`, { params: { lines: 100 } })
      setLogs(response.logs || [])
      setLogsDialogOpen(true)
    } catch (error) {
      toast.error('Failed to load logs')
    }
  }

  const handleHealthCheck = async (tenantId: string) => {
    try {
      const health = await api.get(`/admin/fleetbase/tenant/${tenantId}/health`)
      toast.success(`Health status: ${health.status}`)
    } catch (error) {
      toast.error('Failed to check health')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; icon: any }> = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      stopped: { color: 'bg-red-100 text-red-800', icon: XCircle },
      restarting: { color: 'bg-yellow-100 text-yellow-800', icon: RefreshCw },
      error: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    }
    const config = statusMap[status] || { color: 'bg-gray-100 text-gray-800', icon: Activity }
    const Icon = config.icon
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const getHealthBadge = (health: string) => {
    const healthMap: Record<string, { color: string }> = {
      healthy: { color: 'bg-green-100 text-green-800' },
      degraded: { color: 'bg-yellow-100 text-yellow-800' },
      unhealthy: { color: 'bg-red-100 text-red-800' },
    }
    const config = healthMap[health] || { color: 'bg-gray-100 text-gray-800' }
    return <Badge className={config.color}>{health}</Badge>
  }

  const filteredRuntimes = runtimes.filter(
    (runtime) =>
      runtime.tenant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      runtime.tenant_id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-3xl font-bold">Fleetbase Operations</h1>
        </div>
        <Button onClick={loadRuntimes} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by tenant name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading tenant runtimes...</div>
          ) : filteredRuntimes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No tenant runtimes found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uptime</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Memory</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Restart</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRuntimes.map((runtime) => (
                    <tr key={runtime.tenant_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-gray-400" />
                          {runtime.tenant_name || runtime.tenant_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(runtime.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getHealthBadge(runtime.health)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{runtime.uptime || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${runtime.cpu_usage || 0}%` }}
                            />
                          </div>
                          <span className="text-sm">{runtime.cpu_usage || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${runtime.memory_usage || 0}%` }}
                            />
                          </div>
                          <span className="text-sm">{runtime.memory_usage || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {runtime.last_restart ? new Date(runtime.last_restart).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleRestart(runtime.tenant_id)}>
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleViewLogs(runtime.tenant_id)}>
                            <Terminal className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDebug(runtime.tenant_id)}>
                            <Activity className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleHealthCheck(runtime.tenant_id)}>
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs Dialog */}
      <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Tenant Logs</DialogTitle>
            <DialogDescription>Recent logs from tenant runtime</DialogDescription>
          </DialogHeader>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-y-auto max-h-96">
            {logs.length > 0 ? (
              logs.map((log, index) => <div key={index}>{log}</div>)
            ) : (
              <div className="text-gray-500">No logs available</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
