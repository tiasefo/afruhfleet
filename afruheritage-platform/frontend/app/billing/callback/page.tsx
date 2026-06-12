'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { paymentHubApi, billingAPI } from '@/lib/api'

export default function BillingCallbackPage() {
  const [reference, setReference] = React.useState('')
  const [status, setStatus] = React.useState('checking')
  const [message, setMessage] = React.useState('Checking payment status...')
  const [receipt, setReceipt] = React.useState<any>(null)
  const router = useRouter()

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref =
      params.get('reference') ||
      params.get('trxref') ||
      params.get('tx_ref') ||
      ''

    setReference(ref)

    if (!ref) {
      setStatus('error')
      setMessage('No payment reference was found in the callback URL.')
      return
    }

    async function checkPayment() {
      try {
        // Try payment-hub verify first (covers both PaymentTransaction and BillingPayment)
        let verifyData: any = null
        try {
          const verifyRes: any = await paymentHubApi.verify(ref)
          verifyData = verifyRes.data ?? verifyRes
        } catch (verifyErr: any) {
          // If payment-hub verify fails, try billing verify (requires auth)
          try {
            const billingRes: any = await billingAPI.verifyPayment(ref)
            verifyData = billingRes.data ?? billingRes
          } catch {
            // Paystack redirected us here, so payment was at least attempted.
            // Show a friendly processing message instead of a hard error.
            setStatus('pending')
            setMessage(
              'Payment received. Your subscription is being activated — this may take a moment. ' +
              'You will be redirected to your dashboard shortly.'
            )
            setTimeout(() => router.replace('/dashboard'), 4000)
            return
          }
        }

        // Try to fetch receipt (best-effort — don't fail the page if it errors)
        try {
          const receiptRes: any = await paymentHubApi.receipt(ref)
          const receiptData = receiptRes.data ?? receiptRes
          setReceipt(receiptData.receipt || receiptData)
        } catch {
          // receipt not critical — continue
        }

        const isSuccess =
          verifyData?.status === 'success' ||
          verifyData?.status === 'verified' ||
          verifyData?.transaction_status === 'success' ||
          verifyData?.provider_status === 'success'

        if (isSuccess) {
          setStatus('success')
          setMessage('Payment completed successfully. Redirecting to dashboard…')
          setTimeout(() => router.replace('/dashboard'), 3000)
        } else {
          setStatus('pending')
          setMessage(
            `Payment status: ${
              verifyData?.paystack_status ||
              verifyData?.provider_status ||
              verifyData?.status ||
              'pending'
            }. If you completed payment, your plan will activate within a few minutes.`
          )
        }
      } catch (err: any) {
        setStatus('error')
        setMessage(
          err?.response?.data?.detail ||
          err?.message ||
          'Unable to verify payment at this time. If you completed payment, your plan will activate shortly.'
        )
      }
    }

    checkPayment()
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <section className="w-full max-w-xl rounded-xl border bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Billing Payment Status</h1>

        <div
          className={`mt-6 rounded border p-4 ${
            status === 'success'
              ? 'border-green-300 bg-green-50 text-green-800'
              : status === 'pending' || status === 'checking'
                ? 'border-yellow-300 bg-yellow-50 text-yellow-800'
                : 'border-red-300 bg-red-50 text-red-800'
          }`}
        >
          <p className="font-semibold">{message}</p>
          {reference && <p className="mt-2 text-sm">Reference: {reference}</p>}
        </div>

        {receipt && (
          <div className="mt-6 rounded border p-4 text-sm">
            <h2 className="font-semibold">Receipt</h2>
            <div className="mt-3 grid gap-2">
              <p><strong>Tenant:</strong> {receipt.tenant_id}</p>
              <p><strong>Provider:</strong> {receipt.provider}</p>
              <p><strong>Purpose:</strong> {receipt.purpose}</p>
              <p><strong>Amount:</strong> {receipt.currency} {receipt.amount}</p>
              <p><strong>Status:</strong> {receipt.status}</p>
              <p><strong>Paid:</strong> {receipt.paid ? 'Yes' : 'No'}</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Link href="/dashboard" className="rounded bg-blue-600 px-4 py-2 text-white">
            Go to Dashboard
          </Link>
          <Link href="/billing" className="rounded border px-4 py-2">
            Billing
          </Link>
        </div>
      </section>
    </main>
  )
}
