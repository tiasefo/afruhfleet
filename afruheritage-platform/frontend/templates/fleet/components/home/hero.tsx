import { Bus, Route, MapPin, ArrowRight, Search } from "lucide-react"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"

export function Hero({ theme }: { theme: TenantPublicTheme }) {
  return (
    <section id="home" className="relative">
      <div
        className="relative min-h-[520px] w-full overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryDarkColor})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="relative mx-auto flex min-h-[520px] max-w-7xl items-center px-4 py-16 sm:px-6">
          <div className="grid w-full items-center gap-10 lg:grid-cols-2">
            <div className="text-white">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: theme.accentColor, color: theme.primaryColor }}
              >
                Transport &amp; Fleet Operations
              </span>
              <h1 className="mt-5 text-balance text-4xl font-bold leading-tight sm:text-5xl">
                Keep your entire fleet moving, profitably.
              </h1>
              <p className="mt-5 max-w-md text-pretty text-lg leading-relaxed opacity-80">
                Manage routes, track vehicles in real-time, dispatch with confidence,
                and maintain your fleet — all from one platform.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#track"
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ background: theme.accentColor, color: theme.primaryColor }}
                >
                  <Search className="size-4" /> Track Vehicle
                </a>
                <a
                  href="#routes"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  View Routes <ArrowRight className="size-4" />
                </a>
              </div>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { icon: Bus, label: "Fleet Management", desc: "Buses, coaches & vans" },
                { icon: Route, label: "Route Planning", desc: "Schedules & dispatch" },
                { icon: MapPin, label: "Live Tracking", desc: "GPS visibility 24/7" },
                { icon: Search, label: "Find Vehicle", desc: "Search by route/ID" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/15 bg-white/5 p-6 backdrop-blur"
                >
                  <item.icon className="size-8 text-white" />
                  <p className="mt-3 text-sm font-semibold text-white">{item.label}</p>
                  <p className="mt-1 text-xs text-white/60">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
