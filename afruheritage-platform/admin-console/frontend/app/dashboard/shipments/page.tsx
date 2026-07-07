'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { BackButton } from '@/components/back-button'
import {
  Truck,
  Search,
  RefreshCw,
  MapPin,
  Route,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Edit,
  Ban,
  MoreHorizontal,
} from 'lucide-react'

interface Shipment {
  id: string
  tracking_number: string
  tenant_id: string
  tenant_name?: string
  origin: string
  destination: string
  status: string
  priority: string
  created_at: string
  updated_at: string
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tenantFilter, setTenantFilter] = useState('')
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [rerouteDialogOpen, setRerouteDialogOpen] = useState(false)
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false)

  const [updateForm, setUpdateForm] = useState({ status: '', notes: '', priority: '' })
  const [rerouteForm, setRerouteForm] = useState({ new_destination: '', reason: '' })
  const [notesForm, setNotesForm] = useState({ notes: '', internal: false })

  const loadShipments = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (statusFilter) params.status = statusFilter
      if (tenantFilter) params.tenant_id = tenantFilter
      if (searchQuery) params.q = searchQuery

      const response = await api.get('/admin/shipments', { params })
      setShipments(response.items || response)
    } catch (error) {
      toast.error('Failed to load shipments')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadShipments()
  }, [statusFilter, tenantFilter])

  const handleUpdateShipment = async () => {
    if (!selectedShipment) return
    try {
      await api.patch(`/admin/shipments/${selectedShipment.id}`, updateForm)
      toast.success('Shipment updated successfully')
      setUpdateDialogOpen(false)
      loadShipments()
    } catch (error) {
      toast.error('Failed to update shipment')
    }
  }

  const handleRerouteShipment = async () => {
    if (!selectedShipment) return
    try {
      await api.post(`/admin/shipments/${selectedShipment.id}/reroute`, rerouteForm)
      toast.success('Shipment rerouted successfully')
      setRerouteDialogOpen(false)
      loadShipments()
    } catch (error) {
      toast.error('Failed to reroute shipment')
    }
  }

  const handleCancelShipment = async () => {
    if (!selectedShipment) return
    if (!confirm('Are you sure you want to cancel this shipment?')) return
    try {
      await api.post(`/admin/shipments/${selectedShipment.id}/cancel`)
      toast.success('Shipment cancelled successfully')
      loadShipments()
    } catch (error) {
      toast.error('Failed to cancel shipment')
    }
  }

  const handleAddNotes = async () => {
    if (!selectedShipment) return
    try {
      await api.post(`/admin/shipments/${selectedShipment.id}/notes`, notesForm)
      toast.success('Notes added successfully')
      setNotesDialogOpen(false)
      loadShipments()
    } catch (error) {
      toast.error('Failed to add notes')
    }
  }

  const handleViewTracking = async () => {
    if (!selectedShipment) return
    try {
      const tracking = await api.get(`/admin/shipments/${selectedShipment.id}/tracking`)
      setSelectedShipment({ ...selectedShipment, tracking })
      setTrackingDialogOpen(true)
    } catch (error) {
      toast.error('Failed to load tracking history')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; icon: any }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_transit: { color: 'bg-blue-100 text-blue-800', icon: Truck },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
      delayed: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
    }
    const config = statusMap[status] || { color: 'bg-gray-100 text-gray-800', icon: FileText }
    const Icon = config.icon
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-3xl font-bold">Shipment Management</h1>
        </div>
        <Button onClick={loadShipments} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by tracking number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Label>Tenant</Label>
              <Input
                placeholder="Tenant ID"
                value={tenantFilter}
                onChange={(e) => setTenantFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading shipments...</div>
          ) : shipments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No shipments found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {shipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedShipment(shipment)}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{shipment.tracking_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{shipment.tenant_name || shipment.tenant_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {shipment.origin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2">
                        <Route className="w-4 h-4 text-gray-400" />
                        {shipment.destination}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(shipment.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={shipment.priority === 'high' ? 'destructive' : 'secondary'}>
                          {shipment.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(shipment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setUpdateDialogOpen(true); }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setRerouteDialogOpen(true); }}>
                            <Route className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleCancelShipment(); }}>
                            <Ban className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setNotesDialogOpen(true); }}>
                            <FileText className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Shipment</DialogTitle>
            <DialogDescription>Update shipment status and details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select value={updateForm.status} onValueChange={(v) => setUpdateForm({ ...updateForm, status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={updateForm.priority} onValueChange={(v) => setUpdateForm({ ...updateForm, priority: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={updateForm.notes}
                onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                placeholder="Add resolution notes..."
              />
            </div>
            <Button onClick={handleUpdateShipment} className="w-full">Update Shipment</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reroute Dialog */}
      <Dialog open={rerouteDialogOpen} onOpenChange={setRerouteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reroute Shipment</DialogTitle>
            <DialogDescription>Change shipment destination</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Destination</Label>
              <Input
                value={rerouteForm.new_destination}
                onChange={(e) => setRerouteForm({ ...rerouteForm, new_destination: e.target.value })}
                placeholder="Enter new destination"
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea
                value={rerouteForm.reason}
                onChange={(e) => setRerouteForm({ ...rerouteForm, reason: e.target.value })}
                placeholder="Explain why rerouting is necessary..."
              />
            </div>
            <Button onClick={handleRerouteShipment} className="w-full">Reroute Shipment</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Notes</DialogTitle>
            <DialogDescription>Add resolution notes to shipment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Notes</Label>
              <Textarea
                value={notesForm.notes}
                onChange={(e) => setNotesForm({ ...notesForm, notes: e.target.value })}
                placeholder="Enter notes..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="internal"
                checked={notesForm.internal}
                onChange={(e) => setNotesForm({ ...notesForm, internal: e.target.checked })}
              />
              <Label htmlFor="internal">Internal note (not visible to tenant)</Label>
            </div>
            <Button onClick={handleAddNotes} className="w-full">Add Notes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
