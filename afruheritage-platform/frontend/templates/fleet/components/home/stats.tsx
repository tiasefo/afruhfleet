import { MapPin, Clock, ShieldCheck, TrendingUp } from "lucide-react"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"

const stats = [
  { icon: TrendingUp, value: "99.2%", label: "On-time dispatch" },
  { icon: MapPin, value: "48", label: "Service depots" },
  { icon: Clock, value: "24/7", label: "Roadside support" },
  { icon: ShieldCheck, value: "100%", label: "Insured fleet" },
]

export function Stats({ theme }: { theme: TenantPublicTheme }) {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <span
              className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg"
              style={{ background: `${theme.primaryColor}15`, color: theme.primaryColor }}
            >
              <s.icon className="size-5" />
            </span>
            <p className="text-3xl font-bold sm:text-4xl" style={{ color: theme.primaryColor }}>
              {s.value}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
