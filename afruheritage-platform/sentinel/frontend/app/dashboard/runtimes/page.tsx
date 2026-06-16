'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  Container,
  Search,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Rocket,
} from 'lucide-react'

export default function RuntimesPage() {
  const [tenantId, setTenantId] = useState('')
  const [runtime, setRuntime] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [deployOpen, setDeployOpen] = useState(false)
  const [deployTenantId, setDeployTenantId] = useState('')
  const [deployRunnerId, setDeployRunnerId] = useState('')
  const [deploying, setDeploying] = useState(false)

  const lookup = async () => {
    if (!tenantId) return
    setLoading(true)
    setSearched(true)
    try {
      const data = await api.get(`/sentinel/runtime/tenant/${tenantId}`)
      setRuntime(data)
    } catch (e: any) {
      toast.error(e.message)
      setRuntime(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDeploy = async () => {
    setDeploying(true)
    try {
      await api.post('/sentinel/runtime/deploy', {
        tenant_id: deployTenantId,
        runner_id: deployRunnerId || undefined,
      })
      toast.success('Runtime deployment initiated')
      setDeployOpen(false)
      setDeployTenantId('')
      setDeployRunnerId('')
      if (tenantId) lookup()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setDeploying(false)
    }
  }

  const handleSuspend = async () => {
    if (!runtime?.id) return
    try {
      await api.post('/sentinel/runtime/suspend', { runtime_id: runtime.id })
      toast.success('Runtime suspended')
      lookup()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleRetry = async () => {
    if (!runtime?.id) return
    try {
      await api.post('/sentinel/runtime/retry', { runtime_id: runtime.id })
      toast.success('Runtime retry initiated')
      lookup()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'running': case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'provisioning': case 'deploying': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'suspended': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      case 'failed': case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fleetbase Runtimes</h1>
          <p className="mt-1 text-muted-foreground">Manage tenant Fleetbase deployments</p>
        </div>
        <Button onClick={() => setDeployOpen(true)}>
          <Rocket className="mr-2 h-4 w-4" /> Deploy Runtime
        </Button>
      </div>

      <div className="flex gap-2 max-w-lg">
        <Input
          placeholder="Enter Tenant ID to view runtime..."
          value={tenantId}
          onChange={e => setTenantId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && lookup()}
        />
        <Button onClick={lookup} disabled={loading || !tenantId}>
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {searched && !loading && !runtime && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No runtime found for this tenant</CardContent></Card>
      )}

      {runtime && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Container className="h-5 w-5" />
              Tenant Runtime
              <Badge className={`ml-auto ${statusColor(runtime.status)}`}>{runtime.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="text-xs font-medium text-muted-foreground">Runtime ID</div>
                <div className="mt-1 font-mono text-sm">{runtime.id}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Tenant ID</div>
                <div className="mt-1 font-mono text-sm">{runtime.tenant_id}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Runner</div>
                <div className="mt-1 text-sm">{runtime.runner_label || runtime.runner_id || 'N/A'}</div>
              </div>
              {runtime.fleetbase_url && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Fleetbase URL</div>
                  <div className="mt-1 text-sm">{runtime.fleetbase_url}</div>
                </div>
              )}
              {runtime.created_at && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Created</div>
                  <div className="mt-1 text-sm">{new Date(runtime.created_at).toLocaleString()}</div>
                </div>
              )}
              {runtime.last_health_check && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Last Health Check</div>
                  <div className="mt-1 text-sm">{new Date(runtime.last_health_check).toLocaleString()}</div>
                </div>
              )}
            </div>

            {runtime.error_message && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                <strong>Error:</strong> {runtime.error_message}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {(runtime.status === 'running' || runtime.status === 'active') && (
                <Button variant="destructive" size="sm" onClick={handleSuspend}>
                  <Pause className="mr-1 h-3.5 w-3.5" /> Suspend
                </Button>
              )}
              {(runtime.status === 'failed' || runtime.status === 'error' || runtime.status === 'suspended') && (
                <Button size="sm" onClick={handleRetry}>
                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> Retry
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={lookup}>
                <RefreshCw className="mr-1 h-3.5 w-3.5" /> Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={deployOpen} onOpenChange={setDeployOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deploy Runtime</DialogTitle>
            <DialogDescription>Deploy a new Fleetbase runtime for a tenant</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Tenant ID</Label>
              <Input value={deployTenantId} onChange={e => setDeployTenantId(e.target.value)} placeholder="Tenant UUID" />
            </div>
            <div className="space-y-2">
              <Label>Runner ID (optional — auto-selects if empty)</Label>
              <Input value={deployRunnerId} onChange={e => setDeployRunnerId(e.target.value)} placeholder="Leave empty for auto-select" />
            </div>
            <Button className="w-full" onClick={handleDeploy} disabled={deploying || !deployTenantId}>
              {deploying ? 'Deploying...' : 'Deploy Runtime'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
