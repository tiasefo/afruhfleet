'use client'

import * as React from 'react'
import Link from 'next/link'
import { paymentHubApi } from '@/lib/api'

export default function BillingCallbackPage() {
  const [reference, setReference] = React.useState('')
  const [status, setStatus] = React.useState('checking')
  const [message, setMessage] = React.useState('Checking payment status...')
  const [receipt, setReceipt] = React.useState<any>(null)

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
        const verifyRes: any = await paymentHubApi.verify(ref)
        const verifyData = verifyRes.data ?? verifyRes

        const receiptRes: any = await paymentHubApi.receipt(ref)
        const receiptData = receiptRes.data ?? receiptRes

        setReceipt(receiptData.receipt || receiptData)

        if (
          verifyData.status === 'success' ||
          verifyData.transaction_status === 'success' ||
          receiptData?.receipt?.paid === true
        ) {
          setStatus('success')
          setMessage('Payment completed successfully.')
        } else {
          setStatus('pending')
          setMessage(
            `Payment status: ${
              verifyData.paystack_status ||
              verifyData.status ||
              receiptData?.receipt?.status ||
              'pending'
            }`
          )
        }
      } catch (err: any) {
        setStatus('error')
        setMessage(
          err?.response?.data?.detail ||
          err?.message ||
          'Unable to verify payment at this time.'
        )
      }
    }

    checkPayment()
  }, [])

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
          <Link href="/onboarding" className="rounded bg-blue-600 px-4 py-2 text-white">
            Return to Onboarding
          </Link>
          <Link href="/dashboard" className="rounded border px-4 py-2">
            Go to Dashboard
          </Link>
        </div>
      </section>
    </main>
  )
}
