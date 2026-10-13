'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { crmApi, ApiError } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BackButton } from '@/components/back-button'
import {
  Loader2, AlertCircle, Plus, Search, Building2, PhoneCall,
  ChevronDown, ChevronUp, Trash2, Users, TrendingUp,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const STAGES = ['lead', 'prospect', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
const ACTIVITY_TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'note', label: 'Note' },
  { value: 'task', label: 'Task' },
]

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-800',
  prospect: 'bg-blue-100 text-blue-800',
  qualified: 'bg-cyan-100 text-cyan-800',
  proposal: 'bg-amber-100 text-amber-800',
  negotiation: 'bg-orange-100 text-orange-800',
  closed_won: 'bg-green-100 text-green-800',
  closed_lost: 'bg-red-100 text-red-800',
}

export default function CrmCustomersPage() {
  const { token, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activities, setActivities] = useState<Record<string, any[]>>({})

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', company: '', value: '', notes: '' })

  const [activityTarget, setActivityTarget] = useState<any>(null)
  const [activityForm, setActivityForm] = useState({ activity_type: 'note', summary: '', details: '' })
  const [savingActivity, setSavingActivity] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!token) { router.push('/login'); return }
    load()
  }, [authLoading, token])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await crmApi.listCustomers()
      setCustomers(Array.isArray(res) ? res : [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [])

  async function createCustomer() {
    if (!newCustomer.name.trim()) return
    setCreating(true)
    try {
      await crmApi.createCustomer({
        name: newCustomer.name.trim(),
        email: newCustomer.email || undefined,
        phone: newCustomer.phone || undefined,
        company: newCustomer.company || undefined,
        value: newCustomer.value ? Number(newCustomer.value) : undefined,
        notes: newCustomer.notes || undefined,
      })
      setShowCreate(false)
      setNewCustomer({ name: '', email: '', phone: '', company: '', value: '', notes: '' })
      load()
    } catch (e: any) {
      setError(e?.message || 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  async function changeStage(c: any, stage: string) {
    try {
      await crmApi.updateStage(c.id, stage)
      setCustomers((l) => l.map((x) => (x.id === c.id ? { ...x, stage } : x)))
    } catch (e: any) {
      setError(e?.message || 'Stage update failed')
    }
  }

  async function removeCustomer(c: any) {
    try {
      await crmApi.deleteCustomer(c.id)
      setCustomers((l) => l.filter((x) => x.id !== c.id))
    } catch (e: any) {
      setError(e?.message || 'Delete failed')
    }
  }

  async function toggleActivities(c: any) {
    if (expandedId === c.id) { setExpandedId(null); return }
    setExpandedId(c.id)
    if (activities[c.id]) return
    try {
      const res = await crmApi.listActivities(c.id)
      setActivities((m) => ({ ...m, [c.id]: Array.isArray(res) ? res : [] }))
    } catch {
      setActivities((m) => ({ ...m, [c.id]: [] }))
    }
  }

  async function saveActivity() {
    if (!activityTarget || !activityForm.summary.trim()) return
    setSavingActivity(true)
    try {
      await crmApi.createActivity(activityTarget.id, {
        activity_type: activityForm.activity_type,
        summary: activityForm.summary.trim(),
        details: activityForm.details || undefined,
      })
      setActivityTarget(null)
      setActivityForm({ activity_type: 'note', summary: '', details: '' })
      const res = await crmApi.listActivities(activityTarget.id)
      setActivities((m) => ({ ...m, [activityTarget.id]: Array.isArray(res) ? res : [] }))
    } catch (e: any) {
      setError(e?.message || 'Activity save failed')
    } finally {
      setSavingActivity(false)
    }
  }

  const filtered = customers.filter((c) => {
    const q = query.toLowerCase()
    return (!q || c.name.toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q))
      && (stageFilter === 'all' || c.stage === stageFilter)
  })
  const pipelineValue = customers.filter((c) => !c.stage.startsWith('closed')).reduce((s, c) => s + (c.value || 0), 0)

  if (authLoading || loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <BackButton />
          <div className="mt-2 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
              <p className="mt-1 text-sm text-gray-600">Customer records, pipeline stages, and activity history</p>
            </div>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" /> New customer
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2">
          <Card><CardContent className="flex items-center gap-3 pt-6">
            <Users className="h-8 w-8 text-blue-600" />
            <div><p className="text-2xl font-bold">{customers.length}</p><p className="text-xs text-muted-foreground">Total customers</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 pt-6">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div><p className="text-2xl font-bold">GHS {pipelineValue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Open pipeline</p></div>
          </CardContent></Card>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {['all', ...STAGES].map((s) => (
              <button key={s} onClick={() => setStageFilter(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${stageFilter === s ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-secondary'}`}>
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search name or company" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        <div className="grid gap-3">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{c.name}</span>
                      {c.company && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Building2 className="h-3 w-3" />{c.company}</span>}
                      <Badge className={STAGE_COLORS[c.stage] || 'bg-gray-100'}>{c.stage.replace(/_/g, ' ')}</Badge>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {c.email && <span>{c.email}</span>}
                      {c.phone && <span>{c.phone}</span>}
                      {c.value != null && <span>{c.currency || 'GHS'} {Number(c.value).toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={c.stage} onValueChange={(v) => changeStage(c, v)}>
                      <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STAGES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={() => { setActivityTarget(c); setActivityForm({ activity_type: 'note', summary: '', details: '' }) }}>
                      <PhoneCall className="mr-1 h-3.5 w-3.5" /> Log
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleActivities(c)}>
                      {expandedId === c.id ? <ChevronUp className="mr-1 h-3.5 w-3.5" /> : <ChevronDown className="mr-1 h-3.5 w-3.5" />} Activity
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeCustomer(c)} aria-label={`Delete ${c.name}`}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>

                {expandedId === c.id && (
                  <div className="mt-4 border-t pt-3">
                    {(activities[c.id] || []).length === 0 ? (
                      <p className="py-2 text-xs text-muted-foreground">No activities recorded yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {(activities[c.id] || []).map((a) => (
                          <li key={a.id} className="flex items-start gap-3 rounded-md bg-gray-50 p-2.5">
                            <span className="mt-0.5 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-blue-800">{a.activity_type}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium">{a.summary}</p>
                              {a.details && <p className="mt-0.5 text-xs text-muted-foreground">{a.details}</p>}
                              <p className="mt-1 text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
              No customers yet. Create your first customer to start tracking pipeline activity.
            </CardContent></Card>
          )}
        </div>
      </div>

      {/* Create customer dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New customer</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Name *" value={newCustomer.name} onChange={(e) => setNewCustomer((f) => ({ ...f, name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Email" value={newCustomer.email} onChange={(e) => setNewCustomer((f) => ({ ...f, email: e.target.value }))} />
              <Input placeholder="Phone" value={newCustomer.phone} onChange={(e) => setNewCustomer((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <Input placeholder="Company" value={newCustomer.company} onChange={(e) => setNewCustomer((f) => ({ ...f, company: e.target.value }))} />
            <Input placeholder="Est. value (GHS)" type="number" value={newCustomer.value} onChange={(e) => setNewCustomer((f) => ({ ...f, value: e.target.value }))} />
            <Textarea placeholder="Notes" rows={2} value={newCustomer.notes} onChange={(e) => setNewCustomer((f) => ({ ...f, notes: e.target.value }))} />
            <Button onClick={createCustomer} disabled={creating || !newCustomer.name.trim()}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Create customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log activity dialog */}
      <Dialog open={!!activityTarget} onOpenChange={(o) => !o && setActivityTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log activity — {activityTarget?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={activityForm.activity_type} onValueChange={(v) => setActivityForm((f) => ({ ...f, activity_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Summary *" value={activityForm.summary} onChange={(e) => setActivityForm((f) => ({ ...f, summary: e.target.value }))} />
            <Textarea placeholder="Details" rows={3} value={activityForm.details} onChange={(e) => setActivityForm((f) => ({ ...f, details: e.target.value }))} />
            <Button onClick={saveActivity} disabled={savingActivity || !activityForm.summary.trim()} className="w-full">
              {savingActivity ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save activity
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
