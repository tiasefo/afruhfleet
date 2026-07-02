'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { membersAPI, usersApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Users,
  UserPlus,
  Mail,
  Loader2,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Send,
  Upload,
  Phone,
  Building2,
  Package,
  FileText,
} from 'lucide-react'

export default function MembersPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [members, setMembers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    full_name: '',
    email: '',
    is_tenant_admin: false,
    send_invite_email: true,
  })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  const tenantId = user?.tenant_id || (typeof window !== 'undefined' ? localStorage.getItem('tenant_id') : null)

  const loadMembers = async () => {
    if (!tenantId) {
      setError('No tenant context. Please log in as a tenant user.')
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const data = await membersAPI.list({ q: search || undefined, page, page_size: pageSize })
      setMembers(data.items || [])
      setTotal(data.total || 0)
    } catch (err: any) {
      setError(err?.message || 'Failed to load members')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [tenantId, page])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) {
        setPage(1)
      } else {
        loadMembers()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError(null)
    setInviteSuccess(null)
    if (!inviteForm.full_name.trim() || !inviteForm.email.trim()) {
      setInviteError('Full name and email are required.')
      return
    }
    if (!tenantId) {
      setInviteError('Could not determine tenant. Please re-login.')
      return
    }
    setInviteLoading(true)
    try {
      await usersApi.invite(tenantId, {
        email: inviteForm.email.trim(),
        full_name: inviteForm.full_name.trim(),
        send_invite_email: inviteForm.send_invite_email,
        is_tenant_admin: inviteForm.is_tenant_admin,
      })
      setInviteSuccess(
        inviteForm.send_invite_email
          ? `Invite sent to ${inviteForm.email}! They will receive an email to set their password.`
          : `Team member ${inviteForm.full_name} added successfully.`
      )
      setInviteForm({ full_name: '', email: '', is_tenant_admin: false, send_invite_email: true })
      loadMembers()
    } catch (err: any) {
      setInviteError(err?.message || 'Failed to send invite. The email may already be registered.')
    } finally {
      setInviteLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Team Members
              </h1>
              <p className="mt-1 text-sm text-gray-500">Manage your team and their permissions</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadMembers} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/members/import">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Import CSV
                </Button>
              </Link>
              <Dialog open={inviteOpen} onOpenChange={(open) => { setInviteOpen(open); if (!open) { setInviteError(null); setInviteSuccess(null) } }}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Invite a Team Member
                    </DialogTitle>
                  </DialogHeader>
                  {inviteSuccess ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-green-700">{inviteSuccess}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => { setInviteSuccess(null); setInviteOpen(false) }}
                        >
                          Done
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={() => setInviteSuccess(null)}
                        >
                          Invite Another
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleInvite} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Full Name *</label>
                        <Input
                          placeholder="Jane Doe"
                          value={inviteForm.full_name}
                          onChange={(e) => setInviteForm((f) => ({ ...f, full_name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email Address *</label>
                        <Input
                          type="email"
                          placeholder="jane@company.com"
                          value={inviteForm.email}
                          onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-primary"
                            checked={inviteForm.send_invite_email}
                            onChange={(e) => setInviteForm((f) => ({ ...f, send_invite_email: e.target.checked }))}
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                              <Send className="h-3.5 w-3.5" />
                              Send invite email
                            </span>
                            <p className="text-xs text-gray-500">User will receive an email to set their password</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-primary"
                            checked={inviteForm.is_tenant_admin}
                            onChange={(e) => setInviteForm((f) => ({ ...f, is_tenant_admin: e.target.checked }))}
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                              <Shield className="h-3.5 w-3.5" />
                              Admin access
                            </span>
                            <p className="text-xs text-gray-500">Can manage settings, billing and members</p>
                          </div>
                        </label>
                      </div>
                      {inviteError && (
                        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                          <p className="text-sm text-red-600">{inviteError}</p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setInviteOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={inviteLoading}>
                          {inviteLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Mail className="h-4 w-4 mr-2" />
                          )}
                          {inviteForm.send_invite_email ? 'Send Invite' : 'Add Member'}
                        </Button>
                      </div>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-4 relative max-w-md">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search members by name, email, phone, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {total} member{total !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="py-10 text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-400" />
                <p className="text-red-500">{error}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={loadMembers}>Retry</Button>
              </div>
            ) : members.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                <h3 className="text-base font-medium text-gray-600 mb-2">
                  {search ? 'No members match your search' : 'No members yet'}
                </h3>
                <p className="text-sm text-gray-500 mb-5">
                  {search ? 'Try a different search term' : 'Import members via CSV or invite them individually'}
                </p>
                {!search && (
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => setInviteOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Member
                    </Button>
                    <Link href="/members/import">
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Bulk Import
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Goods Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipments</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {members.map((member) => (
                      <tr
                        key={member.id}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/members/${member.id}`)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                              {member.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="font-medium text-gray-900 text-sm">{member.full_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {member.email ? (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {member.email}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {member.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {member.phone}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                          {member.notes || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {member.company ? (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-gray-400" />
                              {member.company}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {member.is_active ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle className="h-3.5 w-3.5" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                              <XCircle className="h-3.5 w-3.5" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <Package className="h-3 w-3 text-gray-400" />
                            {member.shipment_count ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {member.created_at ? new Date(member.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {total > pageSize && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <span className="text-sm text-gray-500">
                      Page {page} of {Math.ceil(total / pageSize)}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= Math.ceil(total / pageSize)}
                        onClick={() => setPage(p => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
