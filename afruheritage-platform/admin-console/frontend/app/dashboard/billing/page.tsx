'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  CreditCard,
  RefreshCw,
  Search,
  Wallet,
  Plus,
  Minus,
  Zap,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'

interface Plan {
  code: string
  name: string
  currency: string
  price_amount: number
  monthly_credit_allowance: number
  includes_custom_domain: boolean
  includes_priority_support: boolean
  included_features: string[]
}

interface Subscription {
  tenant_id: string
  plan_code: string
  status: string
  currency: string
  started_at: string
  current_period_end: string
  trial_ends_at?: string
  read_only_reason?: string
}

interface Wallet {
  tenant_id: string
  balance_credits: number
  currency: string
  last_updated: string
}

interface WalletTransaction {
  id: string
  tenant_id: string
  transaction_type: string
  amount: number
  currency: string
  memo: string
  created_at: string
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [creditDialogOpen, setCreditDialogOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState('')
  const [creditAmount, setCreditAmount] = useState('')
  const [creditMemo, setCreditMemo] = useState('')
  const [walletTenantId, setWalletTenantId] = useState('')
  const [wallet, setWallet] = useState<any | null>(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const [subscription, setSubscription] = useState<any | null>(null)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjusting, setAdjusting] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignTenantId, setAssignTenantId] = useState('')
  const [assignPlanId, setAssignPlanId] = useState('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    async function loadPlans() {
      try {
        // Load plans from control plane API
        const data = await api.get('/api/v1/billing/plans')
        setPlans(Array.isArray(data) ? data : [])
      } catch (e: any) {
        toast.error('Failed to load plans: ' + (e.message || 'Unknown error'))
      } finally {
        setLoading(false)
      }
    }
    loadPlans()
  }, [])

  const lookupWallet = async () => {
    if (!walletTenantId) return
    setWalletLoading(true)
    setWallet(null)
    setSubscription(null)
    try {
      const [w, s] = await Promise.allSettled([
        api.get(`/api/v1/billing/wallets/${walletTenantId}`),
        api.get(`/api/v1/billing/subscriptions/${walletTenantId}`),
      ])
      if (w.status === 'fulfilled') setWallet(w.value)
      else toast.error('Wallet not found')
      if (s.status === 'fulfilled') setSubscription(s.value)
    } catch (e: any) {
      toast.error('Failed to lookup wallet: ' + (e.message || 'Unknown error'))
    } finally {
      setWalletLoading(false)
    }
  }

  const handleAdjust = async () => {
    setAdjusting(true)
    try {
      await api.post('/api/v1/billing/admin/adjust-credits', {
        tenant_id: walletTenantId,
        amount: parseFloat(adjustAmount),
        reason: adjustReason,
      })
      toast.success('Credits adjusted successfully')
      setAdjustOpen(false)
      setAdjustAmount('')
      setAdjustReason('')
      lookupWallet()
    } catch (e: any) {
      toast.error('Failed to adjust credits: ' + (e.message || 'Unknown error'))
    } finally {
      setAdjusting(false)
    }
  }

  const handleAssignPlan = async () => {
    setAssigning(true)
    try {
      await api.post('/api/v1/billing/admin/assign-plan', {
        tenant_id: assignTenantId,
        plan_code: assignPlanId,
      })
      toast.success('Plan assigned successfully')
      setAssignOpen(false)
      setAssignTenantId('')
      setAssignPlanId('')
    } catch (e: any) {
      toast.error('Failed to assign plan: ' + (e.message || 'Unknown error'))
    } finally {
      setAssigning(false)
    }
  }

  const planColor = (code: string) => {
    switch (code) {
      case 'free_trial': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
      case 'professional': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'business': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      case 'delivery_services': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      default: return ''
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="mt-1 text-muted-foreground">Plans, subscriptions, and wallet management</p>
        </div>
        <Button onClick={() => setAssignOpen(true)}>
          <Zap className="mr-2 h-4 w-4" /> Assign Plan
        </Button>
      </div>

      {/* Plans */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Plans</h2>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((p: any) => (
              <Card key={p.id}>
                <CardContent className="p-6">
                  <Badge className={`mb-3 ${planColor(p.code || p.plan_code)}`}>{p.code || p.plan_code}</Badge>
                  <div className="text-lg font-bold">{p.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{p.description || 'No description'}</div>
                  <div className="mt-3 text-2xl font-bold">
                    {p.price_ghs != null ? `GHS ${p.price_ghs}` : (p.price != null ? `GHS ${p.price}` : 'Free')}
                    <span className="text-sm font-normal text-muted-foreground"> /mo</span>
                  </div>
                  {p.included_credits != null && (
                    <div className="mt-1 text-sm text-muted-foreground">{p.included_credits} credits included</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Wallet Lookup */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Wallet Lookup</h2>
        <div className="flex gap-2 max-w-lg">
          <Input
            placeholder="Enter Tenant ID..."
            value={walletTenantId}
            onChange={e => setWalletTenantId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookupWallet()}
          />
          <Button onClick={lookupWallet} disabled={walletLoading || !walletTenantId}>
            {walletLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {wallet && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet className="h-4 w-4" /> Wallet Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{wallet.balance_credits ?? wallet.balance ?? 0} <span className="text-base font-normal text-muted-foreground">credits</span></div>
                <Button size="sm" className="mt-3" variant="outline" onClick={() => setAdjustOpen(true)}>
                  <Plus className="mr-1 h-3 w-3" /> Adjust Credits
                </Button>
              </CardContent>
            </Card>
            {subscription && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4" /> Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">{subscription.plan_name || subscription.plan?.name || 'N/A'}</div>
                  <Badge className="mt-1" variant={subscription.status === 'active' ? 'default' : 'outline'}>{subscription.status}</Badge>
                  {subscription.current_period_end && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Renews: {new Date(subscription.current_period_end).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Adjust Credits Dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Credits</DialogTitle>
            <DialogDescription>Add or subtract credits for tenant {walletTenantId}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Amount (positive to add, negative to subtract)</Label>
              <Input type="number" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} placeholder="100" />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input value={adjustReason} onChange={e => setAdjustReason(e.target.value)} placeholder="Manual adjustment" />
            </div>
            <Button className="w-full" onClick={handleAdjust} disabled={adjusting || !adjustAmount}>
              {adjusting ? 'Adjusting...' : 'Adjust Credits'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Plan Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Plan to Tenant</DialogTitle>
            <DialogDescription>Select a plan and tenant</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Tenant ID</Label>
              <Input value={assignTenantId} onChange={e => setAssignTenantId(e.target.value)} placeholder="Tenant UUID" />
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={assignPlanId}
                onChange={e => setAssignPlanId(e.target.value)}
              >
                <option value="">Select plan...</option>
                {plans.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code || p.plan_code})</option>
                ))}
              </select>
            </div>
            <Button className="w-full" onClick={handleAssignPlan} disabled={assigning || !assignTenantId || !assignPlanId}>
              {assigning ? 'Assigning...' : 'Assign Plan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
