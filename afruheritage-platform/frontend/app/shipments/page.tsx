'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useBranding } from '@/hooks/useBranding'
import { useTranslation } from '@/hooks/useTranslation'
import { shipmentApi } from '@/lib/api_updated'
import { Shipment, ShipmentStatus, PaymentStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Package, 
  Eye, 
  Edit, 
  Clock,
  DollarSign,
  ArrowUpDown 
} from 'lucide-react'

export default function ShipmentsPage() {
  const allStatusesValue = '__all_statuses__'
  const allPaymentsValue = '__all_payments__'
  const { user, isLoading: authLoading } = useAuth()
  const { branding } = useBranding()
  const { t } = useTranslation()

  // Gate: must be authenticated and onboarded
  const router = useRouter()
  useEffect(() => {
    if (authLoading) return
    if (!user) { router.replace('/login'); return }
    if (!user.onboarding_complete) { router.replace('/onboarding'); return }
  }, [authLoading, user, router])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [shipments, setShipments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const pageSize = 20

  // Fetch shipments
  const loadShipments = async () => {
    setIsLoading(true)
    try {
      // Get tenant ID from context or user
      const tenantId = user?.tenant_id || 'default'
      const data = await shipmentApi.getAll(tenantId, {
        status: statusFilter || undefined,
        page: currentPage,
        page_size: pageSize,
      })
      setShipments(data.items || [])
      setTotal(data.total || 0)
      setPages(data.pages || 1)
    } catch (error) {
      console.error('Failed to load shipments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load shipments on mount and when filters change
  React.useEffect(() => {
    loadShipments()
  }, [searchQuery, statusFilter, paymentStatusFilter, currentPage])

  const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      [ShipmentStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [ShipmentStatus.BOOKED]: 'bg-blue-100 text-blue-800',
      [ShipmentStatus.PICKED_UP]: 'bg-green-100 text-green-800',
      [ShipmentStatus.IN_TRANSIT]: 'bg-yellow-100 text-yellow-800',
      [ShipmentStatus.AT_CUSTOMS]: 'bg-orange-100 text-orange-800',
      [ShipmentStatus.CUSTOMS_CLEARED]: 'bg-purple-100 text-purple-800',
      [ShipmentStatus.OUT_FOR_DELIVERY]: 'bg-indigo-100 text-indigo-800',
      [ShipmentStatus.DELIVERED]: 'bg-green-100 text-green-800',
      [ShipmentStatus.RETURNED]: 'bg-red-100 text-red-800',
      [ShipmentStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
    }
    return statusMap[status] || 'bg-gray-100 text-gray-800'
  }

  const getPaymentStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      [PaymentStatus.UNPAID]: 'bg-red-100 text-red-800',
      [PaymentStatus.PARTIALLY_PAID]: 'bg-yellow-100 text-yellow-800',
      [PaymentStatus.PAID]: 'bg-green-100 text-green-800',
      [PaymentStatus.REFUNDED]: 'bg-gray-100 text-gray-800',
      [PaymentStatus.OVERDUE]: 'bg-red-100 text-red-800',
    }
    return statusMap[status] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('shipments.title')}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage and track all your shipments
              </p>
            </div>
            <div className="flex space-x-3">
              <Link href="/shipments/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('shipments.create')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t('common.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter || allStatusesValue}
              onValueChange={(value) => setStatusFilter(value === allStatusesValue ? '' : value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allStatusesValue}>All Statuses</SelectItem>
                <SelectItem value={ShipmentStatus.DRAFT}>Draft</SelectItem>
                <SelectItem value={ShipmentStatus.BOOKED}>Booked</SelectItem>
                <SelectItem value={ShipmentStatus.PICKED_UP}>Picked Up</SelectItem>
                <SelectItem value={ShipmentStatus.IN_TRANSIT}>In Transit</SelectItem>
                <SelectItem value={ShipmentStatus.AT_CUSTOMS}>At Customs</SelectItem>
                <SelectItem value={ShipmentStatus.CUSTOMS_CLEARED}>Customs Cleared</SelectItem>
                <SelectItem value={ShipmentStatus.OUT_FOR_DELIVERY}>Out for Delivery</SelectItem>
                <SelectItem value={ShipmentStatus.DELIVERED}>Delivered</SelectItem>
                <SelectItem value={ShipmentStatus.RETURNED}>Returned</SelectItem>
                <SelectItem value={ShipmentStatus.CANCELLED}>Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Payment Status Filter */}
            <Select
              value={paymentStatusFilter || allPaymentsValue}
              onValueChange={(value) => setPaymentStatusFilter(value === allPaymentsValue ? '' : value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allPaymentsValue}>All Payment</SelectItem>
                <SelectItem value={PaymentStatus.UNPAID}>Unpaid</SelectItem>
                <SelectItem value={PaymentStatus.PARTIALLY_PAID}>Partially Paid</SelectItem>
                <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
                <SelectItem value={PaymentStatus.REFUNDED}>Refunded</SelectItem>
                <SelectItem value={PaymentStatus.OVERDUE}>Overdue</SelectItem>
              </SelectContent>
            </Select>

            {/* Actions */}
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {shipments.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  {searchQuery || statusFilter || paymentStatusFilter 
                    ? 'No shipments found' 
                    : t('shipments.no_shipments')
                  }
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {searchQuery || statusFilter || paymentStatusFilter
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first shipment'
                  }
                </p>
                {!searchQuery && !statusFilter && !paymentStatusFilter && (
                  <Link href="/shipments/new" className="mt-4">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('shipments.create_first')}
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('shipments.tracking_number')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('shipments.sender_name')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('shipments.receiver_name')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('shipments.status')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('shipments.payment_status')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('shipments.shipped_date')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('shipments.eta')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('shipments.total_cost')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('common.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {shipments.map((shipment: any) => (
                        <tr key={shipment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link 
                              href={`/shipments/${shipment.id}`}
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              {shipment.tracking_number}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {shipment.sender_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {shipment.receiver_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusBadgeClass(shipment.status)}>
                              {shipment.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getPaymentStatusBadgeClass(shipment.payment_status)}>
                              {shipment.payment_status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {shipment.shipped_date ? 
                              new Date(shipment.shipped_date).toLocaleDateString() : 
                              '-'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {shipment.estimated_arrival ? 
                              new Date(shipment.estimated_arrival).toLocaleDateString() : 
                              '-'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {shipment.currency} {shipment.total_cost.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex space-x-2">
                              <Link href={`/shipments/${shipment.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Link href={`/shipments/${shipment.id}/edit`}>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, total)} of {total} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(pages, currentPage + 1))}
                  disabled={currentPage === pages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
