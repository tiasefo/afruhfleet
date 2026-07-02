"use client"

import { useState } from "react"
import { CheckCircle2, LifeBuoy, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const categories = [
  "Tracking / Can't find my package",
  "Address confirmation / Shipping mark",
  "Billing & Payments",
  "Procurement (Buy for me)",
  "Redirect package (Sea ↔ Air)",
  "Damaged or missing goods",
  "Other",
]

function makeTicketId() {
  const n = Math.floor(100000 + Math.random() * 900000)
  return `AMK-${n}`
}

export function SupportForm() {
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [category, setCategory] = useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      const id = makeTicketId()
      setSubmitted(id)
      setSubmitting(false)
      toast.success("Support ticket submitted", {
        description: `Your reference is ${id}.`,
      })
    }, 700)
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-8" />
        </span>
        <h2 className="mt-4 text-xl font-bold text-foreground">
          Ticket Received
        </h2>
        <p className="mt-2 text-muted-foreground">
          Thank you. Our support team will respond as soon as possible. Please keep
          your reference for follow-up.
        </p>
        <p className="mt-4 inline-block rounded-lg bg-muted px-4 py-2 font-mono text-lg font-semibold text-foreground">
          {submitted}
        </p>
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(null)
              setCategory("")
            }}
          >
            Submit another ticket
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card p-6 md:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <LifeBuoy className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Submit a Support Ticket
          </h2>
          <p className="text-sm text-muted-foreground">
            We typically respond within 24 hours.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" required placeholder="Your name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone / WhatsApp</Label>
          <Input id="phone" name="phone" required placeholder="+233 ..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mark">Shipping mark / name</Label>
          <Input id="mark" name="mark" placeholder="e.g. AGYIRIGO" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v ?? "")}
            required
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a topic" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ref">Tracking number (optional)</Label>
          <Input id="ref" name="ref" placeholder="e.g. AFR-AMO-04A3302D82" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="message">How can we help?</Label>
          <Textarea
            id="message"
            name="message"
            required
            rows={5}
            placeholder="Describe your issue in detail..."
          />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="mt-6 w-full"
        disabled={submitting || !category}
      >
        <Send className="size-4" />
        {submitting ? "Submitting..." : "Submit Ticket"}
      </Button>
    </form>
  )
}
