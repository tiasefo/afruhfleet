"use client"

import { useMemo, useState, useEffect } from "react"
import { Calculator, Ship, Plane, MessageCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { waLink, whatsapp } from "@/lib/amooksco"
import { api } from "@/lib/api"

type Mode = "sea" | "air"

// Indicative default rates (USD). These are editable estimates only — the
// billing team confirms the final, current rate before payment.
const DEFAULT_RATE = { sea: 230, air: 12 }

function Field({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  suffix: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center rounded-lg border border-border bg-background focus-within:border-accent">
        <input
          type="number"
          min="0"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent px-3 py-2 text-sm text-foreground outline-none"
        />
        <span className="px-3 text-xs text-muted-foreground">{suffix}</span>
      </div>
    </label>
  )
}

export function Estimator() {
  const [mode, setMode] = useState<Mode>("sea")
  const [length, setLength] = useState("")
  const [width, setWidth] = useState("")
  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")
  const [rate, setRate] = useState(String(DEFAULT_RATE.sea))
  const [loadingRates, setLoadingRates] = useState(false)

  // Fetch current rates from API on mount
  useEffect(() => {
    async function fetchRates() {
      setLoadingRates(true)
      try {
        const rates = await api.get('/customs/rates')
        if (rates) {
          if (rates.sea_rate) setRate(String(rates.sea_rate))
          if (rates.air_rate) setRate(String(rates.air_rate))
        }
      } catch (err) {
        console.error('Failed to fetch rates:', err)
        // Keep default rates on error
      } finally {
        setLoadingRates(false)
      }
    }
    fetchRates()
  }, [])

  function switchMode(next: Mode) {
    setMode(next)
    setRate(String(DEFAULT_RATE[next]))
  }

  const cbm = useMemo(() => {
    const l = Number(length) || 0
    const w = Number(width) || 0
    const h = Number(height) || 0
    return (l * w * h) / 1_000_000 // cm³ -> m³
  }, [length, width, height])

  const quantity = mode === "sea" ? cbm : Number(weight) || 0
  const estimate = quantity * (Number(rate) || 0)

  return (
    <section id="estimate" className="scroll-mt-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-accent-foreground">
            <Calculator className="size-4 text-accent" /> Shipping Estimate
          </span>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground">
            Estimate Your Shipping Cost
          </h2>
          <p className="mt-3 text-muted-foreground">
            Sea cargo is charged by volume (CBM); air cargo by weight (kg). Get a quick
            indicative estimate, then confirm the live rate with our team.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-sm">
          {/* mode toggle */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => switchMode("sea")}
              className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                mode === "sea"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Ship className="size-4" /> Sea Cargo
            </button>
            <button
              type="button"
              onClick={() => switchMode("air")}
              className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                mode === "air"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Plane className="size-4" /> Air Cargo
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="grid gap-4">
              {mode === "sea" ? (
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Length" value={length} onChange={setLength} suffix="cm" />
                  <Field label="Width" value={width} onChange={setWidth} suffix="cm" />
                  <Field label="Height" value={height} onChange={setHeight} suffix="cm" />
                </div>
              ) : (
                <Field label="Total weight" value={weight} onChange={setWeight} suffix="kg" />
              )}
              <Field
                label={mode === "sea" ? "Rate per CBM (USD)" : "Rate per kg (USD)"}
                value={rate}
                onChange={setRate}
                suffix="USD"
              />
            </div>

            {/* result */}
            <div className="flex flex-col justify-between rounded-xl bg-primary p-5 text-primary-foreground">
              <div>
                {mode === "sea" && (
                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="text-sm text-primary-foreground/70">Volume</span>
                    <span className="font-mono text-lg font-semibold">
                      {cbm.toFixed(3)} CBM
                    </span>
                  </div>
                )}
                <span className="text-sm text-primary-foreground/70">
                  Estimated cost
                </span>
                <p className="mt-1 text-3xl font-bold">
                  ${estimate.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
              <Button
                asChild
                className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <a
                  href={waLink(
                    whatsapp.tracking,
                    `Hello AMOOKSCO, I'd like a ${mode === "sea" ? "sea" : "air"} cargo quote. My estimate was about $${estimate.toFixed(0)}.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="size-4" />
                  Confirm Rate on WhatsApp
                </a>
              </Button>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-3 text-xs text-foreground">
            <Info className="size-4 shrink-0 text-accent" />
            <span>
              This is an indicative estimate only. Final charges depend on the goods type,
              current rates and any special handling. Always confirm with our billing team.
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
