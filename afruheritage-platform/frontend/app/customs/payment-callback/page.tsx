'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function CustomsPaymentCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [result, setResult] = useState<any>(null)
  const [reference, setReference] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('reference') || params.get('trxref') || ''
    setReference(ref)

    if (!ref) {
      setStatus('failed')
      return
    }

    fetch(`/api/v1/customs/guest/payment/verify/${ref}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.paid) {
          setResult(data.result)
          setStatus('success')
        } else {
          setStatus('failed')
        }
      })
      .catch(() => setStatus('failed'))
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-8 shadow-sm">
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#063f4f]" />
            <h1 className="mt-6 text-2xl font-bold">Verifying payment...</h1>
          </div>
        )}

        {status === 'success' && (
          <div>
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <h1 className="mt-6 text-2xl font-bold">Payment successful</h1>
            <p className="mt-2 text-slate-600">Reference: {reference}</p>

            {result && (
              <div className="mt-6 rounded-xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Estimated Duty Payable</p>
                <p className="text-3xl font-bold">
                  {result.currency || 'GHS'} {(result.charges_total || result.estimated_total_landed_cost || 0).toLocaleString()}
                </p>
              </div>
            )}

            <Link href="/customs/duty-calculator" className="mt-8 inline-flex rounded-lg bg-[#063f4f] px-5 py-3 font-semibold text-white">
              Run Another Check
            </Link>
          </div>
        )}

        {status === 'failed' && (
          <div>
            <XCircle className="h-12 w-12 text-red-600" />
            <h1 className="mt-6 text-2xl font-bold">Payment verification failed</h1>
            <p className="mt-2 text-slate-600">Please try again or contact support.</p>
            <Link href="/customs/duty-calculator" className="mt-8 inline-flex rounded-lg bg-[#063f4f] px-5 py-3 font-semibold text-white">
              Back to Calculator
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
