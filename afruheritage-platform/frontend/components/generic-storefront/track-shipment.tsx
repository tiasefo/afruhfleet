"use client"

import { useState } from "react"
import { Search, Loader2, Package, CheckCircle, Clock, Truck } from "lucide-react"

interface TrackingResult {
  tracking_number: string
  status: string
  origin_city?: string
  destination_city?: string
  estimated_arrival?: string
  description?: string
}

export function TrackShipment({ primaryColor }: { primaryColor: string }) {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault()
    if (!trackingNumber.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const response = await fetch(
        `/api/v1/shipments/track/${encodeURIComponent(trackingNumber.trim())}`
      )
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.detail || "Shipment not found")
      }
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to track shipment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-200">
      <h2 className="text-lg font-semibold text-gray-900">Track Your Shipment</h2>
      <p className="mt-1 text-sm text-gray-500">
        Enter your tracking number to see real-time status
      </p>
      <form onSubmit={handleTrack} className="mt-4 flex gap-2">
        <input
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="e.g. AMK-2024-00123"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
        />
        <button
          type="submit"
          disabled={loading || !trackingNumber.trim()}
          className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Track
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-400" />
              <span className="font-medium text-gray-900">{result.tracking_number}</span>
            </div>
            <StatusBadge status={result.status} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            {result.origin_city && (
              <div>
                <span className="text-gray-500">From:</span>{" "}
                <span className="font-medium text-gray-900">{result.origin_city}</span>
              </div>
            )}
            {result.destination_city && (
              <div>
                <span className="text-gray-500">To:</span>{" "}
                <span className="font-medium text-gray-900">{result.destination_city}</span>
              </div>
            )}
            {result.estimated_arrival && (
              <div>
                <span className="text-gray-500">ETA:</span>{" "}
                <span className="font-medium text-gray-900">{result.estimated_arrival}</span>
              </div>
            )}
            {result.description && (
              <div className="col-span-2">
                <span className="text-gray-500">Description:</span>{" "}
                <span className="font-medium text-gray-900">{result.description}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
    delivered: { icon: CheckCircle, color: "text-green-700", bg: "bg-green-100" },
    in_transit: { icon: Truck, color: "text-blue-700", bg: "bg-blue-100" },
    pending: { icon: Clock, color: "text-amber-700", bg: "bg-amber-100" },
  }
  const c = config[status?.toLowerCase()] || config.pending
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${c.bg} ${c.color}`}>
      <Icon className="h-3 w-3" />
      {status?.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()) || "Unknown"}
    </span>
  )
}
