'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { usersApi } from '@/lib/api'
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
} from 'lucide-react'

function getRoleLabel(user: any): string {
  if (user.is_tenant_admin) return 'Admin'
  return user.role?.replace(/_/g, ' ') || 'Member'
}

export default function MembersPage() {
  const { user, token } = useAuth()
  const [members, setMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

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

  const tenantId = user?.tenant_id

  const loadMembers = async () => {
    if (!tenantId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await usersApi.list(tenantId)
      setMembers(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err?.message || 'Failed to load team members')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [tenantId])

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

  const filtered = members.filter((m) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      m.full_name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
              <Dialog open={inviteOpen} onOpenChange={(open) => { setInviteOpen(open); if (!open) { setInviteError(null); setInviteSuccess(null) } }}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <Link href="/members/import" className="ml-2">
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Import CSV
                  </Button>
                </Link>
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-4 relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search members by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {members.length} team member{members.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
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
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                <h3 className="text-base font-medium text-gray-600 mb-2">
                  {search ? 'No members match your search' : 'No team members yet'}
                </h3>
                <p className="text-sm text-gray-500 mb-5">
                  {search ? 'Try a different search term' : 'Invite your first team member to get started'}
                </p>
                {!search && (
                  <Button onClick={() => setInviteOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Your First Member
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {filtered.map((member) => (
                  <div key={member.id} className="py-4 flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {member.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{member.full_name}</p>
                        {member.is_tenant_admin && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Shield className="h-3 w-3" /> Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                        <Mail className="h-3 w-3 shrink-0" />
                        {member.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {member.is_active ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="h-3.5 w-3.5" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <XCircle className="h-3.5 w-3.5" /> Inactive
                        </span>
                      )}
                      {member.must_reset_password && (
                        <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                          Invite Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
