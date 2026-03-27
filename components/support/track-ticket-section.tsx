'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, ArrowRight, Clock, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const recentTickets = [
  {
    id: 'TKT-001',
    subject: 'Shipment delayed at customs',
    status: 'in_progress',
    lastUpdate: '2 hours ago',
  },
  {
    id: 'TKT-002',
    subject: 'Invoice discrepancy',
    status: 'awaiting_reply',
    lastUpdate: '1 day ago',
  },
  {
    id: 'TKT-003',
    subject: 'Tracking not updating',
    status: 'resolved',
    lastUpdate: '3 days ago',
  },
]

const statusConfig = {
  open: {
    label: 'Open',
    variant: 'default' as const,
    icon: AlertCircle,
  },
  in_progress: {
    label: 'In Progress',
    variant: 'secondary' as const,
    icon: Clock,
  },
  awaiting_reply: {
    label: 'Awaiting Reply',
    variant: 'outline' as const,
    icon: MessageSquare,
  },
  resolved: {
    label: 'Resolved',
    variant: 'secondary' as const,
    icon: CheckCircle2,
  },
}

export function TrackTicketSection() {
  const [isSearching, setIsSearching] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchValue.trim()) return
    
    setIsSearching(true)
    // Simulate search
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSearching(false)
    
    // In production, this would navigate to the ticket detail page
    window.location.href = `/support/ticket/${searchValue}`
  }

  return (
    <div className="space-y-6">
      {/* Track Ticket Card */}
      <Card>
        <CardHeader>
          <CardTitle>Track Your Ticket</CardTitle>
          <CardDescription>
            Enter your ticket ID or tracking token to view the status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="ticket-search">Ticket ID or Token</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="ticket-search"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="TKT-001 or tracking token"
                  className="flex-1"
                />
                <Button type="submit" disabled={isSearching || !searchValue.trim()}>
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Field>
          </form>
        </CardContent>
      </Card>

      {/* Recent Tickets (Demo) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Example Tickets</CardTitle>
          <CardDescription>
            Click on a ticket to see how the tracking page looks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTickets.map((ticket) => {
              const status = statusConfig[ticket.status as keyof typeof statusConfig]
              const StatusIcon = status.icon
              
              return (
                <Link
                  key={ticket.id}
                  href={`/support/ticket/${ticket.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <StatusIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{ticket.id}</span>
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{ticket.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="hidden sm:inline">{ticket.lastUpdate}</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground">Need urgent help?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            For critical issues, contact us directly:
          </p>
          <div className="mt-4 space-y-2">
            <a
              href="mailto:support@afruheritage.com"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <MessageSquare className="h-4 w-4" />
              support@afruheritage.com
            </a>
            <a
              href="tel:+233000000000"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              +233 (0) 00 000 0000
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
