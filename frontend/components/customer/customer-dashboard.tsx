"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getApiBaseUrl, getCookie, joinApiUrl } from "@/lib/api"

interface Shipment {
  id: string
  tracking_number?: string
  status?: string
  origin?: string
  destination?: string
  created_at?: string
}

interface CustomerDashboardProps {
  tenantId: string | null | undefined
}

interface SubscriptionData {
  tenant_id: string
  plan_code: string
  status: string
  currency: string
  read_only_reason?: string | null
}

interface WalletData {
  tenant_id: string
  currency: string
  balance_credits: number
}

interface PlanData {
  code: string
  name: string
  included_features: string[]
  monthly_credit_allowance: number
}

interface UsageCost {
  feature_key: string
  credits: number
}

interface WalletTransaction {
  id: string
  transaction_type: string
  credits_delta: number
  balance_after: number
  reference?: string | null
  memo?: string | null
  created_at: string
}

export function CustomerDashboard({ tenantId }: CustomerDashboardProps) {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState("")
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [plan, setPlan] = useState<PlanData | null>(null)
  const [usageCosts, setUsageCosts] = useState<UsageCost[]>([])
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const apiBaseUrl = getApiBaseUrl()

  useEffect(() => {
    if (!tenantId) return

    async function fetchShipments() {
      setLoading(true)
      setError("")
      try {
        if (!apiBaseUrl) {
          throw new Error("API base URL missing. Set NEXT_PUBLIC_API_BASE_URL.")
        }
        const token = getCookie("afruheritage_access_token")
        const res = await fetch(
          joinApiUrl(apiBaseUrl, `/customer-portal/${tenantId}/shipments`),
          token
            ? { headers: { Authorization: `Bearer ${token}` } }
            : {}
        )
        if (res.ok) {
          const data = await res.json()
          setShipments(Array.isArray(data.shipments) ? data.shipments : [])
          return
        }

        // Fallback to local shipment index for tenants not yet wired to live Fleetbase.
        if (res.status === 404) {
          const fallback = await fetch(
            joinApiUrl(apiBaseUrl, `/shipments/${tenantId}`),
            token
              ? { headers: { Authorization: `Bearer ${token}` } }
              : {}
          )
          if (fallback.ok) {
            const fallbackData = await fallback.json()
            setShipments(Array.isArray(fallbackData.items) ? fallbackData.items : [])
            return
          }
          throw new Error(
            "Tenant setup is incomplete. Live API is not connected yet. Contact support to finish provisioning."
          )
        }

        throw new Error(`Failed to load shipments (${res.status})`)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load shipments")
      } finally {
        setLoading(false)
      }
    }

    fetchShipments()
  }, [apiBaseUrl, tenantId])

  useEffect(() => {
    const currentTenantId = tenantId ?? ""
    const currentApiBaseUrl = apiBaseUrl ?? ""
    if (!currentTenantId || !currentApiBaseUrl) return

    async function fetchBilling() {
      setBillingLoading(true)
      setBillingError("")
      try {
        const token = getCookie("afruheritage_access_token")
        if (!token) {
          throw new Error("Login required to load billing details.")
        }

        const headers = { Authorization: `Bearer ${token}` }
        const [subRes, walletRes, plansRes, usageRes, txRes] = await Promise.all([
          fetch(joinApiUrl(currentApiBaseUrl, `/billing/subscriptions/${currentTenantId}`), { headers }),
          fetch(joinApiUrl(currentApiBaseUrl, `/billing/wallets/${currentTenantId}`), { headers }),
          fetch(joinApiUrl(currentApiBaseUrl, "/billing/plans"), { headers }),
          fetch(joinApiUrl(currentApiBaseUrl, "/billing/usage-costs"), { headers }),
          fetch(joinApiUrl(currentApiBaseUrl, `/billing/wallets/${currentTenantId}/transactions?limit=12`), { headers }),
        ])

        if (!subRes.ok || !walletRes.ok || !plansRes.ok || !usageRes.ok || !txRes.ok) {
          throw new Error("Failed to load billing and entitlement data.")
        }

        const subData = (await subRes.json()) as SubscriptionData | null
        const walletData = (await walletRes.json()) as WalletData
        const plansData = (await plansRes.json()) as PlanData[]
        const usageData = (await usageRes.json()) as UsageCost[]
        const txData = (await txRes.json()) as WalletTransaction[]

        setSubscription(subData)
        setWallet(walletData)
        setUsageCosts(Array.isArray(usageData) ? usageData : [])
        setTransactions(Array.isArray(txData) ? txData : [])
        if (subData) {
          setPlan(plansData.find((p) => p.code === subData.plan_code) || null)
        }
      } catch (err: unknown) {
        setBillingError(err instanceof Error ? err.message : "Failed to load billing details")
      } finally {
        setBillingLoading(false)
      }
    }

    fetchBilling()
  }, [apiBaseUrl, tenantId])

  return (
    <div className="mt-8 space-y-8">
      <div className="rounded-lg border bg-white shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Plan & Credits</h2>
          <p className="text-sm text-gray-500 mt-1">Active entitlements and real-time credit balance for your tenant.</p>
        </div>
        <div className="p-6 space-y-4">
          {billingLoading && <div className="text-gray-500 text-sm">Loading plan and credits…</div>}
          {billingError && <div className="text-red-600 text-sm">{billingError}</div>}
          {!billingLoading && !billingError && subscription && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="rounded-lg border p-4">
                <div className="text-gray-500">Plan</div>
                <div className="mt-1 text-base font-semibold">{plan?.name || subscription.plan_code}</div>
                <div className="mt-1 text-xs uppercase tracking-wide text-gray-500">Status: {subscription.status}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-gray-500">Available Credits</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">{wallet?.balance_credits ?? 0}</div>
                <div className="mt-1 text-xs text-gray-500">Currency: {wallet?.currency || subscription.currency}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-gray-500">Monthly Allocation</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">{plan?.monthly_credit_allowance ?? 0}</div>
                <div className="mt-1 text-xs text-gray-500">Credits assigned each billing cycle</div>
              </div>
            </div>
          )}

          {!billingLoading && !billingError && plan && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold">Enabled Features</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {plan.included_features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      <span>{feature.replace(/_/g, " ")}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="font-semibold">Usage Credit Costs</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {usageCosts.map((cost) => (
                    <li key={cost.feature_key} className="flex items-center justify-between">
                      <span>{cost.feature_key.replace(/_/g, " ")}</span>
                      <span className="font-medium">{cost.credits} credits</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {!billingLoading && !billingError && (
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">Recent Credit Transactions</h3>
              {transactions.length === 0 ? (
                <div className="mt-2 text-sm text-gray-500">No credit transactions recorded yet.</div>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="pb-2 pr-4 font-medium">Type</th>
                        <th className="pb-2 pr-4 font-medium">Delta</th>
                        <th className="pb-2 pr-4 font-medium">Balance After</th>
                        <th className="pb-2 pr-4 font-medium">Memo</th>
                        <th className="pb-2 font-medium">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b last:border-0">
                          <td className="py-2 pr-4">{tx.transaction_type.replace(/_/g, " ")}</td>
                          <td className={`py-2 pr-4 font-medium ${tx.credits_delta >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                            {tx.credits_delta >= 0 ? `+${tx.credits_delta}` : tx.credits_delta}
                          </td>
                          <td className="py-2 pr-4">{tx.balance_after}</td>
                          <td className="py-2 pr-4 text-gray-600">{tx.memo || "-"}</td>
                          <td className="py-2 text-gray-500">{new Date(tx.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/track"
          className="block rounded-lg border bg-white p-6 shadow hover:shadow-md transition-shadow text-center"
        >
          <div className="text-3xl mb-2">📦</div>
          <div className="font-semibold text-lg">Track Shipment</div>
          <div className="text-sm text-gray-500 mt-1">Enter a tracking number</div>
        </Link>
        <Link
          href="/support"
          className="block rounded-lg border bg-white p-6 shadow hover:shadow-md transition-shadow text-center"
        >
          <div className="text-3xl mb-2">🎫</div>
          <div className="font-semibold text-lg">Support</div>
          <div className="text-sm text-gray-500 mt-1">Create or track a ticket</div>
        </Link>
        <Link
          href="/kyc"
          className="block rounded-lg border bg-white p-6 shadow hover:shadow-md transition-shadow text-center"
        >
          <div className="text-3xl mb-2">🪪</div>
          <div className="font-semibold text-lg">Verify Identity</div>
          <div className="text-sm text-gray-500 mt-1">KYC verification</div>
        </Link>
      </div>

      {/* Shipments Section */}
      <div className="rounded-lg border bg-white shadow">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Shipments</h2>
          <Link href="/track" className="text-sm text-blue-600 hover:underline">
            Track a shipment →
          </Link>
        </div>
        <div className="p-6">
          {!tenantId && (
            <div className="text-gray-500 text-sm">
              No tenant account linked. Contact support to get started.
            </div>
          )}
          {tenantId && loading && <div className="text-gray-500">Loading shipments…</div>}
          {tenantId && error && (
            <div className="space-y-2 text-sm">
              <div className="text-red-600">{error}</div>
              <Link href="/support" className="text-blue-600 hover:underline">
                Open support request for tenant provisioning
              </Link>
            </div>
          )}
          {tenantId && !loading && !error && shipments.length === 0 && (
            <div className="text-gray-500 text-sm">No shipments found yet.</div>
          )}
          {shipments.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2 pr-4 font-medium">Tracking #</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Origin</th>
                    <th className="pb-2 pr-4 font-medium">Destination</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.slice(0, 10).map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-blue-600">
                        {s.tracking_number || s.id}
                      </td>
                      <td className="py-2 pr-4">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="py-2 pr-4">{s.origin || "—"}</td>
                      <td className="py-2 pr-4">{s.destination || "—"}</td>
                      <td className="py-2 text-gray-500">
                        {s.created_at
                          ? new Date(s.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status || "").toLowerCase()
  const colours: Record<string, string> = {
    delivered: "bg-green-100 text-green-700",
    "in transit": "bg-blue-100 text-blue-700",
    transit: "bg-blue-100 text-blue-700",
    pending: "bg-yellow-100 text-yellow-700",
    cancelled: "bg-red-100 text-red-700",
    failed: "bg-red-100 text-red-700",
  }
  const cls =
    colours[s] || "bg-gray-100 text-gray-700"
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {status || "Unknown"}
    </span>
  )
}
