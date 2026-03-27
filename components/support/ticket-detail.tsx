'use client'

import { useState } from 'react'
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

// Demo ticket data
const demoTicket = {
  id: 'TKT-001',
  subject: 'Shipment delayed at customs - Need urgent assistance',
  status: 'in_progress',
  priority: 'high',
  category: 'Customs Clearance',
  createdAt: '2024-03-15T10:30:00Z',
  updatedAt: '2024-03-15T14:45:00Z',
  shipmentRef: 'AFR-2024-12847',
  customer: {
    name: 'James Mensah',
    email: 'james@example.com',
  },
  messages: [
    {
      id: '1',
      author: 'customer',
      name: 'James Mensah',
      content: 'My shipment AFR-2024-12847 has been stuck at Tema Port customs for 5 days now. The tracking shows "At Customs" but there have been no updates. This is a time-sensitive cargo and I need it cleared urgently. Can you please help?',
      timestamp: '2024-03-15T10:30:00Z',
    },
    {
      id: '2',
      author: 'support',
      name: 'Sarah Adjei',
      content: 'Hello James,\n\nThank you for reaching out. I understand the urgency of your situation. I have checked your shipment AFR-2024-12847 and I can see it is currently undergoing customs verification.\n\nI have escalated this to our customs clearance team and they are working on expediting the process. We expect an update within the next 24 hours.\n\nIn the meantime, could you please confirm that all required documents (Commercial Invoice, Packing List, IDF) have been submitted? If there are any missing documents, please upload them here.',
      timestamp: '2024-03-15T11:45:00Z',
    },
    {
      id: '3',
      author: 'customer',
      name: 'James Mensah',
      content: 'Thank you for the quick response, Sarah. Yes, all documents were submitted. I have attached them again just in case. Please let me know as soon as there is any progress.',
      timestamp: '2024-03-15T12:20:00Z',
    },
    {
      id: '4',
      author: 'support',
      name: 'Sarah Adjei',
      content: 'Thank you for confirming, James. I have received the documents and forwarded them to customs. Our team is actively working on this. I will update you as soon as we have more information. Expect an update by end of day today.',
      timestamp: '2024-03-15T14:45:00Z',
    },
  ],
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

export function TicketDetail({ token }: TicketDetailProps) {
  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [messages, setMessages] = useState(demoTicket.messages)

  const status = statusConfig[demoTicket.status as keyof typeof statusConfig]
  const priority = priorityConfig[demoTicket.priority as keyof typeof priorityConfig]
  const StatusIcon = status.icon

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim()) return

    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newMessage = {
      id: Date.now().toString(),
      author: 'customer',
      name: demoTicket.customer.name,
      content: replyText,
      timestamp: new Date().toISOString(),
    }

    setMessages([...messages, newMessage])
    setReplyText('')
    setIsSubmitting(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/support"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Support
      </Link>

      {/* Ticket Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle>{demoTicket.id}</CardTitle>
                <Badge className={cn('gap-1', status.color)}>
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </Badge>
              </div>
              <CardDescription className="text-base">
                {demoTicket.subject}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span>{formatDate(demoTicket.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Category:</span>
              <span>{demoTicket.category}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className={cn('h-4 w-4', priority.color)} />
              <span className="text-muted-foreground">Priority:</span>
              <span className={priority.color}>{priority.label}</span>
            </div>
            {demoTicket.shipmentRef && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Shipment:</span>
                <Link href={`/track?q=${demoTicket.shipmentRef}`} className="text-primary hover:underline">
                  {demoTicket.shipmentRef}
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conversation Thread */}
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
                      message.author === 'support'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {message.author === 'support' ? (
                      <Headphones className="h-5 w-5" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{message.name}</span>
                    {message.author === 'support' && (
                      <Badge variant="secondary" className="text-xs">
                        Support Team
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(message.timestamp)}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {message.content}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Reply Form */}
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
              <Button type="submit" disabled={!replyText.trim() || isSubmitting} className="gap-2">
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

      {/* Help Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Need faster assistance?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Use our AI chat assistant for instant answers, or call our support line for urgent matters.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  Open AI Chat
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a href="tel:+233000000000">Call Support</a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
