'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Search,
  Loader2,
  Package,
  MapPin,
  Calendar,
  Clock,
  Truck,
  Ship,
  Building2,
  Globe,
  User,
  DollarSign,
  AlertCircle,
  Phone,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type TrackEvent = {
  id: string
  event_type: string
  location?: string | null
  latitude?: number | null
  longitude?: number | null
  description?: string | null
  occurred_at: string
  created_at: string
}

type TrackResponse = {
  tracking_number: string
  status: string
  sender_name: string
  receiver_name: string
  origin_country?: string | null
  origin_city?: string | null
  destination_country?: string | null
  destination_city?: string | null
  current_location?: string | null
  shipped_date?: string | null
  estimated_arrival?: string | null
  payment_status: string
  total_cost: number
  amount_paid: number
  balance_due: number
  currency: string
  events: TrackEvent[]
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  booked: { label: 'Booked', color: 'bg-primary text-primary-foreground' },
  picked_up: { label: 'Picked Up', color: 'bg-chart-3 text-white' },
  in_transit: { label: 'In Transit', color: 'bg-chart-1 text-white' },
  at_customs: { label: 'At Customs', color: 'bg-accent text-accent-foreground' },
  customs_cleared: { label: 'Customs Cleared', color: 'bg-chart-4 text-white' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-chart-3 text-white' },
  delivered: { label: 'Delivered', color: 'bg-chart-4 text-white' },
  returned: { label: 'Returned', color: 'bg-chart-5 text-white' },
  cancelled: { label: 'Cancelled', color: 'bg-destructive text-destructive-foreground' },
}

const paymentStatusConfig = {
  unpaid: { label: 'Unpaid', color: 'text-destructive' },
  partially_paid: { label: 'Partially Paid', color: 'text-accent-foreground' },
  paid: { label: 'Paid', color: 'text-chart-4' },
  refunded: { label: 'Refunded', color: 'text-muted-foreground' },
  overdue: { label: 'Overdue', color: 'text-destructive' },
}

function joinApiUrl(base: string, path: string): string {
  const normalizedBase = base.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

function normalizeEventLabel(eventType: string): string {
  return eventType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

function getEventIcon(eventType: string) {
  if (eventType.includes('pickup')) return Truck
  if (eventType.includes('ship') || eventType.includes('transit')) return Ship
  return Package
}

export function TrackingSearch() {
  const [tenantId, setTenantId] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<TrackResponse | null>(null)

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromQueryTenant = params.get('tenant')
    const fromQueryTracking = params.get('q')
    const fromEnvTenant = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || ''
    setTenantId(fromQueryTenant || fromEnvTenant)
    setSearchValue(fromQueryTracking || '')
  }, [])

  const status = useMemo(() => {
    if (!result) return null
    return statusConfig[result.status as keyof typeof statusConfig] || {
      label: result.status,
      color: 'bg-muted text-muted-foreground',
    }
  }, [result])

  const paymentStatus = useMemo(() => {
    if (!result) return null
    return paymentStatusConfig[result.payment_status as keyof typeof paymentStatusConfig] || {
      label: result.payment_status,
      color: 'text-muted-foreground',
    }
  }, [result])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchValue.trim() || !tenantId.trim()) return

    if (!apiBaseUrl) {
      setError('API base URL is not configured for this environment.')
      return
    }

    setIsSearching(true)
    setNotFound(false)
    setError('')
    setResult(null)

    try {
      const url = joinApiUrl(
        apiBaseUrl,
        `/shipments/public/track/${encodeURIComponent(tenantId.trim())}/${encodeURIComponent(searchValue.trim())}`
      )
      const response = await fetch(url)
      if (response.status === 404) {
        setNotFound(true)
      } else if (!response.ok) {
        throw new Error(await response.text())
      } else {
        setResult((await response.json()) as TrackResponse)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tracking details')
    }

    setIsSearching(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-[80vh] bg-background">
      <section className="relative overflow-hidden bg-primary py-16 sm:py-20">
        <div className="absolute inset-0 -z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4 bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20">
              <Globe className="mr-1.5 h-3.5 w-3.5" />
              Real-time Tracking
            </Badge>
            <h1 className="text-balance text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Track Your Shipment
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-primary-foreground/80">
              Enter tenant and tracking number to fetch live status from the shipment service.
            </p>
          </div>

          <form onSubmit={handleSearch} className="mt-8 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="Tenant ID or slug"
                className="h-12 bg-background"
              />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Tracking number"
                  className="h-12 bg-background pl-12 text-base"
                />
              </div>
            </div>
            <div className="flex">
              <Button
                type="submit"
                size="lg"
                className="h-12 px-8"
                disabled={isSearching || !searchValue.trim() || !tenantId.trim()}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Track
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {error && (
          <Card className="mb-6 border-destructive/20 bg-destructive/5">
            <CardContent className="flex items-center gap-2 py-4 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </CardContent>
          </Card>
        )}

        {notFound && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <Package className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">Shipment Not Found</h3>
              <p className="mt-2 max-w-md text-muted-foreground">
                We couldn&apos;t find a shipment with that tenant + tracking number combination.
              </p>
            </CardContent>
          </Card>
        )}

        {result && status && paymentStatus && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardDescription>Tracking Number</CardDescription>
                    <CardTitle className="text-2xl">{result.tracking_number}</CardTitle>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={cn('gap-1 px-3 py-1', status.color)}>{status.label}</Badge>
                    <Badge variant="outline" className={paymentStatus.color}>{paymentStatus.label}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Origin</p>
                    <p className="font-semibold">{result.origin_city || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{result.origin_country || 'N/A'}</p>
                  </div>
                  <div className="flex flex-1 items-center justify-center px-4">
                    <div className="h-0.5 flex-1 bg-border" />
                    <Ship className="mx-2 h-6 w-6 text-primary" />
                    <div className="h-0.5 flex-1 bg-border" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Destination</p>
                    <p className="font-semibold">{result.destination_city || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{result.destination_country || 'N/A'}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Shipped Date</p>
                      <p className="font-medium">{result.shipped_date ? formatDate(result.shipped_date) : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Est. Arrival</p>
                      <p className="font-medium">{result.estimated_arrival ? formatDate(result.estimated_arrival) : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Current Location</p>
                      <p className="font-medium">{result.current_location || 'Not available'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Tracking History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative space-y-0">
                    {result.events.map((event, index) => {
                      const Icon = getEventIcon(event.event_type)
                      const current = index === 0
                      return (
                        <div key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
                          {index < result.events.length - 1 && (
                            <div className="absolute left-5 top-10 h-full w-0.5 bg-border" />
                          )}

                          <div
                            className={cn(
                              'relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                              current
                                ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>

                          <div className="flex-1 pt-1">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <h4 className={cn('font-medium', current ? 'text-primary' : 'text-foreground')}>
                                {normalizeEventLabel(event.event_type)}
                                {current && (
                                  <Badge variant="secondary" className="ml-2 text-xs">Current</Badge>
                                )}
                              </h4>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(event.occurred_at)} at {formatTime(event.occurred_at)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{event.description || 'Status updated'}</p>
                            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              {event.location || result.current_location || 'Location unavailable'}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      Sender
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-medium">{result.sender_name}</p>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      Not available in public tracking
                    </p>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {result.origin_city || 'N/A'}, {result.origin_country || 'N/A'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="h-4 w-4" />
                      Receiver
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-medium">{result.receiver_name}</p>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      Not available in public tracking
                    </p>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {result.destination_city || 'N/A'}, {result.destination_country || 'N/A'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Payment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-medium">{result.currency} {result.total_cost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Paid</span>
                        <span className="text-chart-4">{result.currency} {result.amount_paid.toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between">
                          <span className="font-medium">Balance Due</span>
                          <span className="font-semibold text-destructive">{result.currency} {result.balance_due.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {!result && !notFound && !isSearching && !error && (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-foreground">Enter tenant and tracking number</h3>
            <p className="mt-2 text-muted-foreground">
              Live public tracking requires both a tenant identifier and tracking number.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
