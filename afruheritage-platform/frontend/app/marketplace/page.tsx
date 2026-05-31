'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { marketplaceApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Loader2,
  ShoppingBag,
  MapPin,
  Weight,
  Truck,
  Package,
  Search,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'

function statusColor(status: string) {
  const map: Record<string, string> = {
    open: 'bg-green-100 text-green-700 border-green-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    assigned: 'bg-blue-100 text-blue-700 border-blue-200',
    in_transit: 'bg-purple-100 text-purple-700 border-purple-200',
    delivered: 'bg-gray-100 text-gray-700 border-gray-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  }
  return map[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'
}

export default function MarketplacePage() {
  const { user } = useAuth()
  const [shipments, setShipments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadShipments = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await marketplaceApi.listShipments()
      setShipments(Array.isArray(data) ? data : data?.items ?? [])
    } catch (err: any) {
      setError(err?.message || 'Failed to load marketplace shipments')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadShipments()
  }, [])

  const filtered = shipments.filter((s) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      s.tracking_number?.toLowerCase().includes(q) ||
      s.origin?.toLowerCase().includes(q) ||
      s.destination?.toLowerCase().includes(q) ||
      s.sender_name?.toLowerCase().includes(q) ||
      s.receiver_name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="h-6 w-6 text-primary" />
                Marketplace
              </h1>
              <p className="mt-1 text-sm text-gray-500">Browse available freight jobs and shipments</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadShipments} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {(user?.role === 'personal_shipper' || user?.role === 'company_admin') && (
                <Link href="/shipments/new">
                  <Button size="sm">
                    <Package className="h-4 w-4 mr-2" />
                    Post a Shipment
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by tracking number, origin, destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button variant="outline" onClick={loadShipments}>Try Again</Button>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {search ? 'No results found' : 'No shipments in marketplace yet'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {search
                  ? 'Try a different search term'
                  : 'Post a shipment to find available freight carriers'}
              </p>
              {!search && (user?.role === 'personal_shipper' || user?.role === 'company_admin') && (
                <Link href="/shipments/new">
                  <Button>Post a Shipment</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((shipment) => (
              <Card key={shipment.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-500 font-mono">{shipment.tracking_number}</p>
                      <CardTitle className="text-base mt-1">
                        {shipment.sender_name || 'Unknown'} → {shipment.receiver_name || 'Unknown'}
                      </CardTitle>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${statusColor(shipment.status)}`}>
                      {shipment.status?.replace(/_/g, ' ') || 'Open'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{shipment.origin || '—'}</span>
                    <span className="text-gray-300">→</span>
                    <span className="truncate">{shipment.destination || '—'}</span>
                  </div>
                  {shipment.weight && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Weight className="h-3.5 w-3.5 text-gray-400" />
                      <span>{shipment.weight} kg</span>
                    </div>
                  )}
                  {shipment.cargo_type && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Package className="h-3.5 w-3.5 text-gray-400" />
                      <span className="capitalize">{shipment.cargo_type.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                  <div className="pt-2 flex gap-2">
                    <Link href={`/shipments/${shipment.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        View Details
                      </Button>
                    </Link>
                    {user?.role === 'delivery_driver' && shipment.status === 'open' && (
                      <Button size="sm" className="flex-1">
                        <Truck className="h-3.5 w-3.5 mr-1.5" />
                        Bid
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
