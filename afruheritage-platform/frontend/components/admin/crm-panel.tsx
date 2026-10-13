"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Search,
  TrendingUp,
  Users,
  Trash2,
  PhoneCall,
  ArrowUpRight,
  Building2,
  Plus,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { crmApi } from "@/lib/api"
import type { ConfirmConfig } from "./admin-console"

type Props = {
  notify: (title: string, detail: string) => void
  requestConfirm: (cfg: ConfirmConfig) => void
}

interface Customer {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
  stage: string
  owner?: string | null
  value?: number | null
  currency?: string
  source?: string | null
  notes?: string | null
  created_at?: string
}

interface Activity {
  id: string
  customer_id: string
  activity_type: string
  summary: string
  details?: string | null
  created_by?: string | null
  created_at: string
}

const STAGES = ["lead", "prospect", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]
const ACTIVITY_TYPES = ["call", "email", "meeting", "note", "task"]

const stageStyles: Record<string, string> = {
  lead: "bg-accent/15 text-accent-foreground",
  prospect: "bg-secondary text-foreground",
  qualified: "bg-blue-100 text-blue-800",
  proposal: "bg-yellow-100 text-yellow-800",
  negotiation: "bg-orange-100 text-orange-800",
  closed_won: "bg-primary/10 text-primary",
  closed_lost: "bg-destructive/10 text-destructive",
}

