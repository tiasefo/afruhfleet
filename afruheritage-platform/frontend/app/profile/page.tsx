'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useBranding } from '@/hooks/useBranding'
import { fleetbaseTenantApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import { BackButton } from '@/components/back-button'
import {
  Loader2,
  User,
  Truck,
  Car,
  Ship,
  MapPin,
  ExternalLink,
  Activity,
  Package,
  BarChart3,
  AlertCircle,
} from 'lucide-react'

interface FleetbaseStats {
  drivers: any[]
  vehicles: any[]
  fleets: any[]
  orders: any[]
  loading: boolean
  error: string | null
}

export default function ProfilePage() {
  const { user } = useAuth()
  const { branding } = useBranding()
  const [stats, setStats] = useState<FleetbaseStats>({
    drivers: [],
    vehicles: [],
    fleets: [],
    orders: [],
    loading: true,
    error: null,
  })

  const loadFleetbaseData = async () => {
    setStats((s) => ({ ...s, loading: true, error: null }))
    try {
      const [driversRes, vehiclesRes, fleetsRes, ordersRes] = await Promise.all([
        fleetbaseTenantApi.listDrivers().catch(() => ({ data: [] })),
        fleetbaseTenantApi.listVehicles().catch(() => ({ data: [] })),
        fleetbaseTenantApi.listFleets().catch(() => ({ data: [] })),
        fleetbaseTenantApi.listOrders().catch(() => ({ data: [] })),
      ])

      const extract = (res: any) => {
        if (Array.isArray(res)) return res
        if (res && Array.isArray(res.data)) return res.data
        if (res && typeof res === 'object') {
          // Some endpoints wrap in an object with a data key
          return res.drivers || res.vehicles || res.fleets || res.orders || res.data || []
        }
        return []
      }

      setStats({
        drivers: extract(driversRes),
        vehicles: extract(vehiclesRes),
        fleets: extract(fleetsRes),
        orders: extract(ordersRes).slice(0, 5),
        loading: false,
        error: null,
      })
    } catch (e: any) {
      setStats({
        drivers: [],
        vehicles: [],
        fleets: [],
        orders: [],
        loading: false,
        error: e?.message || 'Failed to load Fleetbase data',
      })
    }
  }

  useEffect(() => {
    loadFleetbaseData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!user) {
    return (
    <>
      <BackButton />
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      </>
    )
  }

  const initials = user.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-2 text-sm text-gray-600">Your account and Fleetbase integration overview</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile Card */}
          <div>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold">{user.full_name}</h2>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <Badge className="mt-2" variant="secondary">
                    {user.role?.replace(/_/g, ' ') || 'User'}
                  </Badge>
                  {user.is_superuser && (
                    <Badge className="mt-1" variant="default">
                      Superuser
                    </Badge>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Company</span>
                    <span className="font-medium">{branding?.company_name || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Language</span>
                    <span className="font-medium uppercase">{branding?.default_language || 'en'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Currency</span>
                    <span className="font-medium">{branding?.default_currency || 'GHS'}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/settings">
                      Edit Branding
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/billing">
                      Manage Billing
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fleetbase Stats */}
          <div className="lg:col-span-2 space-y-6">
            {stats.error && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Fleetbase not fully provisioned</p>
                  <p className="text-sm text-yellow-700">{stats.error}</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your Fleetbase runtime may still be initializing. Check back shortly or contact support.
                  </p>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.loading ? '...' : stats.drivers.length}</p>
                      <p className="text-xs text-gray-600">Drivers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                      <Car className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.loading ? '...' : stats.vehicles.length}</p>
                      <p className="text-xs text-gray-600">Vehicles</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.loading ? '...' : stats.fleets.length}</p>
                      <p className="text-xs text-gray-600">Fleets</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                      <Ship className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.loading ? '...' : stats.orders.length}</p>
                      <p className="text-xs text-gray-600">Orders</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Fleetbase Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/fleetbase/drivers">
                      <Truck className="w-4 h-4 mr-2" />
                      Manage Drivers
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/fleetbase/vehicles">
                      <Car className="w-4 h-4 mr-2" />
                      Manage Vehicles
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/fleetbase/fleets">
                      <MapPin className="w-4 h-4 mr-2" />
                      Manage Fleets
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/fleetbase/live-map">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Live Map
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/fleetbase/vehicles">
                      <Car className="w-4 h-4 mr-2" />
                      Manage Vehicles
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/shipments">
                      <Package className="w-4 h-4 mr-2" />
                      View Shipments
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : stats.orders.length > 0 ? (
                  <div className="space-y-3">
                    {stats.orders.map((order: any) => (
                      <div key={order.id || order.uuid} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{order.id || order.uuid || 'Order'}</p>
                          <p className="text-xs text-gray-600">
                            {order.status || 'pending'} • {order.pickup?.address || order.origin || '—'} → {order.destination?.address || order.destination || '—'}
                          </p>
                        </div>
                        <Badge variant="outline">{order.status || 'pending'}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="mx-auto h-8 w-8 mb-2" />
                    <p>No orders yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
