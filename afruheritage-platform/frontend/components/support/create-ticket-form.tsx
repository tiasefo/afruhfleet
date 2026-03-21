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
import { CheckCircle2, Loader2, Send, Copy, ExternalLink } from 'lucide-react'
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

interface TicketResult {
  ticketId: string
  publicToken: string
  trackingUrl: string
}

export function CreateTicketForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [ticketResult, setTicketResult] = useState<TicketResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('medium')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const form = e.currentTarget
    const name = (form.querySelector('#name') as HTMLInputElement)?.value || ''
    const email = (form.querySelector('#email') as HTMLInputElement)?.value || ''
    const subject = (form.querySelector('#subject') as HTMLInputElement)?.value || ''
    const description = (form.querySelector('#description') as HTMLTextAreaElement)?.value || ''
    const tracking = (form.querySelector('#tracking') as HTMLInputElement)?.value || ''

    try {
      const res = await fetch('/api/v1/support-crm/public/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: 'platform',
          public_submitter_name: name,
          public_submitter_email: email,
          subject,
          description,
          category: category || 'other',
          priority,
          shipment_reference: tracking || null,
          tracking_reference: tracking || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: 'Failed to create ticket' }))
        throw new Error(body.detail || 'Submission failed')
      }

      const data = await res.json()
      setTicketResult({
        ticketId: data.id || data.ticket_id,
        publicToken: data.public_token,
        trackingUrl: `/support/ticket/${data.public_token}`,
      })
      setIsSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Failed to submit ticket')
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
                    <Copy className={cn("h-3.5 w-3.5", copied && "text-chart-4")} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
            <h4 className="font-medium text-foreground">Important</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Save your tracking token to check the status of your ticket at any time. 
              You will also receive email updates when our team responds.
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input id="name" placeholder="Your name" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <Input id="email" type="email" placeholder="you@example.com" required />
              </Field>
            </div>
          </FieldGroup>

          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="category">Category</FieldLabel>
                <Select value={category} onValueChange={setCategory}>
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
            <FieldLabel htmlFor="tracking">Shipment Reference (Optional)</FieldLabel>
            <Input id="tracking" placeholder="Tracking number or reference" />
          </Field>

          <Field>
            <FieldLabel htmlFor="subject">Subject</FieldLabel>
            <Input id="subject" placeholder="Brief description of your issue" required />
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
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
