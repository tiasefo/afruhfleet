'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supportAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search, MessageSquare, Mail, User, Clock, Send, AlertCircle } from 'lucide-react'

interface Ticket {
  id: string
  subject: string
  description: string
  status: string
  priority: string
  category?: string
  public_submitter_name?: string
  public_submitter_email?: string
  created_at: string
  public_token: string
}

interface TicketMessage {
  id: string
  author_type: string
  author_name: string
  body: string
  created_at?: string
}

export default function SupportDashboardPage() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [replyBody, setReplyBody] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)

  const loadTickets = async () => {
    setLoading(true)
    setError('')
    try {
      const params: any = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (search.trim()) params.q = search.trim()
      const res: any = await supportAPI.listTickets(params)
      setTickets(res.items || [])
    } catch (err: any) {
      setError(err?.message || 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const openTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setMessagesLoading(true)
    try {
      const msgs: any = await supportAPI.getTicketMessages(ticket.id)
      setMessages(msgs || [])
    } catch (e) {
      console.error(e)
    } finally {
      setMessagesLoading(false)
    }
  }

  const sendReply = async () => {
    if (!selectedTicket || !replyBody.trim()) return
    setSendingReply(true)
    try {
      await supportAPI.replyToTicket(selectedTicket.id, replyBody.trim())
      setReplyBody('')
      const msgs: any = await supportAPI.getTicketMessages(selectedTicket.id)
      setMessages(msgs || [])
      await loadTickets()
    } catch (e: any) {
      alert(e?.message || 'Failed to send reply')
    } finally {
      setSendingReply(false)
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'waiting_customer': return 'bg-orange-100 text-orange-700'
      case 'resolved': return 'bg-green-100 text-green-700'
      case 'closed': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Support Tickets</h1>
        <p className="text-gray-600">Manage customer support requests for your store</p>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadTickets()}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="waiting_customer">Waiting Customer</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={loadTickets} variant="outline">Filter</Button>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets ({tickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="mx-auto h-10 w-10 mb-3" />
              <p className="font-medium">No tickets yet</p>
              <p className="text-sm mt-1">Customer support requests will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="p-3 font-medium">Subject</th>
                    <th className="p-3 font-medium">Customer</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Priority</th>
                    <th className="p-3 font-medium">Created</th>
                    <th className="p-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => openTicket(ticket)}>
                      <td className="p-3">
                        <div className="font-medium">{ticket.subject}</div>
                        <div className="text-xs text-gray-500 line-clamp-1">{ticket.description}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-gray-600">
                          <User className="h-3 w-3" />
                          {ticket.public_submitter_name || 'Anonymous'}
                        </div>
                        {ticket.public_submitter_email && (
                          <div className="flex items-center gap-1 text-gray-400 text-xs">
                            <Mail className="h-3 w-3" />
                            {ticket.public_submitter_email}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge className={statusColor(ticket.status)}>{ticket.status.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="p-3 capitalize text-gray-600">{ticket.priority}</td>
                      <td className="p-3 text-gray-500 text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3">
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openTicket(ticket) }}>
                          Reply
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => { if (!open) setSelectedTicket(null) }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <p className="text-gray-700">{selectedTicket?.description}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <span>From: {selectedTicket?.public_submitter_name || 'Anonymous'}</span>
                <span>•</span>
                <span>{selectedTicket?.public_submitter_email || 'No email'}</span>
                <span>•</span>
                <span>Token: {selectedTicket?.public_token}</span>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto border rounded-lg p-3">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-4">No replies yet</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`p-3 rounded-lg ${msg.author_type === 'staff' ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{msg.author_name}</span>
                      <Badge variant="outline" className="text-[10px]">{msg.author_type}</Badge>
                    </div>
                    <p className="text-sm text-gray-700">{msg.body}</p>
                  </div>
                ))
              )}
            </div>

            {/* Reply Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Type your reply..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendReply()}
                className="flex-1"
              />
              <Button onClick={sendReply} disabled={sendingReply || !replyBody.trim()}>
                {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            {/* Status Update */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-sm text-gray-600">Update status:</span>
              <Select
                value={selectedTicket?.status}
                onValueChange={async (status) => {
                  if (!selectedTicket) return
                  try {
                    await supportAPI.updateTicketStatus(selectedTicket.id, status)
                    setSelectedTicket({ ...selectedTicket, status })
                    loadTickets()
                  } catch (e: any) {
                    alert(e?.message || 'Failed to update status')
                  }
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="waiting_customer">Waiting Customer</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
