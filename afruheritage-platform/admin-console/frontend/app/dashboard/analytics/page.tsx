"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Building2, DollarSign, Loader2, Package, RefreshCw, ShieldCheck, Users } from "lucide-react"

type AnalyticsSummary = {
  tenants: number
  users: number
  kyc_total: number
  kyc_approved: number
  shipments: number
  payments: number
  revenue: number
}

export default function AnalyticsDashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSummary = async () => {
    setLoading(true)
    try {
      // Load analytics from dashboard API
      const data = await api.get<AnalyticsSummary>("/admin/dashboard/stats")
      setSummary(data)
    } catch (e: any) {
      toast.error("Failed to load analytics: " + (e.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="mt-1 text-muted-foreground">Platform metrics overview</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadSummary}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Tenants" value={summary?.tenants ?? 0} icon={Building2} />
          <MetricCard title="Users" value={summary?.users ?? 0} icon={Users} />
          <MetricCard title="Shipments" value={summary?.shipments ?? 0} icon={Package} />
          <MetricCard title="Payments" value={summary?.payments ?? 0} icon={DollarSign} />
          <MetricCard title="Revenue" value={`GHS ${summary?.revenue ?? 0}`} icon={DollarSign} />
          <MetricCard title="KYC Total" value={summary?.kyc_total ?? 0} icon={ShieldCheck} />
          <MetricCard title="KYC Approved" value={summary?.kyc_approved ?? 0} icon={ShieldCheck} />
        </div>
      )}
    </div>
  )
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: any }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="text-2xl font-bold">{value}</div>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardContent>
    </Card>
  )
}
