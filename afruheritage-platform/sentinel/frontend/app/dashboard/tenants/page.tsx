'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Eye,
  ShoppingBag,
  Truck,
  ExternalLink,
} from 'lucide-react'

export default function TenantsPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<any[]>([])
  const [tenantRequests, setTenantRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [search, setSearch] = useState('')
  const [requestStatusFilter, setRequestStatusFilter] = useState('pending_review')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [form, setForm] = useState({ company_name: '', contact_email: '', plan_code: 'free_trial', requested_domain: '', domain_type: 'subdomain' })

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

  const loadRequests = async () => {
    setLoadingRequests(true)
    try {
      const data = await api.get(`/sentinel/tenants/requests?status=${encodeURIComponent(requestStatusFilter)}&page=1&page_size=20`)
      setTenantRequests(Array.isArray(data) ? data : (data.items || []))
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoadingRequests(false)
    }
  }

  useEffect(() => { loadRequests() }, [requestStatusFilter])

  const handleCreate = async () => {
    setCreating(true)
    try {
      await api.post('/sentinel/tenants', form)
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
      await api.post(`/sentinel/tenants/${id}/approve`, { verification_notes: null })
      toast.success('Tenant approved')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleLaunch = async (id: string) => {
    try {
      await api.post(`/sentinel/tenants/${id}/launch`, { runner_id: null })
      toast.success('Tenant launch initiated')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleReviewRequest = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(`${id}:${status}`)
    try {
      await api.patch(`/sentinel/tenants/requests/${id}`, { status, review_notes: null })
      toast.success(`Request ${status}`)
      loadRequests()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleAutoProvision = async (id: string) => {
    setActionLoading(`${id}:auto`)
    try {
      await api.post(`/sentinel/tenants/requests/${id}/auto-provision`, {})
      toast.success('Tenant auto-provisioned')
      await Promise.all([load(), loadRequests()])
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSuspend = async (id: string) => {
    try {
      await api.post(`/sentinel/tenants/${id}/suspend`, {})
      toast.success('Tenant suspended')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleActivate = async (id: string) => {
    try {
      await api.post(`/sentinel/tenants/${id}/activate`, {})
      toast.success('Tenant activated')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tenant? This cannot be undone.')) return
    try {
      await api.delete(`/sentinel/tenants/${id}`)
      toast.success('Tenant deleted')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleProvision = async (id: string) => {
    try {
      await api.post(`/sentinel/tenants/${id}/provision`, {})
      toast.success('Fleetbase org provisioned')
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
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={statusColor(t.status || t.launch_status)}>{t.status || t.launch_status}</Badge>
                  {t.fleetbase_org_id && (
                    <span className="text-xs text-muted-foreground">FB: {t.fleetbase_org_id.slice(0, 8)}...</span>
                  )}
                  {t.plan_code && (
                    <span className="text-xs text-muted-foreground">Plan: {t.plan_code}</span>
                  )}
                  {(t.status || t.launch_status) === 'draft' && (
                    <Button size="sm" variant="outline" onClick={() => handleApprove(t.id)}>
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                    </Button>
                  )}
                  {(t.status || t.launch_status) === 'approved' && (
                    <Button size="sm" onClick={() => handleLaunch(t.id)}>
                      <Rocket className="mr-1 h-3.5 w-3.5" /> Launch
                    </Button>
                  )}
                  {(t.status || t.launch_status) === 'active' && (
                    <Button size="sm" variant="outline" onClick={() => handleSuspend(t.id)}>
                      Suspend
                    </Button>
                  )}
                  {(t.status || t.launch_status) === 'suspended' && (
                    <Button size="sm" variant="outline" onClick={() => handleActivate(t.id)}>
                      Activate
                    </Button>
                  )}
                  {!(t.fleetbase_org_id) && (t.status || t.launch_status) === 'approved' && (
                    <Button size="sm" variant="secondary" onClick={() => handleProvision(t.id)}>
                      Provision Fleetbase
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => window.open(`/store/${t.subdomain || t.slug}`, '_blank')}>
                    <ExternalLink className="mr-1 h-3.5 w-3.5" /> Storefront
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/tenants/${t.id}`)}>
                    <Eye className="mr-1 h-3.5 w-3.5" /> Preview
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(t.id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tenant Requests</CardTitle>
          <div className="flex items-center gap-2">
            <select
              className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={requestStatusFilter}
              onChange={e => setRequestStatusFilter(e.target.value)}
            >
              <option value="pending_review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="provisioning">Provisioning</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
            <Button variant="outline" size="icon" onClick={loadRequests}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="flex justify-center py-10">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : tenantRequests.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">No tenant requests found</div>
          ) : (
            <div className="space-y-3">
              {tenantRequests.map((r: any) => (
                <Card key={r.id}>
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold">{r.company_name}</div>
                      <div className="text-sm text-muted-foreground">{r.contact_name} · {r.contact_email} · {r.country}/{r.city}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColor(r.status)}>{r.status}</Badge>
                      {r.status === 'pending_review' && (
                        <>
                          <Button size="sm" variant="outline" disabled={actionLoading === `${r.id}:approved`} onClick={() => handleReviewRequest(r.id, 'approved')}>Approve</Button>
                          <Button size="sm" variant="outline" disabled={actionLoading === `${r.id}:rejected`} onClick={() => handleReviewRequest(r.id, 'rejected')}>Reject</Button>
                        </>
                      )}
                      {(r.status === 'approved' || r.status === 'provisioning') && (
                        <Button size="sm" disabled={actionLoading === `${r.id}:auto`} onClick={() => handleAutoProvision(r.id)}>Auto Provision</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
