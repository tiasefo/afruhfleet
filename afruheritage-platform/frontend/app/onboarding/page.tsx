'use client'

import * as React from 'react'
import { commercialApi } from '@/lib/api'

export default function OnboardingPage() {
  const [catalog, setCatalog] = React.useState<any>(null)
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [planCode, setPlanCode] = React.useState('business')
  const [addons, setAddons] = React.useState<string[]>(['marketplace', 'gps_tracking'])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [checkoutUrl, setCheckoutUrl] = React.useState('')

  React.useEffect(() => {
    commercialApi.catalog()
      .then((res: any) => setCatalog(res.data ?? res))
      .catch((err: any) => setError(err?.message || 'Could not load catalog'))
  }, [])

  const toggleAddon = (code: string) => {
    setAddons((current) =>
      current.includes(code)
        ? current.filter((x) => x !== code)
        : [...current, code]
    )
  }

  const startCheckout = async () => {
    setLoading(true)
    setError('')
    setCheckoutUrl('')

    try {
      const signupRes: any = await commercialApi.startSignup({
        email,
        phone,
        account_type: 'tenant_org',
      })

      const signup = signupRes.data ?? signupRes
      const signupId = signup.signup_id

      const planRes: any = await commercialApi.selectPlan({
        signup_id: signupId,
        plan_code: planCode,
        addons,
        payment_method: 'paystack',
        callback_url: `${window.location.origin}/billing/callback`,
      })

      const result = planRes.data ?? planRes

      if (result.checkout_url) {
        setCheckoutUrl(result.checkout_url)
        window.location.href = result.checkout_url
      } else {
        setError('Checkout URL was not returned.')
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-bold">Start Afruheritage SaaS Subscription</h1>
      <p className="mt-2 text-gray-600">
        Create your organization, select a plan, choose add-ons, and continue to Paystack checkout.
      </p>

      {error && (
        <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
          {String(error)}
        </div>
      )}

      <section className="mt-6 grid gap-4 rounded border p-4">
        <input
          className="rounded border p-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="rounded border p-3"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <div>
          <h2 className="font-semibold">Choose Plan</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {(catalog?.plans || []).map((plan: any) => (
              <button
                key={plan.code}
                onClick={() => setPlanCode(plan.code)}
                className={`rounded border p-4 text-left ${
                  planCode === plan.code ? 'border-blue-600 bg-blue-50' : ''
                }`}
              >
                <div className="font-bold">{plan.name}</div>
                <div>GHS {plan.monthly_price}/month</div>
                <div className="text-sm text-gray-600">{plan.credits} credits</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-semibold">Choose Add-ons</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {(catalog?.addons || []).map((addon: any) => (
              <button
                key={addon.code}
                onClick={() => toggleAddon(addon.code)}
                className={`rounded border p-4 text-left ${
                  addons.includes(addon.code) ? 'border-green-600 bg-green-50' : ''
                }`}
              >
                <div className="font-bold">{addon.name}</div>
                <div>GHS {addon.monthly_price}/month</div>
                {addon.info && <div className="text-sm text-gray-600">{addon.info}</div>}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={loading || !email}
          onClick={startCheckout}
          className="rounded bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Preparing Checkout...' : 'Continue to Paystack Checkout'}
        </button>

        {checkoutUrl && (
          <a className="text-blue-600 underline" href={checkoutUrl}>
            Open checkout
          </a>
        )}
      </section>
    </main>
  )
}