export function CrmPanel({ notify, requestConfirm }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [stageFilter, setStageFilter] = useState<string>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activities, setActivities] = useState<Record<string, Activity[]>>({})
  const [activitiesLoading, setActivitiesLoading] = useState(false)

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "", company: "", value: "", owner: "", notes: "" })

  const [activityTarget, setActivityTarget] = useState<Customer | null>(null)
  const [activityForm, setActivityForm] = useState({ activity_type: "note", summary: "", details: "" })
  const [savingActivity, setSavingActivity] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await crmApi.listCustomers()
      setCustomers(Array.isArray(res) ? res : [])
    } catch (e: any) {
      setError(e?.message || "Failed to load customers")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function changeStage(c: Customer, stage: string) {
    try {
      await crmApi.updateStage(c.id, stage)
      setCustomers((list) => list.map((x) => (x.id === c.id ? { ...x, stage } : x)))
      notify("Stage updated", `${c.name} → ${stage}`)
    } catch (e: any) {
      notify("Stage update failed", e?.message || "")
    }
  }

  async function changeOwner(c: Customer, owner: string) {
    try {
      await crmApi.updateOwner(c.id, owner)
      setCustomers((list) => list.map((x) => (x.id === c.id ? { ...x, owner } : x)))
      notify("Owner updated", `${c.name} → ${owner}`)
    } catch (e: any) {
      notify("Owner update failed", e?.message || "")
    }
  }

  async function createCustomer() {
    if (!newCustomer.name.trim()) return
    setCreating(true)
    try {
      await crmApi.createCustomer({
        name: newCustomer.name.trim(),
        email: newCustomer.email || undefined,
        phone: newCustomer.phone || undefined,
        company: newCustomer.company || undefined,
        owner: newCustomer.owner || undefined,
        value: newCustomer.value ? Number(newCustomer.value) : undefined,
        notes: newCustomer.notes || undefined,
      })
      setShowCreate(false)
      setNewCustomer({ name: "", email: "", phone: "", company: "", value: "", owner: "", notes: "" })
      notify("Customer created", newCustomer.name)
      load()
    } catch (e: any) {
      notify("Create failed", e?.message || "")
    } finally {
      setCreating(false)
    }
  }

  async function deleteCustomer(c: Customer) {
    try {
      await crmApi.deleteCustomer(c.id)
      setCustomers((list) => list.filter((x) => x.id !== c.id))
      notify("Customer deleted", c.name)
    } catch (e: any) {
      notify("Delete failed", e?.message || "")
    }
  }

  async function toggleActivities(c: Customer) {
    if (expandedId === c.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(c.id)
    if (activities[c.id]) return
    setActivitiesLoading(true)
    try {
      const res = await crmApi.listActivities(c.id)
      setActivities((m) => ({ ...m, [c.id]: Array.isArray(res) ? res : [] }))
    } catch {
      setActivities((m) => ({ ...m, [c.id]: [] }))
    } finally {
      setActivitiesLoading(false)
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
      setActivityForm({ activity_type: "note", summary: "", details: "" })
      notify("Activity logged", activityTarget.name)
      const res = await crmApi.listActivities(activityTarget.id)
      setActivities((m) => ({ ...m, [activityTarget.id]: Array.isArray(res) ? res : [] }))
    } catch (e: any) {
      notify("Activity failed", e?.message || "")
    } finally {
      setSavingActivity(false)
    }
  }

  const filtered = customers.filter((c) => {
    const q = query.toLowerCase()
    const matchesQuery = !q || c.name.toLowerCase().includes(q) || (c.company || "").toLowerCase().includes(q)
    const matchesStage = stageFilter === "all" || c.stage === stageFilter
    return matchesQuery && matchesStage
  })

  const pipelineValue = customers
    .filter((c) => !c.stage.startsWith("closed"))
    .reduce((sum, c) => sum + (c.value || 0), 0)
  const wonCount = customers.filter((c) => c.stage === "closed_won").length

  const summary = [
    { label: "Open pipeline", value: `GHS ${pipelineValue.toLocaleString()}`, icon: TrendingUp },
    { label: "Customers", value: customers.length, icon: Users },
    { label: "Closed won", value: wonCount, icon: ArrowUpRight },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold">Customer CRM</h2>
          <p className="text-sm text-muted-foreground">
            Manage accounts, pipeline stages, owners, and activity.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="size-3.5" /> New customer
        </button>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        {summary.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <s.icon className="size-5" />
            </span>
            <div>
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...STAGES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStageFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                stageFilter === s ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or company"
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <button onClick={load} className="rounded-md border border-border p-2 text-muted-foreground hover:bg-secondary" aria-label="Refresh">
            <RefreshCw className="size-4" />
          </button>
        </div>
      </div>

      {/* Create customer dialog */}
      {showCreate && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">New customer</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Name *" value={newCustomer.name} onChange={(e) => setNewCustomer((f) => ({ ...f, name: e.target.value }))} />
            <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Email" value={newCustomer.email} onChange={(e) => setNewCustomer((f) => ({ ...f, email: e.target.value }))} />
            <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Phone" value={newCustomer.phone} onChange={(e) => setNewCustomer((f) => ({ ...f, phone: e.target.value }))} />
            <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Company" value={newCustomer.company} onChange={(e) => setNewCustomer((f) => ({ ...f, company: e.target.value }))} />
            <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Est. value (GHS)" type="number" value={newCustomer.value} onChange={(e) => setNewCustomer((f) => ({ ...f, value: e.target.value }))} />
            <input className="rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Owner" value={newCustomer.owner} onChange={(e) => setNewCustomer((f) => ({ ...f, owner: e.target.value }))} />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium">Cancel</button>
            <button
              onClick={createCustomer}
              disabled={creating || !newCustomer.name.trim()}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              {creating && <Loader2 className="size-3.5 animate-spin" />} Create
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">{error}</div>
      )}

      {/* Customer cards */}
      <div className="grid gap-3">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {filtered.map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{c.name}</span>
                      {c.company && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="size-3" /> {c.company}
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${stageStyles[c.stage] || "bg-secondary text-foreground"}`}>
                        {c.stage.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {c.email && <span>{c.email}</span>}
                      {c.phone && <span>{c.phone}</span>}
                      {c.value != null && <span>Value: <span className="font-medium text-foreground">{c.currency || "GHS"} {Number(c.value).toLocaleString()}</span></span>}
                      {c.created_at && <span>Added {new Date(c.created_at).toLocaleDateString()}</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="sr-only" htmlFor={`stage-${c.id}`}>Stage for {c.name}</label>
                    <select
                      id={`stage-${c.id}`}
                      value={c.stage}
                      onChange={(e) => changeStage(c, e.target.value)}
                      className="rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                    <input
                      defaultValue={c.owner || ""}
                      placeholder="Owner"
                      onBlur={(e) => e.target.value !== (c.owner || "") && changeOwner(c, e.target.value)}
                      className="w-28 rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => { setActivityTarget(c); setActivityForm({ activity_type: "note", summary: "", details: "" }) }}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                    >
                      <PhoneCall className="size-3.5" /> Log
                    </button>
                    <button
                      onClick={() => toggleActivities(c)}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                    >
                      {expandedId === c.id ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />} Activity
                    </button>
                    <button
                      aria-label={`Delete ${c.name}`}
                      onClick={() =>
                        requestConfirm({
                          title: `Delete ${c.name}?`,
                          message: "This permanently removes the customer record and all activity history.",
                          method: "DELETE",
                          resolvedPath: `/crm/customers/${c.id}`,
                          danger: true,
                          confirmLabel: "Delete customer",
                          onConfirm: () => deleteCustomer(c),
                        })
                      }
                      className="inline-flex items-center rounded-md border border-border p-1.5 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Activity timeline */}
                {expandedId === c.id && (
                  <div className="mt-4 border-t border-border pt-3">
                    {activitiesLoading && !activities[c.id] ? (
                      <div className="flex justify-center py-3"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>
                    ) : (activities[c.id] || []).length === 0 ? (
                      <p className="py-2 text-xs text-muted-foreground">No activities recorded yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {(activities[c.id] || []).map((a) => (
                          <li key={a.id} className="flex items-start gap-3 rounded-md bg-secondary/50 p-2.5">
                            <span className="mt-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">{a.activity_type}</span>
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
              </div>
            ))}
            {filtered.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No customers match your filters.</p>}
          </>
        )}
      </div>

      {/* Log activity dialog */}
      {activityTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setActivityTarget(null)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-sm font-semibold">Log activity — {activityTarget.name}</h3>
            <div className="space-y-3">
              <select
                value={activityForm.activity_type}
                onChange={(e) => setActivityForm((f) => ({ ...f, activity_type: e.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm capitalize"
              >
                {ACTIVITY_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Summary *"
                value={activityForm.summary}
                onChange={(e) => setActivityForm((f) => ({ ...f, summary: e.target.value }))}
              />
              <textarea
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Details"
                rows={3}
                value={activityForm.details}
                onChange={(e) => setActivityForm((f) => ({ ...f, details: e.target.value }))}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setActivityTarget(null)} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium">Cancel</button>
                <button
                  onClick={saveActivity}
                  disabled={savingActivity || !activityForm.summary.trim()}
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {savingActivity && <Loader2 className="size-3.5 animate-spin" />} Save activity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
