'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { vendorPortalApi, ApiError } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BackButton } from '@/components/back-button'
import {
  Loader2, AlertCircle, Clock, CheckCircle, XCircle, Ban,
  Truck, MapPin, Star, Package, FileText, Calendar,
} from 'lucide-react'

const STATUS_META: Record<string, { label: string; color: string; icon: any; description: string }> = {
  pending: {
    label: 'Under review',
    color: 'bg-amber-100 text-amber-800',
    icon: Clock,
    description: 'Your application is being reviewed by our team. You will be notified once a decision is made.',
  },
  under_review: {
    label: 'Under review',
    color: 'bg-amber-100 text-amber-800',
    icon: Clock,
    description: 'Your application is being reviewed by our team. You will be notified once a decision is made.',
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    description: 'Your vendor account is active. You can receive and manage bookings.',
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
    description: 'Your application was not approved.',
  },
  suspended: {
    label: 'Suspended',
    color: 'bg-red-100 text-red-800',
    icon: Ban,
    description: 'Your vendor account is suspended. Contact support for details.',
  },
}

const AVAILABILITY_OPTIONS = [
  { value: 'offline', label: 'Offline' },
  { value: 'available', label: 'Available' },
  { value: 'en_route_pickup', label: 'En route to pickup' },
  { value: 'delivering', label: 'Delivering' },
]

export const dynamic = 'force-dynamic'

export default function VendorDashboardPage() {
  const { user, token, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [availability, setAvailability] = useState('offline')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!token) { router.push('/login'); return }
    loadProfile()
  }, [authLoading, token])

  async function loadProfile() {
    setIsLoading(true)
    setError(null)
    try {
      const res = await vendorPortalApi.me()
      setData(res)
      setAvailability(res.vendor?.availability_status || 'offline')
      setLocation(res.vendor?.last_known_location || '')
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true)
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to load vendor profile')
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function saveAvailability() {
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await vendorPortalApi.updateAvailability({
        availability_status: availability,
        current_location: location || undefined,
      })
      setData((d: any) => ({
        ...d,
        vendor: { ...d.vendor, availability_status: res.availability_status, last_known_location: res.current_location },
      }))
      setSaveMsg('Availability updated')
    } catch (err) {
      setSaveMsg(err instanceof ApiError ? err.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  if (forbidden) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 pt-8 pb-8 text-center">
            <Ban className="h-10 w-10 text-red-500" />
            <h1 className="text-lg font-semibold">Vendor access not active</h1>
            <p className="text-sm text-muted-foreground">
              This account does not have an active vendor membership. Vendor access
              requires an approved application and an activated account invitation.
              If you believe this is an error, contact support.
            </p>
            <Button variant="outline" onClick={() => router.push('/support/dashboard')}>Contact support</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 pt-8 pb-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={loadProfile}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const vendor = data?.vendor || {}
  const membership = data?.membership || {}
  const meta = STATUS_META[vendor.status] || STATUS_META.pending
  const StatusIcon = meta.icon
  const isApproved = vendor.status === 'approved'

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold">Vendor portal</h1>
          <p className="text-sm text-muted-foreground">{vendor.business_name || vendor.full_name}</p>
        </div>
      </div>

      {/* Status banner */}
      <Card className={`border-l-4 ${isApproved ? 'border-l-green-500' : 'border-l-amber-500'}`}>
        <CardContent className="flex items-start gap-3 pt-6">
          <StatusIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge className={meta.color}>{meta.label}</Badge>
              {membership.role && <Badge variant="outline">Role: {membership.role}</Badge>}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {meta.description}
              {vendor.status === 'rejected' && vendor.rejection_reason && (
                <span className="block mt-1 font-medium text-red-700">Reason: {vendor.rejection_reason}</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{vendor.full_name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{vendor.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{vendor.phone}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Business type</span><span className="font-medium capitalize">{vendor.business_type}</span></div>
            {vendor.operating_regions?.length > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">Regions</span>
                <span className="font-medium text-right">{vendor.operating_regions.join(', ')}</span>
              </div>
            )}
            {vendor.vehicles?.length > 0 && (
              <div>
                <span className="text-muted-foreground">Vehicles</span>
                <ul className="mt-1 space-y-1">
                  {vendor.vehicles.map((v: any) => (
                    <li key={v.id} className="flex items-center gap-2 font-medium">
                      <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="capitalize">{v.vehicle_type}</span>
                      <span className="text-muted-foreground">· {v.registration_number}</span>
                      {v.make_model && <span className="text-muted-foreground">· {v.make_model}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-between border-t pt-3">
              <span className="text-muted-foreground flex items-center gap-1"><Star className="h-3.5 w-3.5" /> Rating</span>
              <span className="font-medium">{Number(vendor.average_rating || 0).toFixed(1)} ({vendor.total_deliveries || 0} deliveries)</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Availability */}
          <Card>
            <CardHeader><CardTitle className="text-base">Availability</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={availability} onValueChange={setAvailability} disabled={!isApproved}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AVAILABILITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Current location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="location" className="pl-9" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Accra, Tema" disabled={!isApproved} />
                </div>
              </div>
              <Button onClick={saveAvailability} disabled={saving || !isApproved} className="w-full">
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Update availability'}
              </Button>
              {!isApproved && <p className="text-xs text-muted-foreground">Availability can be set once your account is approved.</p>}
              {saveMsg && <p className="text-xs text-muted-foreground">{saveMsg}</p>}
            </CardContent>
          </Card>

          {/* Quick links */}
          <Card>
            <CardContent className="grid grid-cols-2 gap-3 pt-6">
              <Button variant="outline" className="justify-start gap-2" onClick={() => router.push('/vendor/bookings')}>
                <Package className="h-4 w-4" /> Bookings
              </Button>
              <Button variant="outline" className="justify-start gap-2" onClick={() => router.push('/vendor/documents')}>
                <FileText className="h-4 w-4" /> Documents
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
