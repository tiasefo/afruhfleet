'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { shipmentsAPI } from '@/lib/api'
import { ApiError } from '@/lib/api'
import { BackButton } from '@/components/back-button'
import {
  Package,
  MapPin,
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  Navigation,
  DollarSign,
  FileText,
} from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  booked: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-indigo-100 text-indigo-800',
  in_transit: 'bg-purple-100 text-purple-800',
  at_customs: 'bg-amber-100 text-amber-800',
  customs_cleared: 'bg-teal-100 text-teal-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  returned: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

const PAYMENT_COLORS: Record<string, string> = {
  unpaid: 'bg-red-100 text-red-800',
  partially_paid: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-800',
  refunded: 'bg-blue-100 text-blue-800',
  overdue: 'bg-red-100 text-red-800',
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function CustomerPortalPage() {
  const { user, token, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login')
      return
    }
    if (!token) return

    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await shipmentsAPI.myShipments()
        setData(result)
      } catch (err: any) {
        setError(err instanceof ApiError ? err.message : 'Failed to load your shipments')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [token, authLoading, router])

  if (authLoading || isLoading) {
    return (
    <>
      <BackButton />
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-600">Loading your portal...</p>
        </div>
      </div>
      </>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const shipments = data?.shipments || []
  const userInfo = data?.user || {}

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Shipments Portal</h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome, <span className="font-medium">{userInfo.full_name || user?.full_name || 'Customer'}</span>
                {userInfo.email && (
                  <>
                    {' '}· {userInfo.email}
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
                Admin Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Shipments</p>
                <p className="text-xl font-bold">{shipments.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Truck className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">In Transit</p>
                <p className="text-xl font-bold">
                  {shipments.filter((s: any) => s.status === 'in_transit' || s.status === 'picked_up' || s.status === 'out_for_delivery').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-xl font-bold">
                  {shipments.filter((s: any) => s.status === 'delivered').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold">
                  {shipments.filter((s: any) => s.status === 'draft' || s.status === 'booked').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shipments List */}
        {shipments.length === 0 ? (
          <Card className="mt-6">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-lg font-medium text-gray-900">No shipments yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Your shipments will appear here once they are created.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 space-y-4">
            {shipments.map((s: any) => (
              <Card key={s.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer pb-3"
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package className="h-5 w-5 text-blue-600" />
                      {s.tracking_number}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-800'}>
                        {s.status?.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                      <Badge className={PAYMENT_COLORS[s.payment_status] || 'bg-gray-100 text-gray-800'}>
                        {s.payment_status?.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Always visible: key info */}
                  <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-gray-500">From</p>
                      <p className="font-medium">{s.origin_city || '—'}, {s.origin_country || ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">To</p>
                      <p className="font-medium">{s.destination_city || '—'}, {s.destination_country || ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Estimated Arrival</p>
                      <p className="font-medium">{formatDate(s.estimated_arrival)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Balance Due</p>
                      <p className="font-medium">{formatCurrency(s.balance_due, s.currency)}</p>
                    </div>
                  </div>

                  {/* Current location if available */}
                  {s.current_location && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 p-3">
                      <Navigation className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-blue-600">Current Location</p>
                        <p className="text-sm font-medium text-blue-900">{s.current_location}</p>
                        {s.last_location_at && (
                          <p className="text-xs text-blue-500">Updated {formatDate(s.last_location_at)}</p>
                        )}
                      </div>
                      {s.current_latitude != null && s.current_longitude != null && (
                        <span className="ml-auto text-xs text-blue-400">
                          {Number(s.current_latitude).toFixed(4)}, {Number(s.current_longitude).toFixed(4)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Expanded details */}
                  {expandedId === s.id && (
                    <div className="mt-4 border-t pt-4">
                      <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-gray-500">Sender</p>
                          <p className="font-medium">{s.sender_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Receiver</p>
                          <p className="font-medium">{s.receiver_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Reference</p>
                          <p className="font-medium">{s.reference_number || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Shipped Date</p>
                          <p className="font-medium">{formatDate(s.shipped_date)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Actual Arrival</p>
                          <p className="font-medium">{formatDate(s.actual_arrival)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Cargo Type</p>
                          <p className="font-medium">{s.cargo_type || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Weight</p>
                          <p className="font-medium">{s.weight_kg ? `${s.weight_kg} kg` : '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Packages</p>
                          <p className="font-medium">{s.package_count || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total Cost</p>
                          <p className="font-medium">{formatCurrency(s.total_cost, s.currency)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Amount Paid</p>
                          <p className="font-medium">{formatCurrency(s.amount_paid, s.currency)}</p>
                        </div>
                      </div>

                      {s.description && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500">Description</p>
                          <p className="text-sm">{s.description}</p>
                        </div>
                      )}

                      {s.notes && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500">Notes</p>
                          <p className="text-sm">{s.notes}</p>
                        </div>
                      )}

                      {/* Tracking Events Timeline */}
                      {s.events && s.events.length > 0 && (
                        <div className="mt-4">
                          <p className="mb-2 flex items-center gap-1 text-xs font-medium text-gray-500">
                            <MapPin className="h-3 w-3" /> Tracking History
                          </p>
                          <div className="space-y-2">
                            {s.events.map((ev: any, i: number) => (
                              <div key={ev.id || i} className="flex gap-3 text-sm">
                                <div className="flex flex-col items-center">
                                  <div className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                                  {i < s.events.length - 1 && <div className="h-4 w-px bg-gray-200" />}
                                </div>
                                <div className="pb-1">
                                  <p className="font-medium capitalize">{ev.event_type?.replace(/_/g, ' ')}</p>
                                  {ev.location && <p className="text-xs text-gray-500">{ev.location}</p>}
                                  {ev.description && <p className="text-xs text-gray-400">{ev.description}</p>}
                                  <p className="text-xs text-gray-400">{formatDate(ev.occurred_at)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {s.cargo_image_url && (
                        <div className="mt-3">
                          <img src={s.cargo_image_url} alt="Cargo" className="max-h-48 rounded-lg border" />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
