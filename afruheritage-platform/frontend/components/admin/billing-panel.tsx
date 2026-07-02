"use client"

import { useState } from "react"
import {
  CircleDollarSign,
  Repeat,
  Receipt,
  Check,
  Pause,
  Play,
  Ban,
  Sparkles,
} from "lucide-react"
import {
  billingPlans,
  subscriptions as seedSubs,
  invoices as seedInvoices,
  endpointMap,
  type Subscription,
  type SubStatus,
  type Invoice,
  type InvoiceStatus,
} from "@/lib/admin-data"
import type { ConfirmConfig } from "./admin-console"

type Props = {
  notify: (title: string, detail: string) => void
  requestConfirm: (cfg: ConfirmConfig) => void
}

const subStatusStyles: Record<SubStatus, string> = {
  trialing: "bg-accent/15 text-accent-foreground",
  active: "bg-primary/10 text-primary",
  past_due: "bg-destructive/10 text-destructive",
  paused: "bg-secondary text-foreground",
  cancelled: "bg-destructive/10 text-destructive",
}

const invoiceStatusStyles: Record<InvoiceStatus, string> = {
  paid: "bg-primary/10 text-primary",
  open: "bg-accent/15 text-accent-foreground",
  overdue: "bg-destructive/10 text-destructive",
  void: "bg-secondary text-muted-foreground",
}

export function BillingPanel({ notify, requestConfirm }: Props) {
  const [subs, setSubs] = useState(seedSubs)
  const [invoices, setInvoices] = useState(seedInvoices)

  function subPath(key: keyof typeof endpointMap, id: string) {
    return endpointMap[key].path.replace("{subscription_id}", id)
  }
  function invPath(key: keyof typeof endpointMap, id: string) {
    return endpointMap[key].path.replace("{invoice_id}", id)
  }

  function changePlan(s: Subscription, plan: string) {
    const planObj = billingPlans.find((p) => p.name === plan)
    setSubs((list) => list.map((x) => (x.id === s.id ? { ...x, plan, mrr: planObj ? planObj.price : x.mrr } : x)))
    notify(`${s.company} → ${plan}`, `${endpointMap.changePlan.method} ${subPath("changePlan", s.id)}`)
  }

  function setSubStatus(s: Subscription, status: SubStatus, key: keyof typeof endpointMap, verb: string) {
    setSubs((list) => list.map((x) => (x.id === s.id ? { ...x, status } : x)))
    notify(`${verb} ${s.company}`, `${endpointMap[key].method} ${subPath(key, s.id)}`)
  }

  function markPaid(inv: Invoice) {
    setInvoices((list) => list.map((x) => (x.id === inv.id ? { ...x, status: "paid" } : x)))
    notify(`Marked ${inv.id} paid`, `${endpointMap.markInvoicePaid.method} ${invPath("markInvoicePaid", inv.id)}`)
  }

  function voidInvoice(inv: Invoice) {
    setInvoices((list) => list.map((x) => (x.id === inv.id ? { ...x, status: "void" } : x)))
    notify(`Voided ${inv.id}`, `${endpointMap.voidInvoice.method} ${invPath("voidInvoice", inv.id)}`)
  }

  const mrr = subs.filter((s) => s.status === "active").reduce((sum, s) => sum + s.mrr, 0)
  const outstanding = invoices.filter((i) => i.status === "open" || i.status === "overdue").reduce((sum, i) => sum + i.amount, 0)

  const summary = [
    { label: "MRR", value: `GHS ${mrr.toLocaleString()}`, icon: Repeat },
    { label: "ARR (est.)", value: `GHS ${(mrr * 12).toLocaleString()}`, icon: CircleDollarSign },
    { label: "Outstanding", value: `GHS ${outstanding.toLocaleString()}`, icon: Receipt },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-heading text-xl font-bold">Subscriptions &amp; billing</h2>
        <p className="text-sm text-muted-foreground">
          Manage plans, subscriptions, and invoices — KillBill-style recurring billing.
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

      {/* Plans */}
      <div>
        <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">Plans</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {billingPlans.map((p) => (
            <div
              key={p.id}
              className={`relative flex flex-col gap-3 rounded-xl border p-4 ${p.popular ? "border-primary bg-primary/5" : "border-border bg-card"}`}
            >
              {p.popular && (
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  <Sparkles className="size-3" /> Popular
                </span>
              )}
              <div>
                <p className="font-heading font-semibold text-foreground">{p.name}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  GHS {p.price.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground">/{p.interval}</span>
                </p>
              </div>
              <ul className="flex flex-col gap-1.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="size-3.5 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Subscriptions */}
      <div>
        <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">Subscriptions</h3>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">MRR</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">Next invoice</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{s.company}</div>
                    <div className="text-xs text-muted-foreground">{s.customer} · {s.seats} seats</div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">GHS {s.mrr.toLocaleString()}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{s.nextInvoice}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${subStatusStyles[s.status]}`}>
                      {s.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <label className="sr-only" htmlFor={`plan-${s.id}`}>Plan for {s.company}</label>
                      <select
                        id={`plan-${s.id}`}
                        value={s.plan}
                        onChange={(e) => changePlan(s, e.target.value)}
                        disabled={s.status === "cancelled"}
                        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary disabled:opacity-40"
                      >
                        {billingPlans.map((p) => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                      {s.status === "paused" ? (
                        <button
                          onClick={() => setSubStatus(s, "active", "resumeSubscription", "Resumed")}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                        >
                          <Play className="size-3.5" /> Resume
                        </button>
                      ) : (
                        <button
                          onClick={() => setSubStatus(s, "paused", "pauseSubscription", "Paused")}
                          disabled={s.status === "cancelled"}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-40"
                        >
                          <Pause className="size-3.5" /> Pause
                        </button>
                      )}
                      <button
                        onClick={() =>
                          requestConfirm({
                            title: `Cancel ${s.company}'s subscription?`,
                            message: "Billing stops at the end of the current period and the tenant loses plan features.",
                            method: endpointMap.cancelSubscription.method,
                            resolvedPath: subPath("cancelSubscription", s.id),
                            danger: true,
                            confirmLabel: "Cancel subscription",
                            onConfirm: () => setSubStatus(s, "cancelled", "cancelSubscription", "Cancelled"),
                          })
                        }
                        disabled={s.status === "cancelled"}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-40"
                      >
                        <Ban className="size-3.5" /> Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoices */}
      <div>
        <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">Invoices</h3>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Invoice</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">Customer</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">Due</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{inv.id}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{inv.customer}</td>
                  <td className="px-4 py-3 font-medium text-foreground">GHS {inv.amount.toLocaleString()}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{inv.due}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${invoiceStatusStyles[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => markPaid(inv)}
                        disabled={inv.status === "paid" || inv.status === "void"}
                        className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
                      >
                        <Check className="size-3.5" /> Mark paid
                      </button>
                      <button
                        onClick={() =>
                          requestConfirm({
                            title: `Void ${inv.id}?`,
                            message: "Voiding cancels the invoice. This cannot be undone.",
                            method: endpointMap.voidInvoice.method,
                            resolvedPath: invPath("voidInvoice", inv.id),
                            danger: true,
                            confirmLabel: "Void invoice",
                            onConfirm: () => voidInvoice(inv),
                          })
                        }
                        disabled={inv.status === "paid" || inv.status === "void"}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-40"
                      >
                        <Ban className="size-3.5" /> Void
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
