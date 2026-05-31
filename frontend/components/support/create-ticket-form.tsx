'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Loader2, Send, Copy, ExternalLink, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const categories = [
  { value: 'shipment', label: 'Shipment Issue' },
  { value: 'tracking', label: 'Tracking Problem' },
  { value: 'billing', label: 'Billing & Payment' },
  { value: 'customs', label: 'Customs Clearance' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'other', label: 'Other' },
]

const priorities = [
  { value: 'low', label: 'Low', description: 'General inquiry' },
  { value: 'medium', label: 'Medium', description: 'Non-urgent issue' },
  { value: 'high', label: 'High', description: 'Affecting operations' },
  { value: 'urgent', label: 'Urgent', description: 'Critical issue' },
]

type TicketResult = {
  ticketId: string
  publicToken: string
  trackingUrl: string
}

function joinApiUrl(base: string, path: string): string {
  const normalizedBase = base.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

export function CreateTicketForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [ticketResult, setTicketResult] = useState<TicketResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const [tenantId, setTenantId] = useState(process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || '')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState('shipment')
  const [priority, setPriority] = useState('medium')
  const [tracking, setTracking] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!apiBaseUrl) {
      setError('API base URL is not configured for this environment.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const payload = {
        tenant_id: tenantId,
        public_submitter_name: name,
        public_submitter_email: email || null,
        subject,
        description,
        category,
        priority,
        shipment_reference: tracking || null,
        tracking_reference: tracking || null,
      }

      const url = joinApiUrl(apiBaseUrl, `/support-crm/public/tickets?tenant_id=${encodeURIComponent(tenantId)}`)
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()
      setTicketResult({
        ticketId: data.id,
        publicToken: data.public_token,
        trackingUrl: `/support/ticket/${data.public_token}?tenant=${encodeURIComponent(tenantId)}`,
      })

      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyToken = () => {
    if (ticketResult) {
      navigator.clipboard.writeText(ticketResult.publicToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleNewTicket = () => {
    setIsSubmitted(false)
    setTicketResult(null)
    setSubject('')
    setDescription('')
    setTracking('')
  }

  if (isSubmitted && ticketResult) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-4/10">
              <CheckCircle2 className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <CardTitle>Ticket Created Successfully</CardTitle>
              <CardDescription>
                Your support request has been submitted
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ticket ID</span>
                <Badge variant="outline">{ticketResult.ticketId}</Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">Tracking Token</span>
                <div className="flex items-center gap-2">
                  <code className="rounded bg-muted px-2 py-1 text-xs">
                    {ticketResult.publicToken}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleCopyToken}
                  >
                    <Copy className={cn('h-3.5 w-3.5', copied && 'text-chart-4')} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
            <h4 className="font-medium text-foreground">Important</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Save your tracking token and tenant ID to check the status of your ticket.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1 gap-2">
              <a href={ticketResult.trackingUrl}>
                <ExternalLink className="h-4 w-4" />
                View Ticket
              </a>
            </Button>
            <Button variant="outline" onClick={handleNewTicket} className="flex-1">
              Create Another Ticket
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a Support Ticket</CardTitle>
        <CardDescription>
          Fill out the form below and our team will get back to you as soon as possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="tenant">Tenant ID or slug</FieldLabel>
              <Input id="tenant" value={tenantId} onChange={(e) => setTenantId(e.target.value)} required />
            </Field>
          </FieldGroup>

          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </Field>
            </div>
          </FieldGroup>

          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="category">Category</FieldLabel>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="priority">Priority</FieldLabel>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <div className="flex items-center gap-2">
                          <span>{p.label}</span>
                          <span className="text-xs text-muted-foreground">({p.description})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FieldGroup>

          <Field>
            <FieldLabel htmlFor="tracking">Shipment or Tracking Reference (Optional)</FieldLabel>
            <Input id="tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking number or reference" />
          </Field>

          <Field>
            <FieldLabel htmlFor="subject">Subject</FieldLabel>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief description of your issue" required />
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide as much detail as possible about your issue..."
              rows={5}
              required
            />
          </Field>

          <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Ticket
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
