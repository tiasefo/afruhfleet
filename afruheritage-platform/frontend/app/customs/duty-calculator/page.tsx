'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function DutyCalculatorPage() {
  const [mode, setMode] = useState<'vin' | 'manual'>('vin')
  const [form, setForm] = useState({
    country: 'GH',
    commodity_type: 'vehicle',
    cif_value: '',
    vin: '',
    make: '',
    model: '',
    vehicle_year: '',
    engine_cc: '',
    fuel_type: '',
    vehicle_type: '',
    hs_code: '',
    description: '',
    quantity: '',
    weight_kg: '',
  })

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const decodeVin = async () => {
    setError('')
    setResult(null)

    if (!form.vin.trim()) {
      setError('Enter a VIN first.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/v1/customs/vin-decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin: form.vin }),
      })

      if (!res.ok) throw new Error(await res.text())

      const data = await res.json()
      const vehicle = data.vehicle || {}

      if (!data.valid) {
        setError((data.notes || []).join(' ') || 'VIN is invalid.')
        return
      }

      setForm((prev) => ({
        ...prev,
        vehicle_year: vehicle.year ? String(vehicle.year) : prev.vehicle_year,
        engine_cc: vehicle.engine_cc ? String(vehicle.engine_cc) : prev.engine_cc,
        fuel_type: vehicle.fuel_type || prev.fuel_type,
        vehicle_type: vehicle.body_type || prev.vehicle_type,
      }))

      setResult({
        type: 'vin',
        vehicle,
        confidence: data.confidence,
        notes: data.notes || [],
      })
    } catch (err: any) {
      setError(err?.message || 'VIN lookup failed.')
    } finally {
      setLoading(false)
    }
  }

  const calculate = async () => {
    setError('')
    setResult(null)
    setLoading(true)

    try {
      let url = '/api/v1/customs/calculate'
      const payload: any = {
        country: form.country,
        commodity_type: form.commodity_type,
      }

      if (form.commodity_type === 'vehicle') {
        payload.vin = form.vin || null
        payload.make = form.make || null
        payload.model = form.model || null
        payload.vehicle_year = form.vehicle_year ? Number(form.vehicle_year) : null
        payload.engine_cc = form.engine_cc ? Number(form.engine_cc) : null
        payload.fuel_type = form.fuel_type || null
        payload.vehicle_type = form.vehicle_type || null

        if (form.country === 'GH') {
          url = '/api/v1/customs/ghana/vehicle-duty'
        } else if (form.country === 'KE') {
          url = '/api/v1/customs/kenya/vehicle-duty'
        }
      } else {
        const cif = Number(form.cif_value)
        if (!form.cif_value || Number.isNaN(cif) || cif <= 0) {
          throw new Error('Enter a CIF value greater than 0 for cargo/goods.')
        }

        payload.cif_value = cif
        payload.hs_code = form.hs_code || null
        payload.description = form.description || null
        payload.quantity = form.quantity ? Number(form.quantity) : null
        payload.weight_kg = form.weight_kg ? Number(form.weight_kg) : null

        if (form.country === 'GH') {
          url = '/api/v1/customs/ghana/goods-duty'
        }
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(await res.text())
      setResult(await res.json())
    } catch (err: any) {
      setError(err?.message || 'Calculation failed.')
    } finally {
      setLoading(false)
    }
  }


  const currency = result?.currency || (form.country === 'GH' ? 'GHS' : 'KES')

  retu{/* Back Button */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Link 
            href="/customs"
            className="inline-flex items-center text-sm font-medium text-[#063f4f] hover:text-[#052f3b] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customs
          </Link>
        </div>
      </div>

      rn (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-[#063f4f] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#063f4f] via-[#07586b] to-[#021f2a]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium">
            Customs Clearance
          </div>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
            Customs Duty Calculator
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-white/85">
            Start with a VIN, or enter vehicle and cargo details manually for Ghana and Kenya duty estimates.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded border bg-white p-6 space-y-4">
            <h2 className="text-xl font-semibold">Start Calculation</h2>

            <div>
              <label className="text-sm font-medium">Country</label>
              <select className="mt-1 w-full rounded border p-2" value={form.country} onChange={(e) => update('country', e.target.value)}>
                <option value="GH">Ghana — GHS</option>
                <option value="KE">Kenya — KES</option>
              </select>
            </div>

            {mode === 'vin' && (
              <>
                <div>
                  <label className="text-sm font-medium">VIN Number</label>
                  <input
                    className="mt-1 w-full rounded border p-2"
                    placeholder="Enter VIN"
                    value={form.vin}
                    onChange={(e) => update('vin', e.target.value)}
                  />
                </div>

                <button onClick={decodeVin} disabled={loading} className="w-full rounded bg-black px-4 py-3 text-white disabled:opacity-50">
                  {loading ? 'Decoding...' : 'Decode VIN'}
                </button>

                <button type="button" onClick={() => setMode('manual')} className="w-full rounded border px-4 py-3">
                  Or enter vehicle / cargo details
                </button>
              </>
            )}

            {mode === 'manual' && (
              <>
                <button type="button" onClick={() => setMode('vin')} className="rounded border px-3 py-2">
                  Back to VIN lookup
                </button>

                <div>
                  <label className="text-sm font-medium">Commodity Type</label>
                  <select className="mt-1 w-full rounded border p-2" value={form.commodity_type} onChange={(e) => update('commodity_type', e.target.value)}>
                    <option value="vehicle">Vehicle</option>
                    <option value="cargo">Cargo / Goods</option>
                  </select>
                </div>

                {form.commodity_type !== 'vehicle' && (
                  <div>
                    <label className="text-sm font-medium">CIF / Invoice Value</label>
                    <input className="mt-1 w-full rounded border p-2" value={form.cif_value} onChange={(e) => update('cif_value', e.target.value)} type="number" />
                  </div>
                )}

                {form.commodity_type === 'vehicle' ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <input className="rounded border p-2" placeholder="Make e.g. Toyota" value={form.make} onChange={(e) => update('make', e.target.value)} />
                    <input className="rounded border p-2" placeholder="Model e.g. Auris" value={form.model} onChange={(e) => update('model', e.target.value)} />
                    <input className="rounded border p-2" placeholder="VIN optional" value={form.vin} onChange={(e) => update('vin', e.target.value)} />
                    <input className="rounded border p-2" placeholder="Vehicle Year" value={form.vehicle_year} onChange={(e) => update('vehicle_year', e.target.value)} />
                    <input className="rounded border p-2" placeholder="Engine CC" value={form.engine_cc} onChange={(e) => update('engine_cc', e.target.value)} />
                    <input className="rounded border p-2" placeholder="Fuel Type" value={form.fuel_type} onChange={(e) => update('fuel_type', e.target.value)} />
                    <input className="rounded border p-2 md:col-span-2" placeholder="Vehicle Type" value={form.vehicle_type} onChange={(e) => update('vehicle_type', e.target.value)} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <input className="rounded border p-2" placeholder="HS Code" value={form.hs_code} onChange={(e) => update('hs_code', e.target.value)} />
                    <input className="rounded border p-2" placeholder="Description" value={form.description} onChange={(e) => update('description', e.target.value)} />
                    <input className="rounded border p-2" placeholder="Quantity" value={form.quantity} onChange={(e) => update('quantity', e.target.value)} />
                    <input className="rounded border p-2" placeholder="Weight KG" value={form.weight_kg} onChange={(e) => update('weight_kg', e.target.value)} />
                  </div>
                )}

                <button onClick={calculate} disabled={loading} className="w-full rounded bg-black px-4 py-3 text-white disabled:opacity-50">
                  {loading ? 'Calculating...' : 'Calculate Duty'}
                </button>
              </>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Result</h2>

            {!result ? (
              <p className="mt-4 text-gray-600">Run VIN lookup or duty calculation to see results.</p>
            ) : result.type === 'vin' ? (
              <div className="mt-4 space-y-3">
                <p><b>Make:</b> {result.vehicle?.make || 'Unknown'}</p>
                <p><b>Year:</b> {result.vehicle?.year || 'Unknown'}</p>
                <p><b>Origin:</b> {result.vehicle?.country_of_origin || 'Unknown'}</p>
                <p><b>Confidence:</b> {result.confidence}</p>
                <button onClick={() => setMode('manual')} className="mt-4 rounded bg-black px-4 py-2 text-white">
                  Continue to Duty Calculation
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Customs Value / Tax Base / Tax Base</p>
                    <p className="text-xl font-bold">{result.customs_value_ghs ? 'GHS ' + result.customs_value_ghs.toLocaleString() : currency + ' ' + (result.cif_value || result.cif_usd || 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Estimated Duty / Taxes</p>
                    <p className="text-xl font-bold">{currency} {result.charges_total.toLocaleString()}</p>
                  </div>
                  <div className="rounded bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Value + Duty</p>
                    <p className="text-xl font-bold">{currency} {result.estimated_total_landed_cost.toLocaleString()}</p>
                  </div>
                </div>

                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="p-3">Charge</th>
                      <th className="p-3">Rate</th>
                      <th className="p-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.breakdown.map((line: any) => (
                      <tr key={line.code} className="border-t">
                        <td className="p-3">{line.label}</td>
                        <td className="p-3">{(line.rate * 100).toFixed(2)}%</td>
                        <td className="p-3">{line.currency} {line.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        </div>
      </section>
    </main>
  )
}
