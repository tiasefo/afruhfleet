"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { BackButton } from '@/components/back-button'
import { RefreshCw, Search, Ticket } from "lucide-react"

const statuses = ["open", "pending", "waiting_customer", "resolved", "closed"]

export default function TicketsDashboardPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("q", search)
      if (statusFilter !== "all") params.set("status", statusFilter)
      const data = await api.get(`/admin/tickets?${params.toString()}`)
      setTickets(Array.isArray(data) ? data : (data.items || []))
    } catch (e: any) {
      toast.error(e.message || "Failed to load tickets")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [statusFilter])

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/tickets/${id}/status?status=${encodeURIComponent(status)}`)
      toast.success("Ticket status updated")
      load()
    } catch (e: any) {
      toast.error(e.message || "Failed to update ticket")
    }
  }

  return (
  <>
    <BackButton />
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Support Tickets</h1>
        <p className="mt-1 text-muted-foreground">Review and update ticket statuses</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tickets.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No tickets found</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t: any) => (
            <Card key={t.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold flex items-center gap-2"><Ticket className="h-4 w-4" />{t.subject}</div>
                    <div className="text-sm text-muted-foreground">{t.public_submitter_email || t.public_submitter_name || 'Unknown submitter'}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Tenant: {t.tenant_id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{t.priority}</Badge>
                    <Badge>{t.status}</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                <div className="flex flex-wrap gap-2">
                  {statuses.filter((s) => s !== t.status).map((s) => (
                    <Button key={s} size="sm" variant="outline" onClick={() => updateStatus(t.id, s)}>{s}</Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </>
  )
}
