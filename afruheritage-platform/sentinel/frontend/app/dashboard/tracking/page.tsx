"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { MapPin, Search } from "lucide-react"

export default function TrackingDashboardPage() {
  const [tenantId, setTenantId] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any | null>(null)

  const lookup = async () => {
    if (!tenantId || !trackingNumber) return
    setLoading(true)
    setResult(null)
    try {
      const data = await api.get(`/sentinel/tracking/public?tenant_id=${encodeURIComponent(tenantId)}&tracking_number=${encodeURIComponent(trackingNumber)}`)
      setResult(data)
    } catch (e: any) {
      toast.error(e.message || "Tracking lookup failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tracking Overview</h1>
        <p className="mt-1 text-muted-foreground">Search public shipment tracking as admin support</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tracking Lookup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Tenant UUID" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
            <Input placeholder="Tracking number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
          </div>
          <Button onClick={lookup} disabled={loading || !tenantId || !trackingNumber}>
            <Search className="mr-2 h-4 w-4" />
            {loading ? "Searching..." : "Search"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {result.tracking_number}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge>{result.status}</Badge>
              <Badge variant="outline">{result.payment_status}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {result.origin_city}, {result.origin_country} → {result.destination_city}, {result.destination_country}
            </div>
            <div className="space-y-2">
              <p className="font-medium">Events</p>
              {(result.events || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No events</p>
              ) : (
                <div className="space-y-2">
                  {result.events.map((e: any) => (
                    <div key={e.id} className="rounded border p-2 text-sm">
                      <div className="font-medium">{e.event_type}</div>
                      <div className="text-muted-foreground">{e.location || "-"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
