"use client"

import { useEffect, useState } from "react"
import { getApiBaseUrl, joinApiUrl } from "@/lib/api"

export function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const apiBaseUrl = getApiBaseUrl()

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError("")
      try {
        if (!apiBaseUrl) {
          throw new Error("API base URL missing. Set NEXT_PUBLIC_API_BASE_URL.")
        }

        const res = await fetch(joinApiUrl(apiBaseUrl, "/analytics/admin/summary"))
        if (!res.ok) throw new Error(await res.text())
        setData(await res.json())
      } catch (err: any) {
        setError(err.message || "Failed to load analytics")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [apiBaseUrl])

  if (loading) return <div>Loading analytics...</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!data) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-8">
      <StatCard label="Tenants" value={data.tenants} />
      <StatCard label="Users" value={data.users} />
      <StatCard label="KYC Submissions" value={data.kyc_total} />
      <StatCard label="KYC Approved" value={data.kyc_approved} />
      <StatCard label="Shipments" value={data.shipments} />
      <StatCard label="Payments" value={data.payments} />
      <StatCard label="Revenue" value={data.revenue} prefix="$" />
    </div>
  )
}

function StatCard({ label, value, prefix = "" }: { label: string; value: any; prefix?: string }) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow text-center">
      <div className="text-2xl font-bold text-primary mb-2">{prefix}{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}
