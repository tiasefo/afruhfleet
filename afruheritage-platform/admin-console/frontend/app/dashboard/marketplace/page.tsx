'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { BackButton } from '@/components/back-button'
import {
  Package,
  Search,
  RefreshCw,
  MapPin,
  User,
  Truck,
  Clock,
  XCircle,
  Ban,
  ArrowRight,
} from 'lucide-react'

export default function MarketplaceAdminPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedJob, setSelectedJob] = useState<any | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [reassignOpen, setReassignOpen] = useState(false)
  const [eligibleDrivers, setEligibleDrivers] = useState<any[]>([])
  const [selectedDriver, setSelectedDriver] = useState<string>('')
  const [reassigning, setReassigning] = useState(false)

  const loadJobs = async () => {
    setLoading(true)
    try {
      const data = await api.get('/admin/marketplace/jobs')
      setJobs(Array.isArray(data.jobs) ? data.jobs : [])
    } catch (e: any) {
      toast.error('Failed to load marketplace jobs: ' + (e.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadJobs() }, [])

  const handleCancel = async (jobId: string) => {
    try {
      await api.post(`/admin/marketplace/jobs/${jobId}/cancel`)
      toast.success('Job cancelled successfully')
      loadJobs()
      setDetailOpen(false)
    } catch (e: any) {
      toast.error('Failed to cancel job: ' + (e.message || 'Unknown error'))
    }
  }

  const handleReassign = async () => {
    if (!selectedJob || !selectedDriver) return
    setReassigning(true)
    try {
      await api.post(`/admin/marketplace/jobs/${selectedJob.id}/reassign/${selectedDriver}`)
      toast.success('Job reassigned successfully')
      setReassignOpen(false)
      setSelectedDriver('')
      loadJobs()
      setDetailOpen(false)
    } catch (e: any) {
      toast.error('Failed to reassign job: ' + (e.message || 'Unknown error'))
    } finally {
      setReassigning(false)
    }
  }

  const openReassignDialog = async (job: any) => {
    setSelectedJob(job)
    setReassignOpen(true)
    try {
      const data = await api.get(`/admin/marketplace/jobs/${job.id}/eligible-drivers`)
      setEligibleDrivers(Array.isArray(data.eligible_drivers) ? data.eligible_drivers : [])
    } catch (e: any) {
      toast.error('Failed to load eligible drivers: ' + (e.message || 'Unknown error'))
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-blue-100 text-blue-800',
    in_transit: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const filteredJobs = jobs.filter(job => {
    if (statusFilter && job.status !== statusFilter) return false
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        job.id?.toLowerCase().includes(searchLower) ||
        job.origin?.toLowerCase().includes(searchLower) ||
        job.destination?.toLowerCase().includes(searchLower) ||
        job.assigned_driver_name?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketplace Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">Manage marketplace shipment jobs and driver assignments</p>
        </div>
        <Button onClick={loadJobs} disabled={loading}>
          {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search jobs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No marketplace jobs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedJob(job); setDetailOpen(true) }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-medium">{job.id}</span>
                      <Badge className={statusColors[job.status] || 'bg-gray-100 text-gray-800'}>
                        {job.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{job.origin}</span>
                      <ArrowRight className="h-4 w-4" />
                      <span>{job.destination}</span>
                    </div>
                    {job.assigned_driver_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <User className="h-4 w-4" />
                        <span>{job.assigned_driver_name}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {job.price && (
                      <p className="font-bold text-lg">{job.price}</p>
                    )}
                    {job.created_at && (
                      <p className="text-xs text-gray-500">
                        {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Job Detail Dialog */}
      {selectedJob && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Job Details: {selectedJob.id}</DialogTitle>
              <DialogDescription>View and manage marketplace job assignment</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Origin</Label>
                  <p className="font-medium">{selectedJob.origin}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Destination</Label>
                  <p className="font-medium">{selectedJob.destination}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Status</Label>
                  <Badge className={statusColors[selectedJob.status] || 'bg-gray-100 text-gray-800'}>
                    {selectedJob.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Price</Label>
                  <p className="font-medium">{selectedJob.price || '—'}</p>
                </div>
                {selectedJob.assigned_driver_name && (
                  <div>
                    <Label className="text-sm text-gray-500">Assigned Driver</Label>
                    <p className="font-medium">{selectedJob.assigned_driver_name}</p>
                  </div>
                )}
                {selectedJob.created_at && (
                  <div>
                    <Label className="text-sm text-gray-500">Created</Label>
                    <p className="font-medium">{new Date(selectedJob.created_at).toLocaleString()}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t">
                {selectedJob.status !== 'cancelled' && selectedJob.status !== 'delivered' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => openReassignDialog(selectedJob)}
                      className="flex-1"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Reassign Driver
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleCancel(selectedJob.id)}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Job
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Reassign Driver Dialog */}
      <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Driver</DialogTitle>
            <DialogDescription>Select a new driver for job {selectedJob?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Driver</Label>
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a driver" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleDrivers.map((driver) => (
                    <SelectItem key={driver.driver_id} value={driver.driver_id}>
                      {driver.driver_name} ({driver.vendor_name}) - {driver.vehicle_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedDriver && (
              <div className="bg-gray-50 p-3 rounded-lg">
                {(() => {
                  const driver = eligibleDrivers.find(d => d.driver_id === selectedDriver)
                  if (!driver) return null
                  return (
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Vendor:</span> {driver.vendor_name}</p>
                      <p><span className="font-medium">Vehicle:</span> {driver.vehicle_type}</p>
                      <p><span className="font-medium">Region:</span> {driver.region}</p>
                      <p><span className="font-medium">Rating:</span> {driver.rating}/5</p>
                    </div>
                  )
                })()}
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setReassignOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleReassign} disabled={!selectedDriver || reassigning} className="flex-1">
                {reassigning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Truck className="h-4 w-4 mr-2" />}
                Reassign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
