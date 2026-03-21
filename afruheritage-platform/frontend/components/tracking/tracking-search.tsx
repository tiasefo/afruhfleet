'use client'

import { useState } from 'react'
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
  CheckCircle2,
  Truck,
  Ship,
  Plane,
  Building2,
  ArrowRight,
  Globe,
  User,
  Phone,
  DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Default shipment structure
const defaultShipment = {
  trackingNumber: 'AFR-2024-12847',
  status: 'in_transit',
  paymentStatus: 'partially_paid',
  cargoType: 'Electronics',
  packageCount: 5,
  weight: 125,
  sender: {
    name: 'Guangzhou Electronics Ltd.',
    phone: '+86 138 0000 0000',
    city: 'Guangzhou',
    country: 'China',
  },
  receiver: {
    name: 'Accra Tech Imports',
    phone: '+233 24 000 0000',
    city: 'Accra',
    country: 'Ghana',
  },
  origin: {
    city: 'Guangzhou',
    country: 'China',
    date: '2024-03-10',
  },
  destination: {
    city: 'Accra',
    country: 'Ghana',
    date: '2024-04-05',
  },
  payment: {
    total: 2500,
    paid: 1500,
    balance: 1000,
    currency: 'GHS',
  },
  events: [
    {
      id: '1',
      type: 'created',
      title: 'Shipment Created',
      description: 'Shipment booked and documents received',
      location: 'Guangzhou, China',
      timestamp: '2024-03-10T09:00:00Z',
      icon: Package,
    },
    {
      id: '2',
      type: 'picked_up',
      title: 'Picked Up',
      description: 'Cargo collected from sender warehouse',
      location: 'Guangzhou, China',
      timestamp: '2024-03-11T14:30:00Z',
      icon: Truck,
    },
    {
      id: '3',
      type: 'departed',
      title: 'Departed Origin',
      description: 'Vessel departed Guangzhou Port',
      location: 'Guangzhou Port, China',
      timestamp: '2024-03-15T08:00:00Z',
      icon: Ship,
    },
    {
      id: '4',
      type: 'in_transit',
      title: 'In Transit',
      description: 'Cargo on board vessel heading to destination',
      location: 'At Sea',
      timestamp: '2024-03-20T12:00:00Z',
      icon: Ship,
      current: true,
    },
  ],
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground', labelZh: '草稿' },
  booked: { label: 'Booked', color: 'bg-primary text-primary-foreground', labelZh: '已预订' },
  picked_up: { label: 'Picked Up', color: 'bg-chart-3 text-white', labelZh: '已取件' },
  in_transit: { label: 'In Transit', color: 'bg-chart-1 text-white', labelZh: '运输中' },
  at_customs: { label: 'At Customs', color: 'bg-accent text-accent-foreground', labelZh: '海关中' },
  customs_cleared: { label: 'Customs Cleared', color: 'bg-chart-4 text-white', labelZh: '已通关' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-chart-3 text-white', labelZh: '派送中' },
  delivered: { label: 'Delivered', color: 'bg-chart-4 text-white', labelZh: '已交付' },
  returned: { label: 'Returned', color: 'bg-chart-5 text-white', labelZh: '已退回' },
  cancelled: { label: 'Cancelled', color: 'bg-destructive text-destructive-foreground', labelZh: '已取消' },
}

const paymentStatusConfig = {
  unpaid: { label: 'Unpaid', color: 'text-destructive', labelZh: '未付款' },
  partially_paid: { label: 'Partially Paid', color: 'text-accent-foreground', labelZh: '部分付款' },
  paid: { label: 'Paid', color: 'text-chart-4', labelZh: '已付款' },
  refunded: { label: 'Refunded', color: 'text-muted-foreground', labelZh: '已退款' },
  overdue: { label: 'Overdue', color: 'text-destructive', labelZh: '逾期未付' },
  pending: { label: 'Pending', color: 'text-muted-foreground', labelZh: '待处理' },
}

export function TrackingSearch() {
  const [searchValue, setSearchValue] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [shipment, setShipment] = useState<any>(defaultShipment)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchValue.trim()) return

    setIsSearching(true)
    setNotFound(false)
    setShowResult(false)

    const tid = tenantId.trim() || 'default'
    try {
      const res = await fetch(`/api/v1/shipments/public/track/${tid}/${encodeURIComponent(searchValue.trim())}`)
      if (res.ok) {
        const data = await res.json()
        setShipment({
          trackingNumber: data.tracking_number,
          status: data.status,
          paymentStatus: data.payment_status || 'pending',
          cargoType: 'Freight',
          packageCount: 1,
          weight: 0,
          sender: { name: data.sender_name || 'N/A', phone: '', city: data.origin_city || '', country: data.origin_country || '' },
          receiver: { name: data.receiver_name || 'N/A', phone: '', city: data.destination_city || '', country: data.destination_country || '' },
          origin: { city: data.origin_city || '', country: data.origin_country || '', date: data.shipped_date || '' },
          destination: { city: data.destination_city || '', country: data.destination_country || '', date: data.estimated_arrival || '' },
          payment: { total: data.total_cost || 0, paid: data.amount_paid || 0, balance: data.balance_due || 0, currency: data.currency || 'GHS' },
          events: (data.events || []).map((ev: any, i: number) => ({
            id: ev.id || String(i),
            type: ev.event_type,
            title: ev.event_type?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            description: ev.description || '',
            location: ev.location || '',
            timestamp: ev.occurred_at || ev.created_at || '',
            icon: Package,
          })),
        })
        setShowResult(true)
      } else if (res.status === 404) {
        setNotFound(true)
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setIsSearching(false)
    }
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

  const status = statusConfig[shipment.status as keyof typeof statusConfig] || statusConfig.in_transit
  const paymentStatus = paymentStatusConfig[shipment.paymentStatus as keyof typeof paymentStatusConfig] || paymentStatusConfig.pending

  return (
    <div className="min-h-[80vh] bg-background">
      {/* Hero Search Section */}
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
              Enter your tracking number to see the current status, location, and estimated delivery time.
            </p>
          </div>

          <form onSubmit={handleSearch} className="mt-8">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Enter tracking number (try: AFR-2024-12847)"
                  className="h-14 bg-background pl-12 text-base"
                />
              </div>
              <Button 
                type="submit" 
                size="lg" 
                className="h-14 px-8"
                disabled={isSearching || !searchValue.trim()}
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

          {/* Quick Tips */}
          <p className="mt-4 text-center text-sm text-primary-foreground/60">
            Search by tracking number, reference number, or receiver name
          </p>
        </div>
      </section>

      {/* Results Section */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Not Found State */}
        {notFound && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <Package className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">
                Shipment Not Found
              </h3>
              <p className="mt-2 max-w-md text-muted-foreground">
                We couldn&apos;t find a shipment with that tracking number. Please check the number and try again, or contact support for assistance.
              </p>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => {
                  setSearchValue('')
                  setNotFound(false)
                }}>
                  Try Again
                </Button>
                <Button asChild>
                  <a href="/support">Contact Support</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shipment Result */}
        {showResult && (
          <div className="space-y-6">
            {/* Status Header */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardDescription>Tracking Number</CardDescription>
                    <CardTitle className="text-2xl">{shipment.trackingNumber}</CardTitle>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={cn('gap-1 px-3 py-1', status.color)}>
                      {status.label}
                    </Badge>
                    <Badge variant="outline" className={paymentStatus.color}>
                      {paymentStatus.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Route Summary */}
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Origin</p>
                    <p className="font-semibold">{shipment.origin.city}</p>
                    <p className="text-sm text-muted-foreground">{shipment.origin.country}</p>
                  </div>
                  <div className="flex flex-1 items-center justify-center px-4">
                    <div className="h-0.5 flex-1 bg-border" />
                    <Ship className="mx-2 h-6 w-6 text-primary" />
                    <div className="h-0.5 flex-1 bg-border" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Destination</p>
                    <p className="font-semibold">{shipment.destination.city}</p>
                    <p className="text-sm text-muted-foreground">{shipment.destination.country}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Shipped Date</p>
                      <p className="font-medium">{formatDate(shipment.origin.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Est. Arrival</p>
                      <p className="font-medium">{formatDate(shipment.destination.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Packages</p>
                      <p className="font-medium">{shipment.packageCount} pkgs ({shipment.weight} kg)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Tracking Timeline */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Tracking History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative space-y-0">
                    {shipment.events.map((event, index) => (
                      <div key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
                        {/* Timeline Line */}
                        {index < shipment.events.length - 1 && (
                          <div className="absolute left-5 top-10 h-full w-0.5 bg-border" />
                        )}
                        
                        {/* Icon */}
                        <div
                          className={cn(
                            'relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                            event.current
                              ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          <event.icon className="h-5 w-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <h4 className={cn(
                              'font-medium',
                              event.current ? 'text-primary' : 'text-foreground'
                            )}>
                              {event.title}
                              {event.current && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Current
                                </Badge>
                              )}
                            </h4>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(event.timestamp)} at {formatTime(event.timestamp)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {event.description}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {event.location}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Sidebar Info */}
              <div className="space-y-6">
                {/* Sender */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      Sender
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-medium">{shipment.sender.name}</p>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {shipment.sender.phone}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {shipment.sender.city}, {shipment.sender.country}
                    </p>
                  </CardContent>
                </Card>

                {/* Receiver */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="h-4 w-4" />
                      Receiver
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-medium">{shipment.receiver.name}</p>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {shipment.receiver.phone}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {shipment.receiver.city}, {shipment.receiver.country}
                    </p>
                  </CardContent>
                </Card>

                {/* Payment */}
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
                        <span className="font-medium">
                          {shipment.payment.currency} {shipment.payment.total.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Paid</span>
                        <span className="text-chart-4">
                          {shipment.payment.currency} {shipment.payment.paid.toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between">
                          <span className="font-medium">Balance Due</span>
                          <span className="font-semibold text-destructive">
                            {shipment.payment.currency} {shipment.payment.balance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - No Search Yet */}
        {!showResult && !notFound && !isSearching && (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-foreground">
              Enter a tracking number above
            </h3>
            <p className="mt-2 text-muted-foreground">
              Track your shipment status, location, and estimated delivery time in real-time.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
