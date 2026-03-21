'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Clock, 
  Send, 
  Loader2,
  User,
  Headphones,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Calendar,
  Tag,
  Package
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface TicketDetailProps {
  token: string
}

interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  category: string
  created_at: string
  updated_at: string
  shipment_reference?: string
  public_submitter_name: string
  public_submitter_email: string
}

interface TicketMessage {
  id: string
  sender_type: string
  sender_name: string
  body: string
  created_at: string
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: 'Open', color: 'bg-chart-5 text-white', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-primary text-primary-foreground', icon: Clock },
  awaiting_reply: { label: 'Awaiting Reply', color: 'bg-accent text-accent-foreground', icon: MessageSquare },
  resolved: { label: 'Resolved', color: 'bg-chart-4 text-white', icon: CheckCircle2 },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-muted-foreground' },
  medium: { label: 'Medium', color: 'text-foreground' },
  high: { label: 'High', color: 'text-chart-5' },
  urgent: { label: 'Urgent', color: 'text-destructive' },
}

export function TicketDetail({ token }: TicketDetailProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTicket()
  }, [token])

  const loadTicket = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/support-crm/public/tickets/${token}`)
      if (!res.ok) {
        if (res.status === 404) throw new Error('Ticket not found. Please check your tracking token.')
        throw new Error('Failed to load ticket')
      }
      const data = await res.json()
      setTicket(data)

      const msgRes = await fetch(`/api/v1/support-crm/public/tickets/${token}/messages`)
      if (msgRes.ok) {
        const msgData = await msgRes.json()
        setMessages(Array.isArray(msgData) ? msgData : msgData.items || [])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/v1/support-crm/public/tickets/${token}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyText }),
      })
      if (!res.ok) throw new Error('Failed to send reply')

      setReplyText('')
      await loadTicket()
    } catch (err: any) {
      setError(err.message || 'Failed to send reply')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="space-y-6">
        <Link href="/support" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Support
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{error || 'Ticket not found'}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Please check your tracking token and try again.
            </p>
            <Button asChild className="mt-6">
              <Link href="/support">Go to Support</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = statusConfig[ticket.status] || statusConfig.open
  const priority = priorityConfig[ticket.priority] || priorityConfig.medium
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      <Link href="/support" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Support
      </Link>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle>{ticket.id}</CardTitle>
                <Badge className={cn('gap-1', status.color)}>
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </Badge>
              </div>
              <CardDescription className="text-base">{ticket.subject}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span>{formatDate(ticket.created_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Category:</span>
              <span>{ticket.category}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className={cn('h-4 w-4', priority.color)} />
              <span className="text-muted-foreground">Priority:</span>
              <span className={priority.color}>{priority.label}</span>
            </div>
            {ticket.shipment_reference && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Shipment:</span>
                <Link href={`/track?q=${ticket.shipment_reference}`} className="text-primary hover:underline">
                  {ticket.shipment_reference}
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No messages yet.</p>
          ) : (
            messages.map((message, index) => (
              <div key={message.id}>
                {index > 0 && <Separator className="mb-6" />}
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className={cn(
                      message.sender_type === 'support' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      {message.sender_type === 'support' ? <Headphones className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{message.sender_name}</span>
                      {message.sender_type === 'support' && (
                        <Badge variant="secondary" className="text-xs">Support Team</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{formatDate(message.created_at)}</span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm text-muted-foreground">{message.body}</div>
                  </div>
                </div>
              </div>
            ))
          )}

          <Separator />
          <form onSubmit={handleSubmitReply} className="space-y-4">
            <div className="flex gap-4">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write your reply..." rows={4} className="resize-none" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={!replyText.trim() || isSubmitting} className="gap-2">
                {isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" />Sending...</>) : (<><Send className="h-4 w-4" />Send Reply</>)}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
