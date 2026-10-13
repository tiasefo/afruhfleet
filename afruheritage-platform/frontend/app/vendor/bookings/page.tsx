'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { vendorPortalApi, ApiError } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BackButton } from '@/components/back-button'
import {
  Loader2, AlertCircle, MapPin, Calendar, Truck, CheckCircle,
  XCircle, Package, Ban,
} from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  requested: 'bg-amber-100 text-amber-800',
  accepted: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  canceled: 'bg-gray-100 text-gray-600',
  disputed: 'bg-red-100 text-red-800',
}

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'requested', label: 'Requested' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
]

export const dynamic = 'force-dynamic'

function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return d }
}

export default function VendorBookingsPage() {
  const { token, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [deciding, setDeciding] = useState<any>(null)
  const [decision, setDecision] = useState<'accept' | 'reject'>('accept')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!token) { router.push('/login'); return }
    load()
  }, [authLoading, token, statusFilter])

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      const res = await vendorPortalApi.myBookings({ status: statusFilter || undefined, page_size: 50 })
      setBookings(res.items || [])
      setTotal(res.total || 0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load bookings')
    } finally {
      setIsLoading(false)
    }
  }

  async function submitDecision() {
    if (!deciding) return
    setSubmitting(true)
    try {
      if (decision === 'accept') {
        await vendorPortalApi.acceptBooking(deciding.id, note || undefined)
      } else {
        await vendorPortalApi.rejectBooking(deciding.id, note || undefined)
      }
      setDeciding(null)
      setNote('')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">My bookings</h1>
          <p className="text-sm text-muted-foreground">{total} booking{total === 1 ? '' : 's'}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === f.value ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-secondary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : error ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={load}>Retry</Button>
        </CardContent></Card>
      ) : bookings.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No bookings in this view yet.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-800'}>
                        {b.status?.replace(/_/g, ' ')}
                      </Badge>
                      {b.vehicle_type_requested && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Truck className="h-3 w-3" /> <span className="capitalize">{b.vehicle_type_requested}</span>
                        </span>
                      )}
                    </div>
                    {b.pickup_address && (
                      <p className="flex items-start gap-1.5 text-sm">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                        <span><span className="text-muted-foreground">Pickup: </span>{b.pickup_address}</span>
                      </p>
                    )}
                    {b.delivery_address && (
                      <p className="flex items-start gap-1.5 text-sm">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                        <span><span className="text-muted-foreground">Delivery: </span>{b.delivery_address}</span>
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Requested {formatDate(b.offered_at || b.created_at)}</span>
                      {b.credit_cost != null && <span>Fee: {b.currency} {b.credit_cost}</span>}
                    </div>
                    {b.notes && <p className="text-xs text-muted-foreground">Note: {b.notes}</p>}
                  </div>
                  {b.status === 'requested' && (
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" onClick={() => { setDeciding(b); setDecision('accept'); setNote('') }}>
                        <CheckCircle className="mr-1 h-4 w-4" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setDeciding(b); setDecision('reject'); setNote('') }}>
                        <XCircle className="mr-1 h-4 w-4" /> Decline
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!deciding} onOpenChange={(open) => !open && setDeciding(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decision === 'accept' ? 'Accept booking' : 'Decline booking'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {decision === 'accept'
                ? 'Confirm you can fulfil this booking.'
                : 'Let the customer know why you cannot take this booking (optional).'}
            </p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={decision === 'accept' ? 'Optional note' : 'Reason (optional)'}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeciding(null)}>Cancel</Button>
              <Button
                onClick={submitDecision}
                disabled={submitting}
                variant={decision === 'reject' ? 'destructive' : 'default'}
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {decision === 'accept' ? 'Accept booking' : 'Decline booking'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
