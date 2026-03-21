'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useBranding } from '@/hooks/useBranding'
import { useTranslation } from '@/hooks/useTranslation'
import { membersAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Users, Mail, Phone, Edit, Eye } from 'lucide-react'

export default function MembersPage() {
  const { user } = useAuth()
  const { branding } = useBranding()
  const { t } = useTranslation()
  
  const [members, setMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  // Load members
  const loadMembers = async () => {
    setIsLoading(true)
    try {
      const data = await membersAPI.list({
        q: searchQuery || undefined,
        page: currentPage,
        page_size: pageSize,
      })
      setMembers(data.items || [])
    } catch (error) {
      console.error('Failed to load members:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [searchQuery, currentPage])

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
              <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
              <p className="mt-2 text-sm text-gray-600">Manage your team members and their permissions</p>
            </div>
            <div className="flex space-x-3">
              <Link href="/members/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {members.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No team members yet</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Add team members to help manage your shipments
                </p>
                <Link href="/members/new" className="mt-4">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Member
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {members.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium text-gray-600">
                          {member.full_name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{member.full_name}</h3>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          {member.phone && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Phone className="w-3 h-3 mr-1" />
                              {member.phone}
                            </div>
                          )}
                          {member.company && (
                            <div className="text-sm text-gray-500">{member.company}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={member.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Link href={`/members/${member.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href={`/members/${member.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
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
