"use client"

import { useState } from "react"
import {
  Search,
  TrendingUp,
  Users,
  HeartPulse,
  Trash2,
  PhoneCall,
  ArrowUpRight,
  Building2,
} from "lucide-react"
import {
  crmCustomers,
  crmOwners,
  endpointMap,
  type CrmCustomer,
  type CrmStage,
} from "@/lib/admin-data"
import type { ConfirmConfig } from "./admin-console"

type Props = {
  notify: (title: string, detail: string) => void
  requestConfirm: (cfg: ConfirmConfig) => void
}

const stageOrder: CrmStage[] = ["lead", "prospect", "customer", "churned"]

const stageStyles: Record<CrmStage, string> = {
  lead: "bg-accent/15 text-accent-foreground",
  prospect: "bg-secondary text-foreground",
  customer: "bg-primary/10 text-primary",
  churned: "bg-destructive/10 text-destructive",
}

function healthColor(h: number) {
  if (h >= 75) return "bg-primary"
  if (h >= 50) return "bg-accent"
  return "bg-destructive"
}

export function CrmPanel({ notify, requestConfirm }: Props) {
  const [customers, setCustomers] = useState(crmCustomers)
  const [query, setQuery] = useState("")
  const [stageFilter, setStageFilter] = useState<CrmStage | "all">("all")

  function resolve(key: keyof typeof endpointMap, id: string) {
    return endpointMap[key].path.replace("{customer_id}", id)
  }

  function changeStage(c: CrmCustomer, stage: CrmStage) {
    setCustomers((list) => list.map((x) => (x.id === c.id ? { ...x, stage } : x)))
    notify(`${c.name} → ${stage}`, `${endpointMap.updateStage.method} ${resolve("updateStage", c.id)}`)
  }

  function changeOwner(c: CrmCustomer, owner: string) {
    setCustomers((list) => list.map((x) => (x.id === c.id ? { ...x, owner } : x)))
    notify(`Assigned ${c.name} to ${owner}`, `${endpointMap.assignOwner.method} ${resolve("assignOwner", c.id)}`)
  }

  function convertLead(c: CrmCustomer) {
    setCustomers((list) => list.map((x) => (x.id === c.id ? { ...x, stage: "prospect" } : x)))
    notify(`Converted ${c.name}`, `${endpointMap.convertLead.method} ${resolve("convertLead", c.id)}`)
  }

  function logActivity(c: CrmCustomer) {
    notify(`Logged activity for ${c.name}`, `${endpointMap.logActivity.method} ${resolve("logActivity", c.id)}`)
  }

  function deleteCustomer(c: CrmCustomer) {
    setCustomers((list) => list.filter((x) => x.id !== c.id))
    notify(`Deleted ${c.name}`, `${endpointMap.deleteCustomer.method} ${resolve("deleteCustomer", c.id)}`)
  }

  const filtered = customers.filter((c) => {
    const matchesQuery =
      c.name.toLowerCase().includes(query.toLowerCase()) || c.company.toLowerCase().includes(query.toLowerCase())
    const matchesStage = stageFilter === "all" || c.stage === stageFilter
    return matchesQuery && matchesStage
  })

  const pipelineValue = customers.filter((c) => c.stage !== "churned").reduce((sum, c) => sum + c.value, 0)
  const activeCount = customers.filter((c) => c.stage === "customer").length
  const avgHealth = Math.round(customers.reduce((s, c) => s + c.health, 0) / (customers.length || 1))

  const summary = [
    { label: "Open pipeline", value: `GHS ${pipelineValue.toLocaleString()}`, icon: TrendingUp },
    { label: "Active customers", value: activeCount, icon: Users },
    { label: "Avg. health", value: `${avgHealth}%`, icon: HeartPulse },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-heading text-xl font-bold">Customer CRM</h2>
        <p className="text-sm text-muted-foreground">
          Manage accounts, pipeline stages, owners, and activity — SuiteCRM-style.
        </p>
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
          {(["all", ...stageOrder] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStageFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                stageFilter === s ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or company"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Customer cards */}
      <div className="grid gap-3">
        {filtered.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{c.name}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Building2 className="size-3" /> {c.company}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${stageStyles[c.stage]}`}>{c.stage}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{c.email}</span>
                  <span>{c.phone}</span>
                  <span>Value: <span className="font-medium text-foreground">GHS {c.value.toLocaleString()}</span></span>
                  <span>Last activity: {c.lastActivity}</span>
                </div>
                {/* Health bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-secondary">
                    <div className={`h-full rounded-full ${healthColor(c.health)}`} style={{ width: `${c.health}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{c.health}% health</span>
                  <div className="flex flex-wrap gap-1">
                    {c.tags.map((t) => (
                      <span key={t} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor={`stage-${c.id}`}>Stage for {c.name}</label>
                <select
                  id={`stage-${c.id}`}
                  value={c.stage}
                  onChange={(e) => changeStage(c, e.target.value as CrmStage)}
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                >
                  {stageOrder.map((s) => (
                    <option key={s} value={s} className="capitalize">{s}</option>
                  ))}
                </select>
                <label className="sr-only" htmlFor={`owner-${c.id}`}>Owner for {c.name}</label>
                <select
                  id={`owner-${c.id}`}
                  value={c.owner}
                  onChange={(e) => changeOwner(c, e.target.value)}
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                >
                  {crmOwners.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                {c.stage === "lead" && (
                  <button
                    onClick={() => convertLead(c)}
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                  >
                    <ArrowUpRight className="size-3.5" /> Convert
                  </button>
                )}
                <button
                  onClick={() => logActivity(c)}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                >
                  <PhoneCall className="size-3.5" /> Log
                </button>
                <button
                  aria-label={`Delete ${c.name}`}
                  onClick={() =>
                    requestConfirm({
                      title: `Delete ${c.name}?`,
                      message: "This permanently removes the customer record and all activity history.",
                      method: endpointMap.deleteCustomer.method,
                      resolvedPath: resolve("deleteCustomer", c.id),
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
          </div>
        ))}
        {filtered.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No customers match your filters.</p>}
      </div>
    </div>
  )
}
