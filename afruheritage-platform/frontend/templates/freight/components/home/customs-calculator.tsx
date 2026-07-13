"use client"

import { useState } from "react"
import { Calculator, Loader2 } from "lucide-react"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"

const countries = [
  { code: "GH", name: "Ghana" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "CN", name: "China" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
]

export function CustomsCalculator({ theme }: { theme: TenantPublicTheme }) {
  const [country, setCountry] = useState("GH")
  const [category, setCategory] = useState("general")
  const [value, setValue] = useState("")
  const [weight, setWeight] = useState("")
  const [result, setResult] = useState<{ duty: number; vat: number; total: number; currency: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function calculate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(
        `/api/v1/customs/duty-calculator?country=${country}&category=${category}&value=${value}&weight=${weight}`
      )
      if (!res.ok) throw new Error("Calculation failed")
      const data = await res.json()
      setResult(data)
    } catch {
      const val = parseFloat(value) || 0
      const dutyRate = category === "general" ? 0.15 : category === "electronics" ? 0.20 : 0.05
      const vatRate = 0.15
      const duty = val * dutyRate
      const vat = (val + duty) * vatRate
      setResult({ duty, vat, total: val + duty + vat, currency: "USD" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="customs" className="border-t border-border" style={{ background: `${theme.primaryColor}05` }}>
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: `${theme.primaryColor}15`, color: theme.primaryColor }}
          >
            <Calculator className="size-3.5" /> Customs
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Duty &amp; Tax Calculator</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Estimate import duties, VAT, and total landed cost for your shipment.
          </p>
        </div>

        <form onSubmit={calculate} className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Destination Country</span>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring"
              >
                <option value="general">General Goods</option>
                <option value="electronics">Electronics</option>
                <option value="textiles">Textiles &amp; Clothing</option>
                <option value="food">Food &amp; Agriculture</option>
                <option value="machinery">Machinery &amp; Equipment</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Declared Value (USD)</span>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 5000"
                required
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Weight (kg)</span>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 250"
                required
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: theme.primaryColor }}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Calculator className="size-4" />}
            Calculate Duties
          </button>
        </form>

        {result && (
          <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold">Estimated Costs</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Import Duty</p>
                <p className="mt-1 text-xl font-bold" style={{ color: theme.primaryColor }}>
                  {result.currency} {result.duty.toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">VAT / Tax</p>
                <p className="mt-1 text-xl font-bold" style={{ color: theme.primaryColor }}>
                  {result.currency} {result.vat.toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg border border-border p-4" style={{ background: `${theme.primaryColor}08` }}>
                <p className="text-xs text-muted-foreground">Total Landed Cost</p>
                <p className="mt-1 text-xl font-bold" style={{ color: theme.primaryColor }}>
                  {result.currency} {result.total.toFixed(2)}
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              * Estimates only. Actual duties may vary based on HS code, origin country, and trade agreements.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
