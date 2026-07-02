'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { membersAPI } from '@/lib/api'
import { resolveTenantId } from '@/lib/tenant'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  User,
  Building2,
  Package,
  FileText,
  Calculator,
  MapPin,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Activity,
  Search,
  Key,
  Send,
  Loader2,
} from 'lucide-react'

export default function MemberDetailPage({ params }: { params: { id: string } }) {
  const [member, setMember] = useState<any>(null)
  const [shipments, setShipments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resetSending, setResetSending] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const memberData = await membersAPI.get(params.id)
        setMember(memberData)

        const tid = memberData.tenant_id || resolveTenantId()
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
        const resp = await fetch(
          `/api/v1/shipments/${tid}/members/${params.id}/shipments`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        )
        if (resp.ok) {
          const data = await resp.json()
          setShipments(data.items || [])
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load member.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error || !member) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error || 'Member not found.'}
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      booked: 'bg-blue-100 text-blue-800',
      picked_up: 'bg-green-100 text-green-800',
      in_transit: 'bg-yellow-100 text-yellow-800',
      at_customs: 'bg-orange-100 text-orange-800',
      customs_cleared: 'bg-purple-100 text-purple-800',
      out_for_delivery: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      returned: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    }
    return map[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/members">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Members
            </Button>
          </Link>
          <Link href={`/members/${params.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Member
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-2xl">
                  {member.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <CardTitle className="text-2xl">{member.full_name}</CardTitle>
                  <p className="mt-1 text-sm text-gray-600">Member profile and shipment tracking</p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {member.is_active ? (
                      <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800"><XCircle className="h-3 w-3 mr-1" /> Inactive</Badge>
                    )}
                    {member.company && (
                      <Badge variant="outline" className="text-xs">
                        <Building2 className="h-3 w-3 mr-1" /> {member.company}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      <Package className="h-3 w-3 mr-1" /> {member.shipment_count ?? shipments.length} shipments
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column — Profile Details */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="h-3 w-3" /> Email</p>
                  <p className="mt-1 font-medium text-sm text-gray-900">{member.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</p>
                  <p className="mt-1 font-medium text-sm text-gray-900">{member.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Building2 className="h-3 w-3" /> Company</p>
                  <p className="mt-1 font-medium text-sm text-gray-900">{member.company || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><FileText className="h-3 w-3" /> ID Number</p>
                  <p className="mt-1 font-medium text-sm text-gray-900">{member.id_number || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Globe className="h-3 w-3" /> Preferred Language</p>
                  <p className="mt-1 font-medium text-sm text-gray-900">{member.preferred_language === 'zh' ? 'Chinese' : 'English'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Goods Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-900 rounded-lg border bg-white px-4 py-3">
                  {member.notes || 'No goods description recorded.'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Key className="h-4 w-4" />
                  Login Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Login Email</p>
                  <p className="mt-1 font-mono text-sm text-gray-900 break-all">{member.email || 'Not set'}</p>
                </div>
                <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                  <p className="text-xs text-amber-800">
                    Default password: <code className="font-mono font-bold">afruheritage@1</code>
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Member should change this after first login.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={resetSending || resetSent}
                  onClick={async () => {
                    setResetSending(true)
                    try {
                      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
                      const res = await fetch(`/api/v1/users/${member.user_id || member.id}/send-reset-link`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                      })
                      if (res.ok) {
                        setResetSent(true)
                      } else {
                        alert('Failed to send reset link')
                      }
                    } catch {
                      alert('Failed to send reset link')
                    } finally {
                      setResetSending(false)
                    }
                  }}
                >
                  {resetSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : resetSent ? <CheckCircle className="h-4 w-4 mr-2 text-green-600" /> : <Send className="h-4 w-4 mr-2" />}
                  {resetSent ? 'Reset Link Sent' : 'Send Password Reset Link'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/track">
                  <Button variant="outline" className="w-full justify-start">
                    <Search className="h-4 w-4 mr-2" />
                    Track a Shipment
                  </Button>
                </Link>
                <Link href="/customs/duty-calculator">
                  <Button variant="outline" className="w-full justify-start">
                    <Calculator className="h-4 w-4 mr-2" />
                    Duty Calculator
                  </Button>
                </Link>
                <Link href="/shipments">
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="h-4 w-4 mr-2" />
                    View All Shipments
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Right Column — Shipment History & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4" />
                  Shipment History ({shipments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {shipments.length === 0 ? (
                  <div className="py-12 text-center">
                    <Package className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-500">No shipments assigned to this member yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking #</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ETA</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {shipments.map((s) => (
                          <tr key={s.id} className="hover:bg-blue-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                              <Link href={`/track?tracking_number=${encodeURIComponent(s.tracking_number)}`} className="text-blue-600 hover:text-blue-900">
                                {s.tracking_number}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="flex items-center gap-1 text-xs">
                                <span>{s.origin_city || '—'}</span>
                                <ArrowLeft className="h-3 w-3 rotate-180 text-gray-400" />
                                <span>{s.destination_city || '—'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Badge className={`${getStatusBadge(s.status)} text-xs`}>
                                {s.status?.replace(/_/g, ' ').toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                              {s.estimated_arrival ? new Date(s.estimated_arrival).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                              {s.currency} {s.total_cost?.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Member profile created</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {member.created_at ? new Date(member.created_at).toLocaleString() : '—'}
                      </p>
                    </div>
                  </div>
                  {shipments.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {shipments.length} shipment{shipments.length !== 1 ? 's' : ''} assigned
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Latest: {shipments[0]?.tracking_number} — {shipments[0]?.status?.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  )}
                  {member.notes && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <FileText className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Goods description added</p>
                        <p className="text-xs text-gray-500 mt-0.5">{member.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}