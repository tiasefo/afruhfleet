'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
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
  Tag,
  Package,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface TicketDetailProps {
  token: string
  initialTenant?: string
}

type Ticket = {
  id: string
  tenant_id: string
  public_token: string
  subject: string
  description: string
  category?: string | null
  priority: string
  status: string
  shipment_reference?: string | null
  tracking_reference?: string | null
  glpi_ticket_id?: string | null
}

type TicketMessage = {
  id: string
  ticket_id: string
  author_type: string
  author_name?: string | null
  body: string
  visible_to_public: boolean
}

const statusConfig = {
  open: {
    label: 'Open',
    color: 'bg-chart-5 text-white',
    icon: AlertCircle,
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-primary text-primary-foreground',
    icon: Clock,
  },
  awaiting_reply: {
    label: 'Awaiting Reply',
    color: 'bg-accent text-accent-foreground',
    icon: MessageSquare,
  },
  resolved: {
    label: 'Resolved',
    color: 'bg-chart-4 text-white',
    icon: CheckCircle2,
  },
}

const priorityConfig = {
  low: { label: 'Low', color: 'text-muted-foreground' },
  medium: { label: 'Medium', color: 'text-foreground' },
  high: { label: 'High', color: 'text-chart-5' },
  urgent: { label: 'Urgent', color: 'text-destructive' },
}

function joinApiUrl(base: string, path: string): string {
  const normalizedBase = base.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

export function TicketDetail({ token, initialTenant }: TicketDetailProps) {
  const router = useRouter()
  const [tenantId, setTenantId] = useState(initialTenant || process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || '')
  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    if (tenantId) {
      void loadTicket(tenantId)
    }
  }, [tenantId, token])

  const loadTicket = async (tenant: string) => {
    if (!apiBaseUrl || !tenant || !token) return

    setIsLoading(true)
    setError('')

    try {
      const ticketUrl = joinApiUrl(
        apiBaseUrl,
        `/support-crm/public/tickets/${encodeURIComponent(token)}?tenant_id=${encodeURIComponent(tenant)}`
      )
      const ticketResponse = await fetch(ticketUrl)
      if (!ticketResponse.ok) {
        throw new Error(await ticketResponse.text())
      }
      const ticketData = (await ticketResponse.json()) as Ticket
      setTicket(ticketData)

      const messagesUrl = joinApiUrl(
        apiBaseUrl,
        `/support-crm/public/tickets/${encodeURIComponent(token)}/messages?tenant_id=${encodeURIComponent(tenant)}`
      )
      const messagesResponse = await fetch(messagesUrl)
      if (!messagesResponse.ok) {
        throw new Error(await messagesResponse.text())
      }
      const messagesData = (await messagesResponse.json()) as TicketMessage[]
      setMessages(messagesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ticket')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !tenantId || !apiBaseUrl) return

    setIsSubmitting(true)
    setError('')

    try {
      const replyUrl = joinApiUrl(
        apiBaseUrl,
        `/support-crm/public/tickets/${encodeURIComponent(token)}/reply?tenant_id=${encodeURIComponent(tenantId)}`
      )
      const response = await fetch(replyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: replyText,
          author_type: 'public',
          author_name: 'Customer',
          visible_to_public: true,
        }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      setReplyText('')
      await loadTicket(tenantId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reply')
    } finally {
      setIsSubmitting(false)
    }
  }

  const status = ticket
    ? statusConfig[ticket.status as keyof typeof statusConfig] || {
        label: ticket.status,
        color: 'bg-muted text-muted-foreground',
        icon: AlertCircle,
      }
    : null

  const priority = ticket
    ? priorityConfig[ticket.priority as keyof typeof priorityConfig] || {
        label: ticket.priority,
        color: 'text-foreground',
      }
    : null

  const StatusIcon = status?.icon || AlertCircle

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        onClick={() => router.push('/support')}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Support
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ticket Lookup</CardTitle>
          <CardDescription>Tenant ID or slug is required for ticket access.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            placeholder="Tenant ID or slug"
          />
          <p className="text-xs text-muted-foreground">Token: {token}</p>
          {!ticket && !isLoading && (
            <Button onClick={() => void loadTicket(tenantId)} disabled={!tenantId || !apiBaseUrl}>
              Load Ticket
            </Button>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex items-center gap-2 py-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="flex items-center gap-2 py-4 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading ticket...</span>
          </CardContent>
        </Card>
      )}

      {ticket && status && priority && (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{ticket.public_token}</CardTitle>
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
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Category:</span>
                  <span>{ticket.category || 'N/A'}</span>
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
                    <Link href={`/track?q=${ticket.shipment_reference}&tenant=${encodeURIComponent(tenantId)}`} className="text-primary hover:underline">
                      {ticket.shipment_reference}
                    </Link>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">GLPI Ticket:</span>
                  <span>{ticket.glpi_ticket_id || 'Pending sync'}</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{ticket.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {messages.map((message, index) => (
                <div key={message.id}>
                  {index > 0 && <Separator className="mb-6" />}
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback
                        className={cn(
                          message.author_type === 'support' || message.author_type === 'admin'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {message.author_type === 'support' || message.author_type === 'admin' ? (
                          <Headphones className="h-5 w-5" />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{message.author_name || message.author_type}</span>
                        {(message.author_type === 'support' || message.author_type === 'admin') && (
                          <Badge variant="secondary" className="text-xs">Support Team</Badge>
                        )}
                      </div>
                      <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {message.body}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Separator />
              <form onSubmit={handleSubmitReply} className="space-y-4">
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your reply..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={!replyText.trim() || isSubmitting || !tenantId} className="gap-2">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Reply
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
