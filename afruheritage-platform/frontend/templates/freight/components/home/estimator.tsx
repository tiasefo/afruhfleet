"use client"

import { useState } from "react"
import { Calculator, Ship, Plane, MessageCircle, Info } from "lucide-react"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"
import { waLink } from "@/lib/utils"

const iconMap: Record<string, any> = { sea: Ship, air: Plane }

const defaultModes = [
  { id: "sea", label: "Sea Cargo", rate: 230, unit: "USD/CBM" },
  { id: "air", label: "Air Cargo", rate: 12, unit: "USD/kg" },
]

export function Estimator({ theme }: { theme: TenantPublicTheme }) {
  const cfg = theme.storefrontConfig
  const estCfg = cfg?.estimator
  const modes = estCfg?.modes?.length ? estCfg.modes : defaultModes
  const currency = estCfg?.currency || "USD"
  const waNumber = estCfg?.whatsapp_number || cfg?.whatsapp?.tracking || cfg?.contacts?.tracking?.whatsapp || ""

  const [modeId, setModeId] = useState(modes[0]?.id || "sea")
  const [quantity, setQuantity] = useState("")
  const [estimate, setEstimate] = useState<number | null>(null)

  const mode = modes.find(m => m.id === modeId) || modes[0]
  const Icon = iconMap[mode?.id || "sea"] || Calculator

  function calculate() {
    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0 || !mode?.rate) return
    setEstimate(qty * mode.rate)
  }

  const waText = estCfg?.whatsapp_text
    ? estCfg.whatsapp_text.replace("{mode}", mode?.label || "").replace("{estimate}", estimate?.toFixed(0) || "")
    : `Hello ${theme.name}, I'd like a ${mode?.label || "shipping"} quote. My estimate was about ${currency} ${estimate?.toFixed(0) || ""}.`

  return (
    <section id="estimator" className="border-b border-border" style={{ background: `${theme.primaryColor}05` }}>
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: `${theme.primaryColor}15`, color: theme.primaryColor }}>
            <Calculator className="size-3.5" /> Cost Estimator
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Estimate Your Shipping Cost</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Get an indicative estimate. Final pricing is confirmed by our billing team.
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {modes.map((m) => {
              const MIcon = iconMap[m.id || ""] || Calculator
              return (
                <button
                  key={m.id}
                  onClick={() => { setModeId(m.id || ""); setEstimate(null) }}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    modeId === m.id ? 'text-white' : 'border border-border text-muted-foreground hover:bg-muted'
                  }`}
                  style={modeId === m.id ? { background: theme.primaryColor } : undefined}
                >
                  <MIcon className="size-4" /> {m.label}
                </button>
              )
            })}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                {mode?.id === 'air' ? 'Weight (kg)' : 'Volume (CBM)'}
              </span>
              <div className="flex items-center rounded-lg border border-input bg-background focus-within:border-ring">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={mode?.id === 'air' ? 'e.g. 25' : 'e.g. 2'}
                  className="flex-1 bg-transparent px-4 py-3 text-sm outline-none"
                />
                <span className="px-3 text-xs text-muted-foreground">{mode?.unit?.split('/')[1] || ''}</span>
              </div>
            </label>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Rate</span>
              <div className="flex items-center rounded-lg border border-border bg-muted/30 px-4 py-3">
                <span className="text-sm font-semibold">{currency} {mode?.rate} {mode?.unit}</span>
              </div>
            </div>
          </div>

          <button
            onClick={calculate}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: theme.primaryColor }}
          >
            <Calculator className="size-4" /> Calculate Estimate
          </button>

          {estimate !== null && (
            <div className="mt-6 rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Estimated Cost</p>
                  <p className="text-2xl font-bold" style={{ color: theme.primaryColor }}>
                    {currency} {estimate.toFixed(2)}
                  </p>
                </div>
                {waNumber && (
                  <a
                    href={waLink(waNumber, waText)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{ background: theme.accentColor, color: theme.primaryColor }}
                  >
                    <MessageCircle className="size-4" /> Get Exact Quote
                  </a>
                )}
              </div>
              <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="size-3.5 shrink-0 mt-0.5" />
                <span>This is an indicative estimate only. Final pricing depends on current rates, cargo type, and destination. Contact us for an exact quote.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
