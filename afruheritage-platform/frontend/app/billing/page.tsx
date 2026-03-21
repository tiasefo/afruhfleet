'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useBranding } from '@/hooks/useBranding'
import { useTranslation } from '@/hooks/useTranslation'
import { billingAPI } from '@/lib/api'
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

export default function BillingPage() {
  const { user } = useAuth()
  const { branding } = useBranding()
  const { t } = useTranslation()
  
  const [subscription, setSubscription] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showTopupModal, setShowTopupModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [topupAmount, setTopupAmount] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Load billing data
  const loadBillingData = async () => {
    setIsLoading(true)
    try {
      const [subData, walletData, plansData] = await Promise.all([
        billingAPI.getSubscription(),
        billingAPI.getWallet(),
        billingAPI.getPlans(),
      ])
      
      setSubscription(subData)
      setWallet(walletData)
      setPlans(plansData)
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
      const response = await billingAPI.initPayment({
        amount: parseFloat(topupAmount),
        currency: wallet?.currency || 'GHS',
        email: user?.email,
        payment_type: 'wallet_topup',
      })
      
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
      const plan = plans.find(p => p.id === selectedPlan)
      if (!plan) return
      
      const response = await billingAPI.initPayment({
        amount: plan.amount,
        currency: plan.currency,
        email: user?.email,
        payment_type: 'subscription',
        metadata: { plan_id: selectedPlan },
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
              <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
              <p className="mt-2 text-sm text-gray-600">Manage your subscription and wallet</p>
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
                  Current Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscription ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{subscription.plan_name}</h3>
                        <p className="text-sm text-gray-600">
                          {subscription.amount} {subscription.currency} / {subscription.interval}
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
                        {subscription.features?.map((feature: string, index: number) => (
                          <li key={index} className="flex items-center">
                            <div className="w-1 h-1 bg-green-500 rounded-full mr-2"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
                        <DialogTrigger asChild>
                          <Button>
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Upgrade Plan
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Upgrade Subscription</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Select Plan</label>
                              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                  {plans
                                    .filter(plan => plan.code !== subscription.plan_code)
                                    .map((plan) => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                      {plan.name} - {plan.amount} {plan.currency} / {plan.interval}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex space-x-3">
                              <Button onClick={handleUpgrade} disabled={!selectedPlan || isProcessing}>
                                {isProcessing ? 'Processing...' : 'Upgrade Now'}
                              </Button>
                              <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>
                                Cancel
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
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No Active Subscription</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Choose a plan to get started
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
                                    <SelectItem key={plan.id} value={plan.id}>
                                      {plan.name} - {plan.amount} {plan.currency} / {plan.interval}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex space-x-3">
                              <Button onClick={handleUpgrade} disabled={!selectedPlan || isProcessing}>
                                {isProcessing ? 'Processing...' : 'Subscribe Now'}
                              </Button>
                              <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>
                                Cancel
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
                  Wallet Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {wallet ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">
                        {wallet.currency} {wallet.balance.toFixed(2)}
                      </div>
                      <p className="text-sm text-gray-600">Available balance</p>
                    </div>
                    
                    {wallet.credit_limit && (
                      <div className="text-center">
                        <div className="text-lg font-medium text-gray-700">
                          Credit Limit: {wallet.currency} {wallet.credit_limit.toFixed(2)}
                        </div>
                      </div>
                    )}
                    
                    <Dialog open={showTopupModal} onOpenChange={setShowTopupModal}>
                      <DialogTrigger asChild>
                        <Button className="w-full">
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
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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
              <CardTitle>Available Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card key={plan.id} className="relative">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-medium">{plan.name}</h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold">{plan.currency} {plan.amount}</span>
                        <span className="text-gray-600"> / {plan.interval}</span>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Features</h4>
                        <ul className="space-y-1 text-sm text-gray-600">
                          {plan.features?.map((feature: string, index: number) => (
                            <li key={index} className="flex items-center">
                              <div className="w-1 h-1 bg-green-500 rounded-full mr-2"></div>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <Button 
                        className="mt-4 w-full" 
                        variant={subscription?.plan_code === plan.code ? "outline" : "default"}
                        disabled={subscription?.plan_code === plan.code}
                        onClick={() => {
                          setSelectedPlan(plan.id)
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
      </div>
    </div>
  )
}
