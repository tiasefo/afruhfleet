'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  Cpu,
  Search,
  RefreshCw,
  Server,
  Activity,
  Play,
  Square,
} from 'lucide-react'

export default function FleetbasePage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/sentinel/tenants')
      setTenants(Array.isArray(data) ? data : (data.items || []))
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = tenants.filter((t) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      (t.company_name || '').toLowerCase().includes(searchLower) ||
      (t.subdomain || '').toLowerCase().includes(searchLower)
    )
  })

  const statusColor = (s: string) => {
    switch (s) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'running': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'stopped': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'provisioning': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      default: return ''
    }
  }

  const handleRestart = async (tenantId: string) => {
    try {
      await api.post(`/sentinel/fleetbase/tenant/${tenantId}/restart`)
      toast.success('Tenant restarted')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleDebug = async (tenantId: string) => {
    try {
      await api.post(`/sentinel/fleetbase/tenant/${tenantId}/debug`)
      toast.success('Debug session started')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fleetbase Operations</h1>
          <p className="mt-1 text-muted-foreground">Manage tenant Fleetbase runtimes</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search tenants..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No tenants found</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((t: any) => (
            <Card key={t.id}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{t.company_name || t.name}</div>
                    <div className="text-sm text-muted-foreground">{t.subdomain}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={statusColor(t.status || t.launch_status)}>{t.status || t.launch_status}</Badge>
                  {t.fleetbase_org_id && (
                    <span className="text-xs text-muted-foreground">FB: {t.fleetbase_org_id.slice(0, 8)}...</span>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleRestart(t.id)}>
                    <Play className="mr-1 h-3.5 w-3.5" /> Restart
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDebug(t.id)}>
                    <Activity className="mr-1 h-3.5 w-3.5" /> Debug
                  </Button>
                  <Button size="sm" variant="outline">View Logs</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
