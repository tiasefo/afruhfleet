"use client"

import { useState } from "react"
import { LifeBuoy, MessageCircle, Phone, Mail, Loader2, Send, CheckCircle2 } from "lucide-react"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"
import { waLink } from "@/lib/utils"

export function SupportForm({ theme }: { theme: TenantPublicTheme }) {
  const cfg = theme.storefrontConfig
  const supCfg = cfg?.support
  const waTracking = cfg?.whatsapp?.tracking || cfg?.contacts?.tracking?.whatsapp || ""
  const trackingPhone = cfg?.contacts?.tracking?.phone || theme.supportPhone || ""
  const trackingDept = cfg?.contacts?.tracking?.department || ""
  const trackingStaff = cfg?.contacts?.tracking?.staff || ""

  const showForm = supCfg?.show_form !== false
  const showWhatsApp = supCfg?.show_whatsapp !== false && !!waTracking
  const showPhone = supCfg?.show_phone !== false && !!trackingPhone
  const showEmail = supCfg?.show_email !== false && !!theme.supportEmail

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/v1/support-crm/public/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      })
      if (!res.ok) throw new Error("Failed to submit ticket")
      setSubmitted(true)
    } catch (err: any) {
      setError(err?.message || "Failed to submit. Please try WhatsApp instead.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="support" className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: `${theme.primaryColor}15`, color: theme.primaryColor }}>
          <LifeBuoy className="size-3.5" /> Support
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
          {supCfg?.title || "How Can We Help?"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {supCfg?.description || "Get in touch with our team. We're here to help with tracking, billing, and shipping questions."}
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-3">
          {showWhatsApp && (
            <a
              href={waLink(waTracking, `Hello ${theme.name}, I need assistance.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20"
            >
              <span className="flex size-10 items-center justify-center rounded-lg" style={{ background: `${theme.primaryColor}15`, color: theme.primaryColor }}>
                <MessageCircle className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">WhatsApp</p>
                <p className="text-xs text-muted-foreground">Chat with us instantly</p>
              </div>
            </a>
          )}

          {showPhone && (
            <a
              href={`tel:${trackingPhone}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20"
            >
              <span className="flex size-10 items-center justify-center rounded-lg" style={{ background: `${theme.primaryColor}15`, color: theme.primaryColor }}>
                <Phone className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{trackingDept || "Call Us"}</p>
                <p className="text-xs text-muted-foreground">{trackingPhone}</p>
                {trackingStaff && <p className="text-xs text-muted-foreground">Ask for {trackingStaff}</p>}
              </div>
            </a>
          )}

          {showEmail && (
            <a
              href={`mailto:${theme.supportEmail}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20"
            >
              <span className="flex size-10 items-center justify-center rounded-lg" style={{ background: `${theme.primaryColor}15`, color: theme.primaryColor }}>
                <Mail className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Email</p>
                <p className="text-xs text-muted-foreground">{theme.supportEmail}</p>
              </div>
            </a>
          )}
        </div>

        {showForm && (
          <div className="lg:col-span-2">
            {submitted ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center">
                <CheckCircle2 className="size-12" style={{ color: '#22c55e' }} />
                <h3 className="mt-4 text-lg font-semibold">Ticket Submitted</h3>
                <p className="mt-1 text-sm text-muted-foreground">We'll get back to you as soon as possible.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Name</span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring"
                      placeholder="Your full name"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Email</span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring"
                      placeholder="you@example.com"
                    />
                  </label>
                </div>
                <label className="mt-4 flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Subject</span>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring"
                    placeholder="What do you need help with?"
                  />
                </label>
                <label className="mt-4 flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Message</span>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring"
                    placeholder="Describe your issue..."
                  />
                </label>

                {error && (
                  <p className="mt-3 text-sm text-destructive">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: theme.primaryColor }}
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Submit Ticket
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
