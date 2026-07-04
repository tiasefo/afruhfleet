"use client"

import { useState, useEffect } from "react"
import { Check, Copy, Phone, Smartphone, ShieldCheck, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { billingStaff, momo, waLink } from "@/lib/amooksco"
import { api } from "@/lib/api"

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    toast.success(`${label} copied`)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-primary-foreground/10 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-primary-foreground/60">
          {label}
        </p>
        <p className="truncate font-mono text-base font-semibold text-primary-foreground">
          {value}
        </p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="size-8 shrink-0 text-primary-foreground hover:bg-primary-foreground/15"
        onClick={copy}
        aria-label={`Copy ${label}`}
      >
        {copied ? <Check className="size-4 text-accent" /> : <Copy className="size-4" />}
      </Button>
    </div>
  )
}

export function Payments() {
  const [paymentInfo, setPaymentInfo] = useState(momo)
  const [staffList, setStaffList] = useState(billingStaff)
  const [loading, setLoading] = useState(false)

  // Fetch payment and billing info from API
  useEffect(() => {
    async function fetchPaymentInfo() {
      setLoading(true)
      try {
        const info = await api.get('/billing/payment-info')
        if (info) {
          setPaymentInfo({
            network: info.network || momo.network,
            merchantName: info.merchant_name || momo.merchantName,
            merchantId: info.merchant_id || momo.merchantId,
            phone: info.phone || momo.phone,
            phoneDigits: info.phone_digits || momo.phoneDigits,
            isPlaceholder: info.is_placeholder ?? momo.isPlaceholder,
          })
        }
      } catch (err) {
        console.error('Failed to fetch payment info:', err)
        // Keep default values on error
      } finally {
        setLoading(false)
      }
    }

    async function fetchBillingStaff() {
      try {
        const staff = await api.get('/billing/staff')
        if (staff && Array.isArray(staff)) {
          setStaffList(staff.map(s => ({
            range: s.range || 'N/A',
            name: s.name || 'Unknown',
            phone: s.phone || 'N/A',
            phoneDigits: s.phone_digits || s.phone || 'N/A',
            note: s.note || '',
          })))
        }
      } catch (err) {
        console.error('Failed to fetch billing staff:', err)
        // Keep default values on error
      }
    }

    fetchPaymentInfo()
    fetchBillingStaff()
  }, [])

  return (
    <section id="payments" className="scroll-mt-20 bg-muted">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-accent-foreground">
            <Smartphone className="size-4 text-accent" /> Mobile Money Payments
          </span>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground">
            Safe &amp; Secure Transactions
          </h2>
          <p className="mt-3 text-muted-foreground">
            Pay easily with Mobile Money. After payment, kindly send us a screenshot of
            the transaction for fast confirmation.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          {/* MoMo merchant card */}
          <div className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-lg">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Smartphone className="size-6" />
              </span>
              <div>
                <p className="text-sm text-primary-foreground/70">Pay with</p>
                <p className="text-lg font-bold">{paymentInfo.network}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <CopyRow label="Merchant Name" value={paymentInfo.merchantName} />
              <CopyRow label="Merchant ID" value={paymentInfo.merchantId} />
              <CopyRow label="Payment / Confirm Number" value={paymentInfo.phone} />
            </div>

            {paymentInfo.isPlaceholder && (
              <p className="mt-3 text-xs text-accent">
                Note: confirm the Merchant ID with our team before paying.
              </p>
            )}

            <Button
              asChild
              className="mt-5 w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <a
                href={waLink(
                  paymentInfo.phoneDigits,
                  "Hello AMOOKSCO, I have made a Mobile Money payment. Here is my screenshot.",
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4" />
                Send Payment Screenshot
              </a>
            </Button>
          </div>

          {/* How to pay */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground">How To Pay</h3>
            <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
              {[
                "Dial your Mobile Money menu and choose Pay Merchant.",
                `Enter the Merchant ID (${paymentInfo.merchantId}) and the amount.`,
                "Use your shipping mark / name as the reference.",
                "Confirm with your PIN, then send us the screenshot.",
              ].map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-3 text-sm text-foreground">
              <ShieldCheck className="size-5 shrink-0 text-accent" />
              <span>
                AMOOKSCO will never ask you to pay an unlisted personal number. Always
                confirm details with our team first.
              </span>
            </div>
          </div>
        </div>

        {/* Billing department contacts */}
        <div className="mt-14">
          <h3 className="text-center text-xl font-bold text-foreground">
            Billing Department
          </h3>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Contact the staff member assigned to your shipping mark / name.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {staffList.map((staff) => (
              <div
                key={staff.range}
                className="rounded-xl border border-border bg-card p-5 text-center"
              >
                <span className="inline-flex rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                  {staff.range}
                </span>
                <p className="mt-4 text-lg font-semibold text-foreground">
                  {staff.name}
                </p>
                {staff.note && (
                  <p className="mt-1 text-xs text-muted-foreground">{staff.note}</p>
                )}
                <a
                  href={`tel:${staff.phone.replace(/\s/g, "")}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-accent"
                >
                  <Phone className="size-3.5" />
                  {staff.phone}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
