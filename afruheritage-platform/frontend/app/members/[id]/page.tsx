'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { membersAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, ArrowLeft, Edit, Mail, Phone, User } from 'lucide-react'

export default function MemberDetailPage({ params }: { params: { id: string } }) {
  const [member, setMember] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMember = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await membersAPI.get(params.id)
        setMember(data)
      } catch (err: any) {
        setError(err?.message || 'Failed to load member.')
      } finally {
        setIsLoading(false)
      }
    }

    loadMember()
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
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

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <User className="h-6 w-6" />
                  {member.full_name}
                </CardTitle>
                <p className="mt-2 text-sm text-gray-600">Member profile and shipment assignment summary.</p>
              </div>
              <Badge className={member.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {member.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="mt-1 flex items-center gap-2 font-medium text-gray-900">
                    <Mail className="h-4 w-4 text-gray-500" />
                    {member.email || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="mt-1 flex items-center gap-2 font-medium text-gray-900">
                    <Phone className="h-4 w-4 text-gray-500" />
                    {member.phone || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Company</p>
                  <p className="mt-1 font-medium text-gray-900">{member.company || 'Not provided'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">ID Number</p>
                  <p className="mt-1 font-medium text-gray-900">{member.id_number || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Preferred Language</p>
                  <p className="mt-1 font-medium text-gray-900">{member.preferred_language === 'zh' ? 'Chinese' : 'English'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Assigned Shipments</p>
                  <p className="mt-1 font-medium text-gray-900">{member.shipment_count}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600">Notes</p>
              <p className="mt-1 rounded-lg border bg-white px-4 py-3 text-sm text-gray-900">
                {member.notes || 'No notes recorded for this member.'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="mt-1 font-medium text-gray-900">{new Date(member.created_at).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}