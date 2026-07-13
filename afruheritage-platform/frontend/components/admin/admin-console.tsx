"use client"

import { useState, useEffect } from "react"
import {
  Users,
  Contact,
  CreditCard,
  MessageSquareWarning,
  Navigation,
  Boxes,
  Settings2,
  ShieldCheck,
  ShieldX,
  Trash2,
  Check,
  X,
  Ban,
  Search,
  Star,
  BadgeCheck,
  MapPin,
  Clock,
  Gauge,
  Compass,
  Download,
  RotateCcw,
  AlertTriangle,
  CircleDot,
} from "lucide-react"
import {
  adminVendors,
  adminReviews,
  deliveryLogs,
  adminJobs,
  featureFlags,
  endpointMap,
  type AdminVendor,
  type VendorStatus,
  type EndpointKey,
} from "@/lib/admin-data"
import { adminMarketplaceApi, adminVendorApi, adminReviewApi, templatesApi, crmApi, featureFlagsApi, billingAdminApi } from "@/lib/api"
import { CrmPanel } from "./crm-panel"
import { BillingPanel } from "./billing-panel"

type TabKey = "vendors" | "crm" | "billing" | "reviews" | "logs" | "jobs" | "settings" | "templates" | "rbac"

const tabs: { key: TabKey; label: string; icon: typeof Users }[] = [
  { key: "vendors", label: "Vendors", icon: Users },
  { key: "crm", label: "CRM", icon: Contact },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "reviews", label: "Reviews", icon: MessageSquareWarning },
  { key: "logs", label: "Delivery logs", icon: Navigation },
  { key: "jobs", label: "Jobs", icon: Boxes },
  { key: "templates", label: "Templates", icon: Boxes },
  { key: "rbac", label: "RBAC", icon: ShieldCheck },
  { key: "settings", label: "Settings", icon: Settings2 },
]

type Toast = { id: number; title: string; detail: string }

export type ConfirmConfig = {
  title: string
  message: string
  method: string
  resolvedPath: string
  danger?: boolean
  confirmLabel: string
  onConfirm: () => void
}

type ConfirmState = ConfirmConfig | null

const statusStyles: Record<VendorStatus, string> = {
  active: "bg-primary/10 text-primary",
  pending: "bg-accent/15 text-accent-foreground",
  suspended: "bg-destructive/10 text-destructive",
}

