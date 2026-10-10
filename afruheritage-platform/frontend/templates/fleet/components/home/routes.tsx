import { Bus } from "lucide-react"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"

export function Routes({ theme }: { theme: TenantPublicTheme }) {
  return (
    <section id="routes" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: theme.primaryColor }}>
          Routes
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Routes &amp; Schedules</h2>
        <p className="mt-3 text-muted-foreground">
          View active routes, departure times, and stop sequences. Plan your journey with confidence.
        </p>
      </div>

      <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
        <span
          className="flex size-14 items-center justify-center rounded-full text-white"
          style={{ background: theme.primaryColor }}
        >
          <Bus className="size-7" />
        </span>
        <h3 className="mt-5 text-xl font-semibold">Coming Soon</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Published routes and schedules are not available yet. When this feature
          launches, active routes, departure times, and stop sequences will be
          listed here by the operator.
        </p>
      </div>
    </section>
  )
}
