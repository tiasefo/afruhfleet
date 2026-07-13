import Image from "next/image"
import { Warehouse, AlertTriangle, Package, Clock, Bell } from "lucide-react"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"
import { VideoBackdrop } from "../video-backdrop"

const defaultNotices: Array<{
  title?: string
  tag?: string
  image?: string
  desc?: string
  priority?: 'normal' | 'warning' | 'info'
}> = [
  {
    title: "Consolidation Window Open",
    desc: "Current consolidation period for ocean freight is active. Submit cargo by Friday for next sailing.",
    priority: "normal",
  },
  {
    title: "Storage Fee Reminder",
    desc: "Free storage period is 7 days after arrival. Storage fees apply thereafter. Plan your pickup accordingly.",
    priority: "warning",
  },
  {
    title: "New Tracking Feature",
    desc: "Real-time GPS tracking is now available for all road freight shipments. Check your tracking page.",
    priority: "info",
  },
]

const reminderIconMap: Record<string, any> = { Clock, Package, Bell, AlertTriangle }

export function WarehouseNotices({ theme }: { theme: TenantPublicTheme }) {
  const cfg = theme.storefrontConfig
  const notices = cfg?.notices?.length ? cfg.notices : defaultNotices
  const reminders = cfg?.reminders || []

  return (
    <section id="warehouse" className="relative scroll-mt-20 overflow-hidden">
      <VideoBackdrop
        src={undefined}
        videoClassName="opacity-[0.06]"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide" style={{ color: theme.primaryColor }}>
              <Bell className="size-4" /> Warehouse Notices
            </span>
            <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">Arrivals &amp; Updates</h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Stay informed about consolidation schedules, storage policies, and important warehouse updates.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-6">
            <span
              className="flex size-12 items-center justify-center rounded-lg text-white"
              style={{ background: theme.primaryColor }}
            >
              <Warehouse className="size-6" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">Warehouse Services</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Package className="size-4 shrink-0" /> Cargo consolidation</li>
              <li className="flex items-center gap-2"><Package className="size-4 shrink-0" /> Short &amp; long-term storage</li>
              <li className="flex items-center gap-2"><Package className="size-4 shrink-0" /> Pick &amp; pack services</li>
              <li className="flex items-center gap-2"><Package className="size-4 shrink-0" /> Inventory management</li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold">Current Notices</h3>

            {notices.some(n => n.image) ? (
              <div className="mt-4 grid gap-6 md:grid-cols-3">
                {notices.map((notice, i) => (
                  <article
                    key={i}
                    className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                  >
                    {notice.image && (
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                          src={notice.image}
                          alt={notice.title || ""}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {notice.tag && (
                          <span
                            className="absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                            style={{ background: theme.accentColor }}
                          >
                            {notice.tag}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="p-5">
                      <h4 className="font-semibold">{notice.title}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{notice.desc}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {notices.map((notice, i) => (
                  <div
                    key={i}
                    className="flex gap-3 rounded-lg border border-border bg-card p-4"
                  >
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: notice.priority === "warning" ? "#f59e0b15" : `${theme.primaryColor}15`,
                        color: notice.priority === "warning" ? "#f59e0b" : theme.primaryColor,
                      }}
                    >
                      {notice.priority === "warning" ? (
                        <AlertTriangle className="size-4" />
                      ) : (
                        <Clock className="size-4" />
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{notice.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{notice.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reminders.length > 0 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {reminders.map((r, i) => {
                  const RIcon = reminderIconMap[r.icon || ""] || Clock
                  return (
                    <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-5">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                        <RIcon className="size-5" />
                      </span>
                      <div>
                        <h4 className="font-semibold">{r.title}</h4>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-6 rounded-lg border border-border p-4" style={{ background: `${theme.primaryColor}05` }}>
              <h4 className="text-sm font-semibold">Storage Fee Schedule</h4>
              <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Days 1-7</p>
                  <p className="mt-1 text-sm font-bold text-green-600">Free</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Days 8-30</p>
                  <p className="mt-1 text-sm font-bold" style={{ color: theme.primaryColor }}>Standard rate</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Day 31+</p>
                  <p className="mt-1 text-sm font-bold text-orange-600">Premium rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