export function AdminConsole() {
  const [tab, setTab] = useState<TabKey>("vendors")
  const [vendors, setVendors] = useState<AdminVendor[]>([])
  const [reviews, setReviews] = useState<typeof adminReviews>([])
  const [jobs, setJobs] = useState<typeof adminJobs>([])
  const [flags, setFlags] = useState(featureFlags)
  const [templates, setTemplates] = useState<any[]>([])
  const [query, setQuery] = useState("")
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load real data from backend
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // Load jobs from backend
        const jobsData = await adminMarketplaceApi.jobs()
        if (jobsData?.jobs) {
          setJobs(jobsData.jobs.map((j: any) => ({
            id: j.id,
            tracking: j.tracking_number,
            tenant: j.tenant_id,
            driver: j.assigned_driver_id,
            status: j.status,
            price: j.suggested_price || 0,
            route: `${j.pickup_label} → ${j.dropoff_label}`,
            created: j.created_at,
          })))
        }

        // Load templates from backend
        const templatesData = await templatesApi.listAll()
        if (templatesData) {
          setTemplates(templatesData)
        }
      } catch (err) {
        console.error("Failed to load admin data:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  function notify(title: string, detail: string) {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, title, detail }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800)
  }

  function endpointLine(key: EndpointKey, path: string) {
    return `${endpointMap[key].method} ${path}`
  }

  // ----- Vendor actions -----
  async function setVendorStatus(v: AdminVendor, status: VendorStatus, key: EndpointKey, verb: string) {
    try {
      if (status === "active" && verb === "Reinstated") {
        await adminVendorApi.reinstateVendor(v.id)
      } else if (status === "active") {
        await adminVendorApi.approveVendor(v.id)
      } else if (status === "suspended" && verb === "Rejected") {
        await adminVendorApi.rejectVendor(v.id)
      } else if (status === "suspended") {
        await adminVendorApi.suspendVendor(v.id, "Admin action")
      }
      setVendors((list) => list.map((x) => (x.id === v.id ? { ...x, status, verified: status === "active" ? true : x.verified } : x)))
      notify(`${verb} ${v.name}`, endpointLine(key, endpointMap[key].path.replace("{vendor_id}", v.id)))
    } catch (err: any) {
      notify(`Failed to ${verb.toLowerCase()} ${v.name}`, err.message || "API error")
    }
  }

  async function deleteVendor(v: AdminVendor) {
    try {
      await adminVendorApi.deleteVendor(v.id)
      setVendors((list) => list.filter((x) => x.id !== v.id))
      notify(`Deleted ${v.name}`, endpointLine("deleteVendor", endpointMap.deleteVendor.path.replace("{vendor_id}", v.id)))
    } catch (err: any) {
      notify(`Failed to delete ${v.name}`, err.message || "API error")
    }
  }

  async function deleteReview(id: string) {
    try {
      await adminReviewApi.deleteReview(id)
      setReviews((list) => list.filter((r) => r.id !== id))
      notify("Comment deleted", endpointLine("deleteReview", endpointMap.deleteReview.path.replace("{review_id}", id)))
    } catch (err: any) {
      notify("Failed to delete comment", err.message || "API error")
    }
  }

  async function cancelJob(jobId: string, tracking: string) {
    try {
      await adminMarketplaceApi.cancelJob(jobId)
      setJobs((list) => list.map((j) => (j.id === jobId ? { ...j, status: "cancelled", driver: null } : j)))
      notify(`Cancelled ${tracking}`, endpointLine("cancelJob", endpointMap.cancelJob.path.replace("{job_id}", jobId)))
    } catch (err: any) {
      notify(`Failed to cancel ${tracking}`, err.message || "API error")
    }
  }

  async function toggleFlag(key: string) {
    try {
      const flag = flags.find((f) => f.key === key)
      if (!flag) return

      const updated = await featureFlagsApi.toggle(key, !flag.enabled)
      setFlags((list) => list.map((f) => (f.key === key ? { ...f, enabled: !flag.enabled } : f)))
      notify(`${!flag.enabled ? "Enabled" : "Disabled"} ${key}`, endpointLine("toggleFlag", endpointMap.toggleFlag.path.replace("{flag_key}", key)))
    } catch (err: any) {
      notify(`Failed to toggle ${key}`, err.message || "API error")
    }
  }

  async function reassignJob(jobId: string, tracking: string) {
    try {
      // Get eligible drivers for the job
      const driversData = await adminMarketplaceApi.getEligibleDrivers(jobId)
      if (driversData?.eligible_drivers && driversData.eligible_drivers.length > 0) {
        // For now, just pick the first driver - in real UI, show picker
        const driver = driversData.eligible_drivers[0]
        await adminMarketplaceApi.reassignJob(jobId, driver.driver_id)
        setJobs((list) => list.map((j) => (j.id === jobId ? { ...j, driver: driver.driver_name } : j)))
        notify(`Reassigned ${tracking} to ${driver.driver_name}`, endpointLine("reassignJob", endpointMap.reassignJob.path.replace("{job_id}", jobId).replace("{driver_id}", driver.driver_id)))
      } else {
        notify(`No eligible drivers found for ${tracking}`, "No drivers available")
      }
    } catch (err: any) {
      notify(`Failed to reassign ${tracking}`, err.message || "API error")
    }
  }

  async function createTemplate(data: any) {
    try {
      const newTemplate = await templatesApi.create(data)
      setTemplates((list) => [newTemplate, ...list])
      notify(`Created template ${data.name}`, "POST /storefront-templates/admin")
    } catch (err: any) {
      notify(`Failed to create template`, err.message || "API error")
    }
  }

  async function deleteTemplate(templateId: string, templateName: string) {
    try {
      await templatesApi.delete(templateId)
      setTemplates((list) => list.filter((t) => t.id !== templateId))
      notify(`Deleted template ${templateName}`, `DELETE /storefront-templates/admin/${templateId}`)
    } catch (err: any) {
      notify(`Failed to delete template`, err.message || "API error")
    }
  }

  async function toggleTemplateActive(templateId: string, isActive: boolean) {
    try {
      const updated = await templatesApi.update(templateId, { is_active: !isActive })
      setTemplates((list) => list.map((t) => (t.id === templateId ? updated : t)))
      notify(`${!isActive ? "Activated" : "Deactivated"} template`, `PATCH /storefront-templates/admin/${templateId}`)
    } catch (err: any) {
      notify(`Failed to update template`, err.message || "API error")
    }
  }

  const filteredVendors = vendors.filter(
    (v) => v.name.toLowerCase().includes(query.toLowerCase()) || v.region.toLowerCase().includes(query.toLowerCase()),
  )

  const counts = {
    pending: vendors.filter((v) => v.status === "pending").length,
    flagged: reviews.filter((r) => r.flagged).length,
    active: jobs.filter((j) => j.status === "assigned" || j.status === "open").length,
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-56 lg:shrink-0">
        <nav className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1.5 lg:flex-col">
          {tabs.map((t) => {
            const active = tab === t.key
            const badge = t.key === "vendors" ? counts.pending : t.key === "reviews" ? counts.flagged : 0
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex shrink-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  <t.icon className="size-4" />
                  {t.label}
                </span>
                {badge > 0 && (
                  <span className={`rounded-full px-1.5 text-xs font-semibold ${active ? "bg-primary-foreground/20" : "bg-accent/20 text-accent-foreground"}`}>
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Vendors */}
        {tab === "vendors" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-xl font-bold">Vendor management</h2>
                <p className="text-sm text-muted-foreground">Approve, suspend, or remove carriers.</p>
              </div>
              <div className="relative sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search vendors or region"
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Vendor</th>
                    <th className="hidden px-4 py-3 font-semibold md:table-cell">Region</th>
                    <th className="hidden px-4 py-3 font-semibold sm:table-cell">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map((v) => (
                    <tr key={v.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <v.Icon className="size-5" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate font-medium text-foreground">{v.name}</span>
                              {v.verified && <BadgeCheck className="size-3.5 shrink-0 text-primary" />}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="truncate">{v.type}</span>
                              <span className="inline-flex items-center gap-0.5">
                                <Star className="size-3 fill-accent text-accent" />
                                {v.rating}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{v.region}</td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[v.status]}`}>{v.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {v.status === "pending" && (
                            <>
                              <button
                                onClick={() => setVendorStatus(v, "active", "approveVendor", "Approved")}
                                className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                              >
                                <Check className="size-3.5" /> Approve
                              </button>
                              <button
                                onClick={() =>
                                  setConfirm({
                                    title: `Reject ${v.name}?`,
                                    message: "The vendor will be notified their application was declined.",
                                    method: endpointMap.rejectVendor.method,
                                    resolvedPath: endpointMap.rejectVendor.path.replace("{vendor_id}", v.id),
                                    confirmLabel: "Reject",
                                    onConfirm: () => setVendorStatus(v, "suspended", "rejectVendor", "Rejected"),
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                              >
                                <X className="size-3.5" /> Reject
                              </button>
                            </>
                          )}
                          {v.status === "active" && (
                            <button
                              onClick={() =>
                                setConfirm({
                                  title: `Suspend ${v.name}?`,
                                  message: "Suspended vendors cannot receive new bookings until reinstated.",
                                  method: endpointMap.suspendVendor.method,
                                  resolvedPath: endpointMap.suspendVendor.path.replace("{vendor_id}", v.id),
                                  confirmLabel: "Suspend",
                                  onConfirm: () => setVendorStatus(v, "suspended", "suspendVendor", "Suspended"),
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                            >
                              <Ban className="size-3.5" /> Suspend
                            </button>
                          )}
                          {v.status === "suspended" && (
                            <button
                              onClick={() => setVendorStatus(v, "active", "reinstateVendor", "Reinstated")}
                              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                            >
                              <ShieldCheck className="size-3.5" /> Reinstate
                            </button>
                          )}
                          <button
                            aria-label={`Delete ${v.name}`}
                            onClick={() =>
                              setConfirm({
                                title: `Delete ${v.name}?`,
                                message: "This permanently removes the vendor and all their records. This cannot be undone.",
                                method: endpointMap.deleteVendor.method,
                                resolvedPath: endpointMap.deleteVendor.path.replace("{vendor_id}", v.id),
                                danger: true,
                                confirmLabel: "Delete vendor",
                                onConfirm: () => deleteVendor(v),
                              })
                            }
                            className="inline-flex items-center rounded-md border border-border p-1.5 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredVendors.length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">No vendors match your search.</p>
              )}
            </div>
          </div>
        )}

        {/* CRM */}
        {tab === "crm" && <CrmPanel notify={notify} requestConfirm={setConfirm} />}

        {/* Billing */}
        {tab === "billing" && <BillingPanel notify={notify} requestConfirm={setConfirm} />}

        {/* Reviews */}
        {tab === "reviews" && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-heading text-xl font-bold">Review moderation</h2>
              <p className="text-sm text-muted-foreground">Remove spam, abusive, or fraudulent comments.</p>
            </div>
            <div className="grid gap-3">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className={`flex flex-col gap-2 rounded-xl border p-4 ${r.flagged ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{r.author}</span>
                      <span className="text-xs text-muted-foreground">on {r.vendor}</span>
                      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                        <Star className="size-3 fill-accent text-accent" />
                        {r.rating}
                      </span>
                      {r.flagged && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          <AlertTriangle className="size-3" /> Flagged
                        </span>
                      )}
                    </div>
                    <button
                      aria-label="Delete comment"
                      onClick={() =>
                        setConfirm({
                          title: "Delete this comment?",
                          message: "The comment will be permanently removed from the vendor's profile.",
                          method: endpointMap.deleteReview.method,
                          resolvedPath: endpointMap.deleteReview.path.replace("{review_id}", r.id),
                          danger: true,
                          confirmLabel: "Delete comment",
                          onConfirm: () => deleteReview(r.id),
                        })
                      }
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </button>
                  </div>
                  <p className="text-pretty text-sm text-foreground/90">{r.comment}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" /> {r.created}
                  </span>
                </div>
              ))}
              {reviews.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">All clear — no comments to moderate.</p>}
            </div>
          </div>
        )}

        {/* Delivery logs */}
        {tab === "logs" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-xl font-bold">Delivery logs &amp; GPS</h2>
                <p className="text-sm text-muted-foreground">Timestamped GPS pings streamed from active deliveries.</p>
              </div>
              <button
                onClick={() => notify("Exported GPS data", `${endpointMap.exportGps.method} ${endpointMap.exportGps.path}`)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
              >
                <Download className="size-4" /> Export CSV
              </button>
            </div>
            <div className="grid gap-3">
              {deliveryLogs.map((log) => (
                <div key={log.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CircleDot className={`size-4 ${log.status === "delivered" ? "text-primary" : log.status === "cancelled" ? "text-destructive" : "text-accent"}`} />
                      <span className="font-mono text-sm font-medium text-foreground">{log.tracking}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize text-muted-foreground">{log.status.replace("_", " ")}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" /> {log.timestamp}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="size-4 text-primary" />
                      <span className="font-mono text-xs text-foreground">
                        {log.lat.toFixed(4)}, {log.lng.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Gauge className="size-4 text-primary" />
                      {log.speed} km/h
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Compass className="size-4 text-primary" />
                      {log.heading}°
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Navigation className="size-4 text-primary" />
                      {log.distanceToDropoff} km left
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Driver: <span className="text-foreground">{log.vendor}</span> · ping <span className="font-mono">{log.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Jobs */}
        {tab === "jobs" && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-heading text-xl font-bold">Marketplace jobs</h2>
              <p className="text-sm text-muted-foreground">Cancel problematic jobs or reassign drivers.</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Tracking</th>
                    <th className="hidden px-4 py-3 font-semibold md:table-cell">Route</th>
                    <th className="hidden px-4 py-3 font-semibold sm:table-cell">Driver</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{j.tracking}</td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{j.route}</td>
                      <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{j.driver ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                            j.status === "completed"
                              ? "bg-primary/10 text-primary"
                              : j.status === "cancelled"
                                ? "bg-destructive/10 text-destructive"
                                : j.status === "open"
                                  ? "bg-accent/15 text-accent-foreground"
                                  : "bg-secondary text-foreground"
                          }`}
                        >
                          {j.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => reassignJob(j.id, j.tracking)}
                            disabled={j.status === "completed" || j.status === "cancelled"}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-40"
                          >
                            <RotateCcw className="size-3.5" /> Reassign
                          </button>
                          <button
                            onClick={() =>
                              setConfirm({
                                title: `Cancel ${j.tracking}?`,
                                message: "The job will be cancelled and any assigned driver released.",
                                method: endpointMap.cancelJob.method,
                                resolvedPath: endpointMap.cancelJob.path.replace("{job_id}", j.id),
                                danger: true,
                                confirmLabel: "Cancel job",
                                onConfirm: () => cancelJob(j.id, j.tracking),
                              })
                            }
                            disabled={j.status === "completed" || j.status === "cancelled"}
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
        )}

        {/* Templates management */}
        {tab === "templates" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-xl font-bold">Template management</h2>
                <p className="text-sm text-muted-foreground">Add, remove, and activate storefront templates.</p>
              </div>
              <button
                onClick={() => {
                  const code = prompt("Enter template code (e.g., 'my_custom_theme'):")
                  if (!code) return
                  const name = prompt("Enter template name:")
                  if (!name) return
                  const description = prompt("Enter description (optional):") || ""
                  createTemplate({
                    template_code: code,
                    name,
                    description,
                    preset: {
                      primary_color: "#0078D4",
                      secondary_color: "#323130",
                      accent_color: "#00BCF2",
                      background_color: "#f3f2f1",
                      font_family: "Segoe UI, sans-serif",
                      header_style: "white_with_shadow",
                      footer_style: "dark",
                      card_style: "rounded_with_border",
                    },
                  })
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
              >
                <Check className="size-4" /> Add Template
              </button>
            </div>
            <div className="grid gap-3">
              {templates.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{t.name}</span>
                      <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-muted-foreground">{t.template_code}</code>
                      {!t.is_active && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{t.description || "No description"}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" /> {new Date(t.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleTemplateActive(t.id, t.is_active)}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                    >
                      {t.is_active ? <Ban className="size-3.5" /> : <Check className="size-3.5" />}
                      {t.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete template "${t.name}"?`)) {
                          deleteTemplate(t.id, t.name)
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-destructive/50 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {templates.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No templates found.</p>}
            </div>
          </div>
        )}

        {/* Settings / feature flags */}
        {tab === "settings" && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-heading text-xl font-bold">Feature configuration</h2>
              <p className="text-sm text-muted-foreground">Toggle marketplace capabilities per your plan and credit rules.</p>
            </div>
            <div className="grid gap-3">
              {flags.map((f) => (
                <div key={f.key} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{f.label}</span>
                      <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-muted-foreground">{f.key}</code>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{f.description}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={f.enabled}
                    aria-label={`Toggle ${f.label}`}
                    onClick={() => toggleFlag(f.key)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${f.enabled ? "bg-primary" : "bg-muted-foreground/30"}`}
                  >
                    <span className={`absolute top-0.5 size-5 rounded-full bg-background transition-transform ${f.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setConfirm(null)} aria-hidden />
          <div role="dialog" aria-modal="true" className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${confirm.danger ? "bg-destructive/10 text-destructive" : "bg-accent/15 text-accent-foreground"}`}>
                {confirm.danger ? <ShieldX className="size-5" /> : <ShieldCheck className="size-5" />}
              </span>
              <div className="min-w-0">
                <h3 className="font-heading text-lg font-semibold">{confirm.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{confirm.message}</p>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-secondary/60 p-3">
              <p className="text-xs font-medium text-muted-foreground">Calls endpoint</p>
              <code className="mt-1 block break-all font-mono text-xs text-foreground">
                {confirm.method} {confirm.resolvedPath}
              </code>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirm(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
                Cancel
              </button>
              <button
                onClick={() => {
                  confirm.onConfirm()
                  setConfirm(null)
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 ${confirm.danger ? "bg-destructive" : "bg-primary"}`}
              >
                {confirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="rounded-xl border border-border bg-card p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-primary" />
              <span className="text-sm font-medium text-foreground">{t.title}</span>
            </div>
            <code className="mt-1 block break-all pl-6 font-mono text-xs text-muted-foreground">{t.detail}</code>
          </div>
        ))}
      </div>
    </div>
  )
}
