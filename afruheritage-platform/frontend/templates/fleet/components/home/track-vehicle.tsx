"use client"

import { useState } from "react"
import { Search, Bus, Loader2, AlertCircle, CheckCircle2, Clock, MapPin } from "lucide-react"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"

interface TrackingEvent {
  status: string
  location: string
  timestamp: string
  description: string
}

interface TrackingResult {
  tracking_number: string
  status: string
  route: string
  current_location: string
  estimated_arrival: string
  events: TrackingEvent[]
}

export function TrackVehicle({ theme }: { theme: TenantPublicTheme }) {
  const [vehicleId, setVehicleId] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [error, setError] = useState("")

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault()
    if (!vehicleId.trim()) return
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch(
        `/api/v1/shipments/public/track/${vehicleId.trim()}`
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || "Vehicle not found")
      }
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err?.message || "Unable to track vehicle. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="track" className="border-b border-border" style={{ background: `${theme.primaryColor}08` }}>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: `${theme.primaryColor}15`, color: theme.primaryColor }}
          >
            <Bus className="size-3.5" /> Vehicle Tracking
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Track Your Vehicle</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter a vehicle ID or tracking number to see real-time location and route status.
          </p>
        </div>

        <form onSubmit={handleTrack} className="mt-6 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            placeholder="Enter vehicle ID or tracking number"
            className="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none focus:border-ring"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: theme.primaryColor }}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Track
          </button>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Vehicle / Tracking ID</p>
                <p className="font-mono text-lg font-bold">{result.tracking_number}</p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ background: theme.primaryColor }}
              >
                {result.status}
              </span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Route</p>
                <p className="text-sm font-medium">{result.route || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Location</p>
                <p className="text-sm font-medium">{result.current_location || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estimated Arrival</p>
                <p className="text-sm font-medium">{result.estimated_arrival || "—"}</p>
              </div>
            </div>

            {result.events && result.events.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold">Route History</h3>
                <div className="mt-3 space-y-3">
                  {result.events.map((event, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className="flex size-7 items-center justify-center rounded-full"
                          style={{ background: `${theme.primaryColor}15`, color: theme.primaryColor }}
                        >
                          {i === 0 ? <CheckCircle2 className="size-4" /> : <Clock className="size-4" />}
                        </span>
                        {i < result.events.length - 1 && <div className="h-full w-px bg-border" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm font-medium">{event.status}</p>
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" /> {event.location} &middot; {event.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
