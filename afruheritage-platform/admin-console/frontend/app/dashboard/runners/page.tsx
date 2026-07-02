'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { BackButton } from '@/components/back-button'
import { Server, Plus, RefreshCw, Wifi, WifiOff } from 'lucide-react'

export default function RunnersPage() {
  const [runners, setRunners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    host: '',
    ssh_port: '22',
    ssh_user: 'root',
    fleetbase_root: '/srv/fleetbase',
    reserved_for_single_tenant: true,
  })

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/admin/runners')
      setRunners(Array.isArray(data) ? data : (data.items || []))
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setCreating(true)
    try {
      await api.post('/admin/runners', {
        ...form,
        ssh_port: parseInt(form.ssh_port) || 22,
      })
      toast.success('Runner created')
      setCreateOpen(false)
      setForm({
        name: '',
        host: '',
        ssh_port: '22',
        ssh_user: 'root',
        fleetbase_root: '/srv/fleetbase',
        reserved_for_single_tenant: true,
      })
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setCreating(false)
    }
  }

  return (
  <>
    <BackButton />
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Runner Nodes</h1>
          <p className="mt-1 text-muted-foreground">Manage Fleetbase runner infrastructure</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Runner</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Runner Node</DialogTitle>
                <DialogDescription>Connect a new server for Fleetbase deployments</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="runner-01" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label>Host / IP</Label>
                    <Input value={form.host} onChange={e => setForm(f => ({ ...f, host: e.target.value }))} placeholder="192.168.1.10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input value={form.ssh_port} onChange={e => setForm(f => ({ ...f, ssh_port: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>SSH User</Label>
                  <Input value={form.ssh_user} onChange={e => setForm(f => ({ ...f, ssh_user: e.target.value }))} placeholder="root" />
                </div>
                <div className="space-y-2">
                  <Label>Fleetbase Root Directory</Label>
                  <Input value={form.fleetbase_root} onChange={e => setForm(f => ({ ...f, fleetbase_root: e.target.value }))} placeholder="/srv/fleetbase" />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.reserved_for_single_tenant}
                    onChange={e => setForm(f => ({ ...f, reserved_for_single_tenant: e.target.checked }))}
                  />
                  Reserve runner for one active tenant at a time
                </label>
                <Button className="w-full" onClick={handleCreate} disabled={creating || !form.name || !form.host || !form.fleetbase_root}>
                  {creating ? 'Adding...' : 'Add Runner'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : runners.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No runner nodes configured</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {runners.map((r: any) => {
            const online = r.status === 'online' || r.is_active
            return (
              <Card key={r.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${online ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                        <Server className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold">{r.name}</div>
                        <div className="text-sm text-muted-foreground">{r.host}:{r.ssh_port || 22}</div>
                      </div>
                    </div>
                    <Badge variant={online ? 'default' : 'outline'} className={online ? 'bg-green-600' : ''}>
                      {online ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}
                      {online ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    <div>User: {r.ssh_user || r.user || 'root'}</div>
                    <div>Root: {r.fleetbase_root || '-'}</div>
                    {r.tenant_count != null && <div>Tenants: {r.tenant_count}</div>}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
    </>
  )
}
