'use client'

import { useEffect, useState } from 'react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  Building2,
  Search,
  Plus,
  CheckCircle2,
  Rocket,
  RefreshCw,
} from 'lucide-react'

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ company_name: '', contact_email: '', plan_code: 'free_trial', requested_domain: '', domain_type: 'subdomain' })

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/admin/tenants')
      setTenants(Array.isArray(data) ? data : (data.items || []))
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
      await api.post('/admin/tenants', form)
      toast.success('Tenant created')
      setCreateOpen(false)
      setForm({ company_name: '', contact_email: '', plan_code: 'free_trial', requested_domain: '', domain_type: 'subdomain' })
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/admin/tenants/${id}/approve`)
      toast.success('Tenant approved')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleLaunch = async (id: string) => {
    try {
      await api.post(`/admin/tenants/${id}/launch`)
      toast.success('Tenant launch initiated')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const filtered = tenants.filter((t) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      (t.company_name || '').toLowerCase().includes(s) ||
      (t.subdomain || '').toLowerCase().includes(s) ||
      (t.contact_email || '').toLowerCase().includes(s)
    )
  })

  const statusColor = (s: string) => {
    switch (s) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'provisioning': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      default: return ''
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tenants</h1>
          <p className="mt-1 text-muted-foreground">Manage platform tenants</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Tenant</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Tenant</DialogTitle>
              <DialogDescription>Add a new tenant to the platform</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Subdomain / Domain</Label>
                <Input value={form.requested_domain} onChange={e => setForm(f => ({ ...f, requested_domain: e.target.value }))} placeholder="my-company" />
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={form.plan_code}
                  onChange={e => setForm(f => ({ ...f, plan_code: e.target.value }))}
                >
                  <option value="free_trial">Free Trial</option>
                  <option value="professional">Professional</option>
                  <option value="business">Business</option>
                </select>
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={creating || !form.company_name || !form.requested_domain || !form.contact_email}>
                {creating ? 'Creating...' : 'Create Tenant'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{t.company_name || t.name}</div>
                    <div className="text-sm text-muted-foreground">{t.subdomain} &middot; {t.contact_email || t.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColor(t.status)}>{t.status}</Badge>
                  {t.status === 'pending' && (
                    <Button size="sm" variant="outline" onClick={() => handleApprove(t.id)}>
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                    </Button>
                  )}
                  {t.status === 'approved' && (
                    <Button size="sm" onClick={() => handleLaunch(t.id)}>
                      <Rocket className="mr-1 h-3.5 w-3.5" /> Launch
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
