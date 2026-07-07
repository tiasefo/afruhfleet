"use client"

import { useState } from "react"
import { CheckCircle2, Circle, PackageSearch, Ship } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { waLink, whatsapp } from "@/lib/amooksco"
import { api } from "@/lib/api"
import { useTenant } from "@/components/tenant-context-provider"

type Stage = { label: string; done: boolean }

type Result = {
  ref: string
  mark: string
  status: string
  mode: string
  eta: string
  stages: Stage[]
}

// Demo dataset (mocked for presentation per spec).
const demo: Record<string, Result> = {
  "AFR-AMO-04A3302D82": {
    ref: "AFR-AMO-04A3302D82",
    mark: "AGYIRIGO",
    status: "In Transit (Sea)",
    mode: "Sea Cargo",
    eta: "Arriving Tema Port in ~6 days",
    stages: [
      { label: "Received at China Warehouse", done: true },
      { label: "Consolidated & Loaded", done: true },
      { label: "Departed China Port", done: true },
      { label: "In Transit to Ghana", done: true },
      { label: "Customs Clearance", done: false },
      { label: "Ready for Delivery", done: false },
    ],
  },
  AGYIRIGO: {
    ref: "AFR-AMO-04A3302D82",
    mark: "AGYIRIGO",
    status: "In Transit (Sea)",
    mode: "Sea Cargo",
    eta: "Arriving Tema Port in ~6 days",
    stages: [
      { label: "Received at China Warehouse", done: true },
      { label: "Consolidated & Loaded", done: true },
      { label: "Departed China Port", done: true },
      { label: "In Transit to Ghana", done: true },
      { label: "Customs Clearance", done: false },
      { label: "Ready for Delivery", done: false },
    ],
  },
}

function TrackForm({ kind }: { kind: "number" | "mark" }) {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<Result | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)
  const { tenant } = useTenant()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const key = query.trim().toUpperCase()
    setLoading(true)
    setNotFound(false)
    
    try {
      if (kind === "number") {
        // Track by tracking number using public API
        const data = await api.get(`/shipments/public/track/${tenant?.id || 'amooksco'}/${key}`)
        if (data) {
          setResult({
            ref: data.tracking_number || key,
            mark: data.shipping_mark || 'N/A',
            status: data.status || 'Unknown',
            mode: data.mode || 'Unknown',
            eta: data.eta || 'TBD',
            stages: data.stages || [],
          })
        } else {
          setNotFound(true)
        }
      } else {
        // Track by shipping mark - search shipments
        const data = await api.get(`/shipments?shipping_mark=${key}`)
        if (data && data.length > 0) {
          const shipment = data[0]
          setResult({
            ref: shipment.tracking_number || 'N/A',
            mark: shipment.shipping_mark || key,
            status: shipment.status || 'Unknown',
            mode: shipment.mode || 'Unknown',
            eta: shipment.eta || 'TBD',
            stages: shipment.stages || [],
          })
        } else {
          setNotFound(true)
        }
      }
    } catch (err) {
      console.error('Tracking error:', err)
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
          {loading ? (
            <PackageSearch className="size-4 animate-spin" />
          ) : (
            <PackageSearch className="size-4" />
          )}
          {loading ? 'Tracking...' : 'Track'}
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
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Shipping Mark</p>
              <p className="font-medium text-foreground">{result.mark}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Mode</p>
              <p className="font-medium text-foreground">{result.mode}</p>
            </div>
            <div>
              <p className="text-muted-foreground">ETA</p>
              <p className="font-medium text-foreground">{result.eta}</p>
            </div>
          </div>

          <ol className="mt-5 space-y-3">
            {result.stages.map((stage) => (
              <li key={stage.label} className="flex items-center gap-3">
                {stage.done ? (
                  <CheckCircle2 className="size-5 shrink-0 text-primary" />
                ) : (
                  <Circle className="size-5 shrink-0 text-muted-foreground/50" />
                )}
                <span
                  className={
                    stage.done
                      ? "text-sm font-medium text-foreground"
                      : "text-sm text-muted-foreground"
                  }
                >
                  {stage.label}
                </span>
              </li>
            ))}
          </ol>
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
            Track by your AfruHeritage tracking number or by your shipping mark / name.
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
            Demo data — try <span className="font-mono">AFR-AMO-04A3302D82</span> or{" "}
            <span className="font-mono">AGYIRIGO</span>.
          </p>
        </div>
      </div>
    </section>
  )
}
