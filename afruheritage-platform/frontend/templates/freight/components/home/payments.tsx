"use client"

import { useState } from "react"
import { Check, Copy, Phone, Smartphone, ShieldCheck, MessageCircle, CreditCard } from "lucide-react"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"
import { waLink } from "@/lib/utils"

export function Payments({ theme }: { theme: TenantPublicTheme }) {
  const cfg = theme.storefrontConfig
  const payment = cfg?.payment
  const staff = cfg?.billing_staff
  const waTracking = cfg?.whatsapp?.tracking || cfg?.contacts?.tracking?.whatsapp || ""

  if (!payment && (!staff || staff.length === 0)) return null

  return (
    <section id="payments" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: theme.primaryColor }}>
          Payments
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Payment Instructions</h2>
        <p className="mt-3 text-muted-foreground">
          Use the details below to make your payment. Always confirm with our billing team before sending funds.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {payment && (
          <div className="rounded-xl p-6 text-white" style={{ background: theme.primaryColor }}>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg" style={{ background: theme.accentColor, color: theme.primaryColor }}>
                <Smartphone className="size-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold">{payment.network || "Mobile Money"}</h3>
                <p className="text-xs text-white/70">Send payment to the merchant below</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {payment.merchant_name && <CopyRow label="Merchant Name" value={payment.merchant_name} light />}
              {payment.merchant_id && <CopyRow label="Merchant ID" value={payment.merchant_id} light />}
              {payment.phone && <CopyRow label="Payment Phone" value={payment.phone} light />}
            </div>

            {payment.is_placeholder && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-white/10 p-3 text-xs text-white/80">
                <ShieldCheck className="size-4 shrink-0 mt-0.5" />
                <span>These details are placeholders. Please confirm the official payment number with our team before sending money.</span>
              </div>
            )}

            {waTracking && (
              <a
                href={waLink(waTracking, `Hello ${theme.name}, I have made a ${payment.network || "Mobile Money"} payment. Here is my screenshot.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: theme.accentColor, color: theme.primaryColor }}
              >
                <MessageCircle className="size-4" /> Confirm Payment on WhatsApp
              </a>
            )}
          </div>
        )}

        {staff && staff.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Phone className="size-5" style={{ color: theme.primaryColor }} />
              Billing Staff Contacts
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">Contact the staff member assigned to your name range.</p>

            <div className="mt-4 space-y-3">
              {staff.map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex size-10 items-center justify-center rounded-lg text-xs font-bold"
                      style={{ background: `${theme.primaryColor}15`, color: theme.primaryColor }}
                    >
                      {s.range || "—"}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{s.name || "Staff"}</p>
                      {s.phone && (
                        <a href={`tel:${s.phone}`} className="text-xs text-muted-foreground hover:text-foreground">
                          {s.phone}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.phone_digits && (
                      <a
                        href={waLink(s.phone_digits, `Hello ${s.name}, I have a billing enquiry.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex size-8 items-center justify-center rounded-lg transition-colors hover:opacity-80"
                        style={{ background: `${theme.primaryColor}15`, color: theme.primaryColor }}
                        aria-label={`WhatsApp ${s.name}`}
                      >
                        <MessageCircle className="size-4" />
                      </a>
                    )}
                    {s.note && (
                      <span className="hidden text-xs text-muted-foreground sm:block">{s.note}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0 mt-0.5" />
              <span>{theme.name} will never ask you to pay an unlisted personal number. Always use the official payment details above.</span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function CopyRow({ label, value, light }: { label: string; value: string; light?: boolean }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 ${light ? 'bg-white/10' : 'bg-muted/30'}`}>
      <div className="min-w-0">
        <p className={`text-[11px] uppercase tracking-wide ${light ? 'text-white/60' : 'text-muted-foreground'}`}>{label}</p>
        <p className={`truncate font-mono text-base font-semibold ${light ? 'text-white' : 'text-foreground'}`}>{value}</p>
      </div>
      <button
        onClick={copy}
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors ${light ? 'text-white hover:bg-white/15' : 'text-muted-foreground hover:bg-muted'}`}
        aria-label={`Copy ${label}`}
      >
        {copied ? <Check className="size-4" style={{ color: light ? undefined : '#22c55e' }} /> : <Copy className="size-4" />}
      </button>
    </div>
  )
}
