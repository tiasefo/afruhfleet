'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  Truck,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Ban,
  Eye,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Car,
  Bike,
} from 'lucide-react'

const vehicleIcons: Record<string, any> = {
  truck: Truck,
  car: Car,
  motorbike: Bike,
  bicycle: Bike,
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('q', search)
      const data = await api.get(`/admin/vendors?${params.toString()}`)
      setVendors(data.items || [])
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter])

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/admin/vendors/${id}/review`, { action: 'approve' })
      toast.success('Vendor approved')
      load()
      setDetailOpen(false)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    try {
      await api.post(`/admin/vendors/${rejectTarget}/review`, { action: 'reject', rejection_reason: rejectReason })
      toast.success('Vendor rejected')
      setRejectOpen(false)
      setRejectReason('')
      setRejectTarget(null)
      load()
      setDetailOpen(false)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleSuspend = async (id: string) => {
    try {
      await api.post(`/admin/vendors/${id}/suspend`)
      toast.success('Vendor suspended')
      load()
      setDetailOpen(false)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const openDetail = async (id: string) => {
    try {
      const data = await api.get(`/admin/vendors/${id}`)
      setSelectedVendor(data)
      setDetailOpen(true)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      case 'under_review': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'suspended': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default: return ''
    }
  }

  const statuses = ['', 'pending', 'under_review', 'approved', 'rejected', 'suspended']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Delivery Vendors</h1>
        <p className="mt-1 text-muted-foreground">Review and manage vendor applications</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <Button key={s || 'all'} size="sm" variant={statusFilter === s ? 'default' : 'outline'} onClick={() => setStatusFilter(s)}>
              {s || 'All'}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : vendors.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No vendors found</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {vendors.map((v: any) => (
            <Card key={v.id} className="cursor-pointer transition-colors hover:border-primary/30" onClick={() => openDetail(v.id)}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{v.full_name}</div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{v.email}</span>
                      <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{v.business_type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(v.vehicle_types || v.vehicles?.map((vh: any) => vh.vehicle_type) || []).map((vt: string) => {
                    const Icon = vehicleIcons[vt] || Truck
                    return <Icon key={vt} className="h-4 w-4 text-muted-foreground" title={vt} />
                  })}
                  <Badge className={statusColor(v.status)}>{v.status}</Badge>
                  <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Vendor Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
            <DialogDescription>Review vendor application</DialogDescription>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold">{selectedVendor.full_name}</div>
                  <Badge className={`mt-1 ${statusColor(selectedVendor.status)}`}>{selectedVendor.status}</Badge>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div>Rating: {selectedVendor.average_rating}/5</div>
                  <div>{selectedVendor.total_deliveries} deliveries</div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{selectedVendor.email}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{selectedVendor.phone}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">ID</Label>
                  <div>{selectedVendor.id_type}: {selectedVendor.id_number}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Business</Label>
                  <div>{selectedVendor.business_name || 'N/A'} ({selectedVendor.business_type})</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Experience</Label>
                  <div>{selectedVendor.years_experience || 'N/A'} years</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Operating Regions</Label>
                <div className="flex flex-wrap gap-1">
                  {(selectedVendor.operating_regions || []).map((r: string) => (
                    <Badge key={r} variant="outline" className="text-xs"><MapPin className="mr-1 h-3 w-3" />{r}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Vehicles</Label>
                <div className="space-y-2">
                  {(selectedVendor.vehicles || []).map((vh: any) => (
                    <div key={vh.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium capitalize">{vh.vehicle_type}</span>
                        <span className="ml-2 text-sm text-muted-foreground">{vh.registration_number}</span>
                        {vh.make_model && <span className="ml-2 text-sm text-muted-foreground">&middot; {vh.make_model}</span>}
                        {vh.year && <span className="ml-1 text-sm text-muted-foreground">({vh.year})</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Agreements</Label>
                <div className="flex gap-3 text-sm">
                  <span>Terms: {selectedVendor.terms_accepted ? '✓' : '✗'}</span>
                  <span>Insurance: {selectedVendor.insurance_accepted ? '✓' : '✗'}</span>
                  <span>Background: {selectedVendor.background_check_accepted ? '✓' : '✗'}</span>
                </div>
              </div>

              {selectedVendor.rejection_reason && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                  <strong>Rejection Reason:</strong> {selectedVendor.rejection_reason}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {(selectedVendor.status === 'pending' || selectedVendor.status === 'under_review') && (
                  <>
                    <Button onClick={() => handleApprove(selectedVendor.id)} className="flex-1">
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                    </Button>
                    <Button variant="destructive" onClick={() => { setRejectTarget(selectedVendor.id); setRejectOpen(true) }} className="flex-1">
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  </>
                )}
                {selectedVendor.status === 'approved' && (
                  <Button variant="destructive" onClick={() => handleSuspend(selectedVendor.id)} className="flex-1">
                    <Ban className="mr-2 h-4 w-4" /> Suspend
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Vendor</DialogTitle>
            <DialogDescription>Provide a reason for rejection</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea placeholder="Reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} />
            <Button variant="destructive" className="w-full" onClick={handleReject} disabled={!rejectReason.trim()}>
              Confirm Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
