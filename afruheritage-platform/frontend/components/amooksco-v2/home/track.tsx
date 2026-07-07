"use client"

import { useState } from "react"
import { CheckCircle2, Circle, PackageSearch, Ship } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { waLink, whatsapp } from "@/lib/amooksco"
import { useTenant } from "@/components/tenant-context-provider"
import { api } from "@/lib/api"

type Stage = { label: string; done: boolean; at?: string }

type Result = {
  ref: string
  mark: string
  status: string
  route: string
  current: string
  eta: string
  stages: Stage[]
}

function formatStatus(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(value?: string | null): string {
  if (!value) return "TBD"
  const d = new Date(value)
  if (isNaN(d.getTime())) return "TBD"
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function TrackForm({ kind }: { kind: "number" | "mark" }) {
  const { tenant } = useTenant()
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<Result | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const key = query.trim()
    if (!key) return
    const tenantSlug = tenant?.slug || tenant?.id
    if (!tenantSlug) {
      setResult(null)
      setNotFound(true)
      return
    }
    setLoading(true)
    setNotFound(false)
    try {
      const data: any = await api.get(
        `/shipments/public/track/${encodeURIComponent(tenantSlug)}/${encodeURIComponent(key)}`,
      )
      const origin = data.origin_city || data.origin_country || "Origin"
      const destination = data.destination_city || data.destination_country || "Destination"
      const events = Array.isArray(data.events) ? data.events : []
      const stages: Stage[] = events.map((ev: any) => ({
        label: ev.description || formatStatus(ev.event_type || "Update"),
        done: true,
        at: ev.occurred_at,
      }))
      setResult({
        ref: data.tracking_number || key,
        mark: data.receiver_name || data.sender_name || "—",
        status: formatStatus(data.status || "Unknown"),
        route: `${origin} → ${destination}`,
        current: data.current_location || "In transit",
        eta: formatDate(data.estimated_arrival),
        stages,
      })
    } catch {
      setResult(null)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Label htmlFor={`track-${kind}`} className="sr-only">
            {kind === "number" ? "Tracking number" : "Shipping mark"}
          </Label>
          <Input
            id={`track-${kind}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              kind === "number"
                ? "e.g. AFR-AMO-04A3302D82"
                : "e.g. AGYIRIGO (your shipping mark/name)"
            }
            className="h-11"
          />
        </div>
        <Button type="submit" size="lg" className="h-11" disabled={loading}>
          <PackageSearch className="size-4" />
          {loading ? "Searching…" : "Track"}
        </Button>
      </form>

      {result && (
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Tracking Reference</p>
              <p className="font-mono text-sm font-semibold text-foreground">
                {result.ref}
              </p>
            </div>
            <Badge className="bg-accent text-accent-foreground">{result.status}</Badge>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Shipping Mark</p>
              <p className="font-medium text-foreground">{result.mark}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Route</p>
              <p className="font-medium text-foreground">{result.route}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Current Location</p>
              <p className="font-medium text-foreground">{result.current}</p>
            </div>
            <div>
              <p className="text-muted-foreground">ETA</p>
              <p className="font-medium text-foreground">{result.eta}</p>
            </div>
          </div>

          {result.stages.length > 0 ? (
            <ol className="mt-5 space-y-3">
              {result.stages.map((stage, i) => (
                <li key={`${stage.label}-${i}`} className="flex items-start gap-3">
                  {stage.done ? (
                    <CheckCircle2 className="size-5 shrink-0 text-primary" />
                  ) : (
                    <Circle className="size-5 shrink-0 text-muted-foreground/50" />
                  )}
                  <span className="flex flex-col">
                    <span
                      className={
                        stage.done
                          ? "text-sm font-medium text-foreground"
                          : "text-sm text-muted-foreground"
                      }
                    >
                      {stage.label}
                    </span>
                    {stage.at && (
                      <span className="text-xs text-muted-foreground">{formatDate(stage.at)}</span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              No tracking events recorded yet. Check back soon for updates.
            </p>
          )}
        </div>
      )}

      {notFound && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
          <p className="font-medium text-destructive">
            We couldn&apos;t find that {kind === "number" ? "tracking number" : "shipping mark"}.
          </p>
          <p className="mt-1 text-muted-foreground">
            Please allow 4–5 days after delivery before special checks. Still stuck?
            Contact our tracking department on WhatsApp.
          </p>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="mt-3"
          >
            <a
              href={waLink(whatsapp.tracking, `Hello AMOOKSCO, I can't find: ${query}`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact Tracking Department
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}

export function Track() {
  return (
    <section id="track" className="scroll-mt-20 bg-muted">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-accent">
            <Ship className="size-4" /> Track Your Shipment
          </span>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground">
            Where Are My Goods?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Track by your AMOOKSCO tracking number or by your shipping mark / name.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Tabs defaultValue="number">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="number">By Tracking Number</TabsTrigger>
              <TabsTrigger value="mark">By Shipping Mark</TabsTrigger>
            </TabsList>
            <TabsContent value="number" className="mt-6">
              <TrackForm kind="number" />
            </TabsContent>
            <TabsContent value="mark" className="mt-6">
              <TrackForm kind="mark" />
            </TabsContent>
          </Tabs>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Enter your AMOOKSCO tracking number or shipping mark exactly as provided.
          </p>
        </div>
      </div>
    </section>
  )
}
