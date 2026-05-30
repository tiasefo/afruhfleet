"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react"

export default function VendorActionsDashboardPage() {
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/admin/vendors?status=pending&page=1&page_size=50')
      setVendors(data.items || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load vendor actions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const approve = async (id: string) => {
    try {
      await api.post(`/admin/vendors/${id}/review`, { action: 'approve' })
      toast.success('Vendor approved')
      load()
    } catch (e: any) {
      toast.error(e.message || 'Failed to approve vendor')
    }
  }

  const reject = async (id: string) => {
    const reason = prompt('Enter rejection reason') || ''
    if (!reason.trim()) return
    try {
      await api.post(`/admin/vendors/${id}/review`, { action: 'reject', rejection_reason: reason })
      toast.success('Vendor rejected')
      load()
    } catch (e: any) {
      toast.error(e.message || 'Failed to reject vendor')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vendor Actions</h1>
          <p className="mt-1 text-muted-foreground">Approve or reject pending vendor applications</p>
        </div>
        <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : vendors.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No pending vendor actions</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {vendors.map((v: any) => (
            <Card key={v.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold">{v.full_name}</div>
                  <div className="text-sm text-muted-foreground">{v.email} · {v.business_type}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{v.status}</Badge>
                  <Button size="sm" onClick={() => approve(v.id)}>
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => reject(v.id)}>
                    <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
