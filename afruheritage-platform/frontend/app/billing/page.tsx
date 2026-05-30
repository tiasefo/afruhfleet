'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useBranding } from '@/hooks/useBranding'
import { useTranslation } from '@/hooks/useTranslation'
import { billingApi } from '@/lib/api_updated'
import { resolveTenantId } from '@/lib/tenant'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  Plus, 
  ArrowRight, 
  Loader2,
  DollarSign,
  AlertCircle
} from 'lucide-react'

const planFeatures: Record<string, string[]> = {
  free_trial: [
    'Basic shipment tracking',
    'Up to 50 shipments per month',
    'Email support',
    'AI assistant access (limited)',
  ],
  professional: [
    'Unlimited shipments',
    'Real-time shipment tracking',
    'CSV bulk import',
    'Full AI assistant access',
    'Team management',
    'Priority email support',
  ],
  business: [
    'Everything in Professional',
    'Custom domain support',
    'Priority phone and email support',
    'Dedicated account management',
    'Advanced analytics',
    'API access',
  ],
  delivery_services: [
    'Vendor marketplace access',
    'Vehicle fleet management',
    'Service booking workflow',
    'Earnings dashboard',
    'Automated payouts',
  ],
}

export default function BillingPage() {
  const { user } = useAuth()
  const { branding } = useBranding()
  const { t } = useTranslation()
  
  const [subscription, setSubscription] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [walletTransactions, setWalletTransactions] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showTopupModal, setShowTopupModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showTransactionsModal, setShowTransactionsModal] = useState(false)
  const [topupAmount, setTopupAmount] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const queryPlan = new URLSearchParams(window.location.search).get('plan')?.trim()
    if (!queryPlan) return
    setSelectedPlan(queryPlan)
    setShowUpgradeModal(true)
  }, [])

  const buildBillingCallbackUrl = () => {
    if (typeof window === 'undefined') return undefined
    const callbackUrl = new URL('/billing/callback', window.location.origin)
    const tenantId = resolveTenantId()
    if (tenantId) {
      callbackUrl.searchParams.set('tenant_id', tenantId)
    }
    return callbackUrl.toString()
  }

  // Load billing data
  const loadBillingData = async () => {
    setIsLoading(true)
    try {
      const tenantId = resolveTenantId()
      const [subData, walletData, plansData, transactionsData] = await Promise.all([
        billingApi.getSubscription(tenantId || ''),
        billingApi.getWallet(tenantId || ''),
        billingApi.getPlans(),
        billingApi.getWalletTransactions(tenantId || ''),
      ])
      
      setSubscription(subData)
      setWallet(walletData)
      setPlans(plansData)
      setWalletTransactions(transactionsData || [])
    } catch (error) {
      console.error('Failed to load billing data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBillingData()
  }, [])

  const handleTopup = async () => {
    if (!topupAmount || parseFloat(topupAmount) <= 0) return
    
    setIsProcessing(true)
    try {
      const amount = parseFloat(topupAmount)
      const response = await billingApi.purchaseCredits(resolveTenantId() || '', amount)
      
      // Redirect to Paystack
      window.location.href = response.authorization_url
    } catch (error) {
      console.error('Failed to initiate topup:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpgrade = async () => {
    if (!selectedPlan) return
    
    setIsProcessing(true)
    try {
      if (selectedPlan === 'free_trial') {
        await billingApi.createSubscription({
          tenant_id: resolveTenantId() || '',
          plan_code: selectedPlan,
        })
        await loadBillingData()
        setShowUpgradeModal(false)
        return
      }

      const plan = plans.find(p => p.code === selectedPlan)
      if (!plan) return
      
      const response = await billingApi.createSubscription({
        tenant_id: resolveTenantId() || '',
        plan_code: selectedPlan,
        payment_method: 'paystack',
      })
      
      // Redirect to Paystack
      window.location.href = response.authorization_url
    } catch (error) {
      console.error('Failed to initiate upgrade:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('billing.title')}</h1>
              <p className="mt-2 text-sm text-gray-600">{t('billing.manage_subscription')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subscription Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  {t('billing.current_plan')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscription ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{subscription.plan_code}</h3>
                        <p className="text-sm text-gray-600">
                          {subscription.currency}
                        </p>
                      </div>
                      <Badge className={
                        subscription.status === 'active' ? 'bg-green-100 text-green-800' : 
                        subscription.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {subscription.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Features</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li className="flex items-center"><div className="w-1 h-1 bg-green-500 rounded-full mr-2"></div>Current period ends: {subscription.current_period_end}</li>
                        {subscription.trial_ends_at && <li className="flex items-center"><div className="w-1 h-1 bg-green-500 rounded-full mr-2"></div>Trial ends: {subscription.trial_ends_at}</li>}
                        {subscription.read_only_reason && <li className="flex items-center"><div className="w-1 h-1 bg-red-500 rounded-full mr-2"></div>{subscription.read_only_reason}</li>}
                      </ul>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
                        <DialogTrigger asChild>
                          <Button>
                            <TrendingUp className="w-4 h-4 mr-2" />
                            {t('billing.upgrade')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Complete Subscription</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Selected Plan</label>
                              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                  {plans
                                    .filter(plan => plan.code !== subscription.plan_code)
                                    .map((plan) => (
                                    <SelectItem key={plan.code} value={plan.code}>
                                      {plan.name} - {plan.price_amount} {plan.currency}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                              {selectedPlan && (
                                <div className="rounded-lg border bg-gray-50 p-4">
                                  <p className="text-sm font-medium text-gray-900">What this tier includes</p>
                                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                                    {(planFeatures[selectedPlan] || []).map((feature) => (
                                      <li key={feature} className="flex items-center">
                                        <div className="mr-2 h-1 w-1 rounded-full bg-green-500" />
                                        {feature}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            <div className="flex space-x-3">
                              <Button onClick={handleUpgrade} disabled={!selectedPlan || isProcessing}>
                                  {isProcessing ? 'Processing...' : selectedPlan === 'free_trial' ? 'Start Free Trial' : 'Proceed to Payment'}
                              </Button>
                              <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>
                                {t('common.cancel')}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">{t('billing.no_active_subscription')}</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {t('billing.choose_plan_to_start')}
                    </p>
                    <div className="mt-4">
                      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Choose Plan
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Select Subscription Plan</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Select Plan</label>
                              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                  {plans.map((plan) => (
                                    <SelectItem key={plan.code} value={plan.code}>
                                      {plan.name} - {plan.price_amount} {plan.currency}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {selectedPlan && (
                              <div className="rounded-lg border bg-gray-50 p-4">
                                <p className="text-sm font-medium text-gray-900">What this tier includes</p>
                                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                                  {(planFeatures[selectedPlan] || []).map((feature) => (
                                    <li key={feature} className="flex items-center">
                                      <div className="mr-2 h-1 w-1 rounded-full bg-green-500" />
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div className="flex space-x-3">
                              <Button onClick={handleUpgrade} disabled={!selectedPlan || isProcessing}>
                                {isProcessing ? 'Processing...' : selectedPlan === 'free_trial' ? 'Start Free Trial' : 'Proceed to Payment'}
                              </Button>
                              <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>
                                {t('common.cancel')}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Wallet Card */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wallet className="w-5 h-5 mr-2" />
                  {t('billing.wallet_balance')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {wallet ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">
                        {wallet.currency} {wallet.balance_credits}
                      </div>
                      <p className="text-sm text-gray-600">{t('billing.available_credits')}</p>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Dialog open={showTopupModal} onOpenChange={setShowTopupModal}>
                        <DialogTrigger asChild>
                          <Button className="flex-1">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Add Funds
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Funds to Wallet</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Amount ({wallet?.currency || 'GHS'})</label>
                              <Input
                                type="number"
                                step="0.01"
                                min="1"
                                value={topupAmount}
                                onChange={(e) => setTopupAmount(e.target.value)}
                                placeholder="Enter amount"
                              />
                            </div>
                            <div className="flex space-x-3">
                              <Button onClick={handleTopup} disabled={!topupAmount || isProcessing}>
                                {isProcessing ? 'Processing...' : 'Add Funds'}
                              </Button>
                              <Button variant="outline" onClick={() => setShowTopupModal(false)}>
                                {t('common.cancel')}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setShowTransactionsModal(true)}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Transaction History
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Wallet className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No Wallet</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Your wallet will be created when you subscribe
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Available Plans */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('billing.available_plans')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card key={plan.code} className="relative">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-medium">{plan.name}</h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold">{plan.currency} {plan.price_amount}</span>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Features</h4>
                        <ul className="space-y-1 text-sm text-gray-600">
                          <li className="flex items-center"><div className="w-1 h-1 bg-green-500 rounded-full mr-2"></div>Monthly credits: {plan.monthly_credit_allowance}</li>
                          {(planFeatures[plan.code] || []).map((feature) => (
                            <li key={feature} className="flex items-center"><div className="w-1 h-1 bg-green-500 rounded-full mr-2"></div>{feature}</li>
                          ))}
                          {plan.includes_custom_domain && <li className="flex items-center"><div className="w-1 h-1 bg-green-500 rounded-full mr-2"></div>Custom domain</li>}
                          {plan.includes_priority_support && <li className="flex items-center"><div className="w-1 h-1 bg-green-500 rounded-full mr-2"></div>Priority support</li>}
                        </ul>
                      </div>
                      
                      <Button 
                        className="mt-4 w-full" 
                        variant={subscription?.plan_code === plan.code ? "outline" : "default"}
                        disabled={subscription?.plan_code === plan.code}
                        onClick={() => {
                          setSelectedPlan(plan.code)
                          setShowUpgradeModal(true)
                        }}
                      >
                        {subscription?.plan_code === plan.code ? 'Current Plan' : 'Select Plan'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      
      {/* Transaction History Modal */}
      <Dialog open={showTransactionsModal} onOpenChange={setShowTransactionsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {walletTransactions.length > 0 ? (
              <div className="space-y-3">
                {walletTransactions.map((transaction) => (
                  <div key={transaction.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium capitalize">
                          {transaction.transaction_type.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-600">
                          {transaction.memo || 'No description'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className={`text-right ${transaction.credits_delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="font-medium">
                          {transaction.credits_delta > 0 ? '+' : ''}{transaction.credits_delta} credits
                        </div>
                        <div className="text-sm text-gray-600">
                          Balance: {transaction.balance_after}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No Transactions</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Your transaction history will appear here
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
