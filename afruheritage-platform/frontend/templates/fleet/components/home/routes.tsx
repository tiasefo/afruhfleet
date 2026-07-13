import { Bus, Clock, MapPin } from "lucide-react"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"

const routes = [
  {
    name: "Accra - Kumasi Express",
    departure: "06:00",
    arrival: "10:30",
    duration: "4h 30m",
    stops: ["Accra Terminal", "Nsawam", "Kumasi Terminal"],
    status: "On Schedule",
  },
  {
    name: "Accra - Takoradi Route",
    departure: "07:30",
    arrival: "11:00",
    duration: "3h 30m",
    stops: ["Accra Terminal", "Cape Coast", "Takoradi Terminal"],
    status: "On Schedule",
  },
  {
    name: "Kumasi - Tamale Service",
    departure: "05:00",
    arrival: "13:00",
    duration: "8h 00m",
    stops: ["Kumasi Terminal", "Techiman", "Tamale Terminal"],
    status: "Delayed 15min",
  },
  {
    name: "Accra - Ho Line",
    departure: "08:00",
    arrival: "12:00",
    duration: "4h 00m",
    stops: ["Accra Terminal", "Koforidua", "Ho Terminal"],
    status: "On Schedule",
  },
]

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

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {routes.map((route) => (
          <div
            key={route.name}
            className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="flex size-10 items-center justify-center rounded-lg text-white"
                  style={{ background: theme.primaryColor }}
                >
                  <Bus className="size-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{route.name}</h3>
                  <p className="text-xs text-muted-foreground">{route.duration}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  route.status === "On Schedule"
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {route.status}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <span className="font-medium">{route.departure}</span>
                <span className="text-muted-foreground">to</span>
                <span className="font-medium">{route.arrival}</span>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground">Stops</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {route.stops.map((stop, i) => (
                  <span key={stop} className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" style={{ color: theme.primaryColor }} />
                      {stop}
                    </span>
                    {i < route.stops.length - 1 && <span className="text-muted-foreground/40">-</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
