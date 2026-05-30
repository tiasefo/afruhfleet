'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useBranding } from '@/hooks/useBranding'
import { useTranslation } from '@/hooks/useTranslation'
import { shipmentsAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  DollarSign, 
  Plus, 
  Edit, 
  Activity,
  Package,
  User,
  Calendar,
  FileText,
  AlertCircle
} from 'lucide-react'

export default function ShipmentDetailPage({ params }: { params: { id: string } }) {
    // Status transition loading state
    const [isTransitioning, setIsTransitioning] = useState(false)

    // Helper for status transitions
    const handleStatusTransition = async (nextStatus: string) => {
      setIsTransitioning(true)
      try {
        await shipmentsAPI.transitionStatus(params.id, nextStatus)
        await loadShipment()
      } catch (err) {
        alert('Failed to update status')
        console.error('Status transition error:', err)
      } finally {
        setIsTransitioning(false)
      }
    }
  const { user } = useAuth()
  const { branding } = useBranding()
  const { t } = useTranslation()
  const router = useRouter()
  
  const [showEventModal, setShowEventModal] = useState(false)
  const [newEvent, setNewEvent] = useState({
    event_type: '',
    location: '',
    description: '',
  })
  const [shipment, setShipment] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingEvent, setIsAddingEvent] = useState(false)
  const [locationLabel, setLocationLabel] = useState('')
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null)

  // Fetch shipment details
  const loadShipment = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const shipmentData = await shipmentsAPI.get(params.id)
      setShipment(shipmentData)
    } catch (err) {
      setError('Failed to load shipment')
      console.error('Failed to load shipment:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch shipment events
  const loadEvents = async () => {
    try {
      const eventsData = await shipmentsAPI.getEvents(params.id)
      setEvents(eventsData)
    } catch (err) {
      console.error('Failed to load events:', err)
    }
  }

  useEffect(() => {
    loadShipment()
    loadEvents()
  }, [params.id])

  const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'booked': 'bg-blue-100 text-blue-800',
      'picked_up': 'bg-green-100 text-green-800',
      'in_transit': 'bg-yellow-100 text-yellow-800',
      'at_customs': 'bg-orange-100 text-orange-800',
      'customs_cleared': 'bg-purple-100 text-purple-800',
      'out_for_delivery': 'bg-indigo-100 text-indigo-800',
      'delivered': 'bg-green-100 text-green-800',
      'returned': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800',
    }
    return statusMap[status] || 'bg-gray-100 text-gray-800'
  }

  const getPaymentStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      'unpaid': 'bg-red-100 text-red-800',
      'partially_paid': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'refunded': 'bg-gray-100 text-gray-800',
      'overdue': 'bg-red-100 text-red-800',
    }
    return statusMap[status] || 'bg-gray-100 text-gray-800'
  }

  const handleAddEvent = async () => {
    if (!newEvent.event_type || !newEvent.description) return

    setIsAddingEvent(true)
    try {
      await shipmentsAPI.addEvent(params.id, {
        event_type: newEvent.event_type,
        location: newEvent.location,
        description: newEvent.description,
        occurred_at: new Date().toISOString(),
      })
      
      // Refresh data
      await loadEvents()
      await loadShipment()
      
      setShowEventModal(false)
      setNewEvent({ event_type: '', location: '', description: '' })
    } catch (error) {
      console.error('Failed to add event:', error)
    } finally {
      setIsAddingEvent(false)
    }
  }

  const handleCaptureLocation = async () => {
    setLocationError(null)
    setLocationSuccess(null)

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Browser GPS is not available on this device.')
      return
    }

    setIsUpdatingLocation(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await shipmentsAPI.updateLocation(params.id, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            location: locationLabel.trim() || undefined,
            occurred_at: new Date().toISOString(),
            provider: 'browser_gps',
            description: 'Location updated from shipment dashboard',
          })
          await loadShipment()
          await loadEvents()
          setLocationSuccess('Shipment location updated successfully.')
        } catch (err: any) {
          setLocationError(err?.message || 'Failed to update shipment location.')
        } finally {
          setIsUpdatingLocation(false)
        }
      },
      (geoError) => {
        setLocationError(geoError.message || 'Unable to capture current GPS location.')
        setIsUpdatingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !shipment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Shipment not found'}</p>
          <Link href="/shipments" className="mt-4">
            <Button>Back to Shipments</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/shipments" className="mr-4">
                <ArrowLeft className="w-6 h-6 text-gray-600 hover:text-gray-900" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {shipment.tracking_number}
                </h1>
                <p className="mt-2 text-sm text-gray-600">Shipment Details</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Tracking Event</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Event Type</label>
                      <Select value={newEvent.event_type} onValueChange={(value) => setNewEvent({ ...newEvent, event_type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="picked_up">Picked Up</SelectItem>
                          <SelectItem value="in_transit">In Transit</SelectItem>
                          <SelectItem value="at_customs">At Customs</SelectItem>
                          <SelectItem value="customs_cleared">Customs Cleared</SelectItem>
                          <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="returned">Returned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Location</label>
                      <Input
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                        placeholder="Event location"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        placeholder="Event description"
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-3">
                      <Button onClick={handleAddEvent} disabled={!newEvent.event_type || !newEvent.description || isAddingEvent}>
                        {isAddingEvent ? 'Adding...' : 'Add Event'}
                      </Button>
                      <Button variant="outline" onClick={() => setShowEventModal(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Link href={`/shipments/${params.id}/edit`}>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Status Badges & Actions */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Badge className={`${getStatusBadgeClass(shipment.status)} text-lg px-4 py-2`}>
              {shipment.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge className={`${getPaymentStatusBadgeClass(shipment.payment_status)} text-lg px-4 py-2`}>
              {shipment.payment_status.replace('_', ' ').toUpperCase()}
            </Badge>
            {/* Status Transition Actions */}
            <div className="flex space-x-2 ml-6">
              {shipment.status === 'draft' && (
                <Button size="sm" disabled={isTransitioning} onClick={() => handleStatusTransition('booked')}>
                  Mark as Booked
                </Button>
              )}
              {shipment.status === 'booked' && (
                <Button size="sm" disabled={isTransitioning} onClick={() => handleStatusTransition('picked_up')}>
                  Mark as Picked Up
                </Button>
              )}
              {shipment.status === 'picked_up' && (
                <Button size="sm" disabled={isTransitioning} onClick={() => handleStatusTransition('in_transit')}>
                  Mark as In Transit
                </Button>
              )}
              {shipment.status === 'in_transit' && (
                <Button size="sm" disabled={isTransitioning} onClick={() => handleStatusTransition('at_customs')}>
                  Mark as At Customs
                </Button>
              )}
              {shipment.status === 'at_customs' && (
                <Button size="sm" disabled={isTransitioning} onClick={() => handleStatusTransition('customs_cleared')}>
                  Mark as Customs Cleared
                </Button>
              )}
              {shipment.status === 'customs_cleared' && (
                <Button size="sm" disabled={isTransitioning} onClick={() => handleStatusTransition('out_for_delivery')}>
                  Mark as Out for Delivery
                </Button>
              )}
              {shipment.status === 'out_for_delivery' && (
                <Button size="sm" disabled={isTransitioning} onClick={() => handleStatusTransition('delivered')}>
                  Mark as Delivered
                </Button>
              )}
              {shipment.status !== 'delivered' && shipment.status !== 'cancelled' && (
                <Button size="sm" variant="destructive" disabled={isTransitioning} onClick={() => handleStatusTransition('cancelled')}>
                  Cancel Shipment
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Info Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sender Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Sender Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{shipment.sender_name}</p>
                  </div>
                  {shipment.sender_phone && (
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{shipment.sender_phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">{shipment.sender_address}</p>
                  </div>
                  {shipment.sender_city && shipment.sender_country && (
                    <div>
                      <p className="text-sm text-gray-600">City, Country</p>
                      <p className="font-medium">{shipment.sender_city}, {shipment.sender_country}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Receiver Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Receiver Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{shipment.receiver_name}</p>
                  </div>
                  {shipment.receiver_phone && (
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{shipment.receiver_phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">{shipment.receiver_address}</p>
                  </div>
                  {shipment.receiver_city && shipment.receiver_country && (
                    <div>
                      <p className="text-sm text-gray-600">City, Country</p>
                      <p className="font-medium">{shipment.receiver_city}, {shipment.receiver_country}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shipment Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Shipment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Weight</p>
                    <p className="font-medium">{shipment.weight_kg} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Package Count</p>
                    <p className="font-medium">{shipment.package_count}</p>
                  </div>
                  {shipment.length_cm && shipment.width_cm && shipment.height_cm && (
                    <div>
                      <p className="text-sm text-gray-600">Dimensions (L×W×H)</p>
                      <p className="font-medium">
                        {shipment.length_cm} × {shipment.width_cm} × {shipment.height_cm} cm
                      </p>
                    </div>
                  )}
                  {shipment.volume_cbm && (
                    <div>
                      <p className="text-sm text-gray-600">Volume</p>
                      <p className="font-medium">{shipment.volume_cbm} CBM</p>
                    </div>
                  )}
                  {shipment.cargo_type && (
                    <div>
                      <p className="text-sm text-gray-600">Cargo Type</p>
                      <p className="font-medium">{shipment.cargo_type}</p>
                    </div>
                  )}
                  {shipment.reference_number && (
                    <div>
                      <p className="text-sm text-gray-600">Reference Number</p>
                      <p className="font-medium">{shipment.reference_number}</p>
                    </div>
                  )}
                </div>
                {shipment.description && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="font-medium">{shipment.description}</p>
                  </div>
                )}
                {shipment.notes && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="font-medium">{shipment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Events Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Tracking Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No tracking events</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Add events to track this shipment&apos;s journey
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event: any, index: number) => (
                      <div key={event.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Activity className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">
                              {event.event_type.replace('_', ' ').toUpperCase()}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {event.occurred_at ? 
                                new Date(event.occurred_at).toLocaleString() :
                                new Date(event.created_at).toLocaleString()
                              }
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {event.location}
                            </div>
                          )}
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Route & Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Route & Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Origin</p>
                      <p className="font-medium">{shipment.origin_city}, {shipment.origin_country}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Destination</p>
                      <p className="font-medium">{shipment.destination_city}, {shipment.destination_country}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Shipped Date</p>
                      <p className="font-medium">
                        {shipment.shipped_date ? 
                          new Date(shipment.shipped_date).toLocaleDateString() : 
                          'Not shipped'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estimated Arrival</p>
                      <p className="font-medium">
                        {shipment.estimated_arrival ? 
                          new Date(shipment.estimated_arrival).toLocaleDateString() : 
                          'Not set'
                        }
                      </p>
                    </div>
                  </div>
                  {(shipment.current_location || shipment.current_latitude != null || shipment.current_longitude != null) && (
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                      <p className="text-sm font-medium text-blue-900">Latest GPS</p>
                      <p className="mt-1 text-sm text-blue-800">{shipment.current_location || 'Live coordinates recorded'}</p>
                      {shipment.current_latitude != null && shipment.current_longitude != null && (
                        <p className="mt-1 text-sm text-blue-700">
                          {Number(shipment.current_latitude).toFixed(5)}, {Number(shipment.current_longitude).toFixed(5)}
                        </p>
                      )}
                      {shipment.last_location_at && (
                        <p className="mt-1 text-xs text-blue-700">Updated {new Date(shipment.last_location_at).toLocaleString()}</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Financial Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Total Cost</p>
                    <p className="font-medium text-lg">
                      {shipment.currency} {shipment.total_cost.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount Paid</p>
                    <p className="font-medium">
                      {shipment.currency} {shipment.amount_paid.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Balance Due</p>
                    <p className="font-medium text-lg text-red-600">
                      {shipment.currency} {shipment.balance_due.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Invoice
                </Button>
                <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                  <Input
                    value={locationLabel}
                    onChange={(e) => setLocationLabel(e.target.value)}
                    placeholder="Optional location label"
                  />
                  <Button variant="outline" className="w-full" onClick={handleCaptureLocation} disabled={isUpdatingLocation}>
                    <MapPin className="w-4 h-4 mr-2" />
                    {isUpdatingLocation ? 'Capturing GPS...' : 'Capture Current GPS'}
                  </Button>
                  {locationError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{locationError}</span>
                    </div>
                  )}
                  {locationSuccess && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                      {locationSuccess}
                    </div>
                  )}
                </div>
                <Button variant="outline" className="w-full">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
