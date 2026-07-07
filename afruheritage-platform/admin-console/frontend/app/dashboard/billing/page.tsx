'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { BackButton } from '@/components/back-button'
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
  XCircle,
  Truck,
  Route,
  MapPin,
  Globe,
  Bell,
  Plug,
  Wrench,
  Fuel,
  FileSpreadsheet,
  Package,
  Boxes,
  Group,
  Gift,
  Pause,
  Play,
  Ban,
  Trash2,
  Edit,
} from 'lucide-react'

interface Plan {
  id: string
  code: string
  name: string
  monthly_price: number
  included_credits: number
  features_json?: string
  active: boolean
  created_at: string
}

interface Addon {
  id: string
  code: string
  name: string
  monthly_price: number
  feature_code: string
  info_text?: string
  active: boolean
}

interface GiftCard {
  id: string
  code: string
  credits: number
  remaining_uses: number
  max_uses: number
  expires_at?: string
  active: boolean
  created_at: string
}

interface Subscription {
  id: string
  tenant_id: string
  plan_code: string
  status: string
  currency: string
  started_at: string
  current_period_end: string
  trial_ends_at?: string
  canceled_at?: string
  read_only_reason?: string
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [addons, setAddons] = useState<Addon[]>([])
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  
  // Plan management
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [planForm, setPlanForm] = useState({ code: '', name: '', monthly_price: 0, included_credits: 0, features_json: '', active: true })
  
  // Addon management
  const [addonDialogOpen, setAddonDialogOpen] = useState(false)
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null)
  const [addonForm, setAddonForm] = useState({ code: '', name: '', monthly_price: 0, feature_code: '', info_text: '', active: true })
  
  // Credit management
  const [creditDialogOpen, setCreditDialogOpen] = useState(false)
  const [creditForm, setCreditForm] = useState({ tenant_id: '', amount: 0, reason: '' })
  
  // Gift card management
  const [giftCardDialogOpen, setGiftCardDialogOpen] = useState(false)
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false)
  const [giftCardForm, setGiftCardForm] = useState({ code: '', credits: 0, max_uses: 1, expires_at: '' })
  const [redeemForm, setRedeemForm] = useState({ code: '', tenant_id: '' })
  
  // Subscription management
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [plansData, addonsData, giftCardsData, subsData] = await Promise.allSettled([
        api.get('/api/v1/billing/plans'),
        api.get('/api/v1/billing/addons'),
        api.get('/api/v1/billing/gift-cards'),
        api.get('/api/v1/billing/subscriptions'),
      ])
      if (plansData.status === 'fulfilled') setPlans(plansData.value)
      if (addonsData.status === 'fulfilled') setAddons(addonsData.value)
      if (giftCardsData.status === 'fulfilled') setGiftCards(giftCardsData.value)
      if (subsData.status === 'fulfilled') setSubscriptions(subsData.value)
    } catch (e: any) {
      toast.error('Failed to load billing data: ' + (e.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleSavePlan = async () => {
    try {
      if (editingPlan) {
        await api.patch(`/api/v1/billing/plans/${editingPlan.id}`, planForm)
        toast.success('Plan updated successfully')
      } else {
        await api.post('/api/v1/billing/plans', planForm)
        toast.success('Plan created successfully')
      }
      setPlanDialogOpen(false)
      setEditingPlan(null)
      setPlanForm({ code: '', name: '', monthly_price: 0, included_credits: 0, features_json: '', active: true })
      loadData()
    } catch (e: any) {
      toast.error('Failed to save plan: ' + (e.message || 'Unknown error'))
    }
  }

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return
    try {
      await api.delete(`/api/v1/billing/plans/${id}`)
      toast.success('Plan deleted successfully')
      loadData()
    } catch (e: any) {
      toast.error('Failed to delete plan: ' + (e.message || 'Unknown error'))
    }
  }

  const handleSaveAddon = async () => {
    try {
      if (editingAddon) {
        await api.patch(`/api/v1/billing/addons/${editingAddon.id}`, addonForm)
        toast.success('Addon updated successfully')
      } else {
        await api.post('/api/v1/billing/addons', addonForm)
        toast.success('Addon created successfully')
      }
      setAddonDialogOpen(false)
      setEditingAddon(null)
      setAddonForm({ code: '', name: '', monthly_price: 0, feature_code: '', info_text: '', active: true })
      loadData()
    } catch (e: any) {
      toast.error('Failed to save addon: ' + (e.message || 'Unknown error'))
    }
  }

  const handleDeleteAddon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this addon?')) return
    try {
      await api.delete(`/api/v1/billing/addons/${id}`)
      toast.success('Addon deleted successfully')
      loadData()
    } catch (e: any) {
      toast.error('Failed to delete addon: ' + (e.message || 'Unknown error'))
    }
  }

  const handleGrantCredits = async () => {
    try {
      await api.post('/api/v1/billing/credits/grant', creditForm)
      toast.success('Credits granted successfully')
      setCreditDialogOpen(false)
      setCreditForm({ tenant_id: '', amount: 0, reason: '' })
    } catch (e: any) {
      toast.error('Failed to grant credits: ' + (e.message || 'Unknown error'))
    }
  }

  const handleRevokeCredits = async () => {
    try {
      await api.post('/api/v1/billing/credits/revoke', creditForm)
      toast.success('Credits revoked successfully')
      setCreditDialogOpen(false)
      setCreditForm({ tenant_id: '', amount: 0, reason: '' })
    } catch (e: any) {
      toast.error('Failed to revoke credits: ' + (e.message || 'Unknown error'))
    }
  }

  const handleCreateGiftCard = async () => {
    try {
      await api.post('/api/v1/billing/gift-cards', {
        ...giftCardForm,
        expires_at: giftCardForm.expires_at || null,
      })
      toast.success('Gift card created successfully')
      setGiftCardDialogOpen(false)
      setGiftCardForm({ code: '', credits: 0, max_uses: 1, expires_at: '' })
      loadData()
    } catch (e: any) {
      toast.error('Failed to create gift card: ' + (e.message || 'Unknown error'))
    }
  }

  const handleRedeemGiftCard = async () => {
    try {
      await api.post(`/api/v1/billing/gift-cards/${redeemForm.code}/redeem/${redeemForm.tenant_id}`)
      toast.success('Gift card redeemed successfully')
      setRedeemDialogOpen(false)
      setRedeemForm({ code: '', tenant_id: '' })
      loadData()
    } catch (e: any) {
      toast.error('Failed to redeem gift card: ' + (e.message || 'Unknown error'))
    }
  }

  const handleDeleteGiftCard = async (code: string) => {
    if (!confirm('Are you sure you want to delete this gift card?')) return
    try {
      await api.delete(`/api/v1/billing/gift-cards/${code}`)
      toast.success('Gift card deleted successfully')
      loadData()
    } catch (e: any) {
      toast.error('Failed to delete gift card: ' + (e.message || 'Unknown error'))
    }
  }

  const handlePauseSubscription = async (id: string) => {
    try {
      await api.post(`/api/v1/billing/subscriptions/${id}/pause`)
      toast.success('Subscription paused successfully')
      loadData()
    } catch (e: any) {
      toast.error('Failed to pause subscription: ' + (e.message || 'Unknown error'))
    }
  }

  const handleResumeSubscription = async (id: string) => {
    try {
      await api.post(`/api/v1/billing/subscriptions/${id}/resume`)
      toast.success('Subscription resumed successfully')
      loadData()
    } catch (e: any) {
      toast.error('Failed to resume subscription: ' + (e.message || 'Unknown error'))
    }
  }

  const handleCancelSubscription = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return
    try {
      await api.post(`/api/v1/billing/subscriptions/${id}/cancel`)
      toast.success('Subscription canceled successfully')
      loadData()
    } catch (e: any) {
      toast.error('Failed to cancel subscription: ' + (e.message || 'Unknown error'))
    }
  }

  return (
    <div className="space-y-6">
      <BackButton />
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription Management</h1>
        <p className="mt-1 text-muted-foreground">Manage plans, addons, credits, gift cards, and subscriptions</p>
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="addons">Addons</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
          <TabsTrigger value="gift-cards">Gift Cards</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">SaaS Plans</h2>
            <Button onClick={() => { setEditingPlan(null); setPlanForm({ code: '', name: '', monthly_price: 0, included_credits: 0, features_json: '', active: true }); setPlanDialogOpen(true) }}>
              <Plus className="mr-2 h-4 w-4" /> Create Plan
            </Button>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <Badge variant={plan.active ? 'default' : 'secondary'} className="mt-2">
                          {plan.code}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingPlan(plan); setPlanForm(plan); setPlanDialogOpen(true) }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeletePlan(plan.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">GHS {plan.monthly_price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                    <div className="mt-2 text-sm text-muted-foreground">{plan.included_credits} credits included</div>
                    <div className="mt-4">
                      <Badge variant={plan.active ? 'default' : 'outline'}>
                        {plan.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Addons Tab */}
        <TabsContent value="addons" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Addons</h2>
            <Button onClick={() => { setEditingAddon(null); setAddonForm({ code: '', name: '', monthly_price: 0, feature_code: '', info_text: '', active: true }); setAddonDialogOpen(true) }}>
              <Plus className="mr-2 h-4 w-4" /> Create Addon
            </Button>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {addons.map((addon) => (
                <Card key={addon.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{addon.name}</CardTitle>
                        <Badge variant="outline" className="mt-2">{addon.code}</Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingAddon(addon); setAddonForm(addon); setAddonDialogOpen(true) }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteAddon(addon.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">GHS {addon.monthly_price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                    <div className="mt-2 text-sm text-muted-foreground">Feature: {addon.feature_code}</div>
                    {addon.info_text && <div className="mt-2 text-sm">{addon.info_text}</div>}
                    <div className="mt-4">
                      <Badge variant={addon.active ? 'default' : 'outline'}>
                        {addon.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Credits Tab */}
        <TabsContent value="credits" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Credit Management</h2>
            <Button onClick={() => setCreditDialogOpen(true)}>
              <Wallet className="mr-2 h-4 w-4" /> Grant/Revoke Credits
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Grant or revoke credits for tenants. Use this to compensate customers for service issues or promotional credits.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gift Cards Tab */}
        <TabsContent value="gift-cards" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gift Cards</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRedeemDialogOpen(true)}>
                <Gift className="mr-2 h-4 w-4" /> Redeem
              </Button>
              <Button onClick={() => setGiftCardDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create Gift Card
              </Button>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {giftCards.map((card) => (
                <Card key={card.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-mono">{card.code}</CardTitle>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteGiftCard(card.code)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.credits} credits</div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Uses: {card.remaining_uses}/{card.max_uses}
                    </div>
                    {card.expires_at && (
                      <div className="mt-1 text-sm text-muted-foreground">
                        Expires: {new Date(card.expires_at).toLocaleDateString()}
                      </div>
                    )}
                    <div className="mt-4">
                      <Badge variant={card.active ? 'default' : 'outline'}>
                        {card.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Subscriptions</h2>
            <Button onClick={loadData} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <Card key={sub.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{sub.tenant_id}</div>
                        <div className="text-sm text-muted-foreground">Plan: {sub.plan_code}</div>
                        <Badge className="mt-2" variant={sub.status === 'active' ? 'default' : 'outline'}>{sub.status}</Badge>
                      </div>
                      <div className="flex gap-2">
                        {sub.status === 'active' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handlePauseSubscription(sub.id)}>
                              <Pause className="h-4 w-4 mr-1" /> Pause
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleCancelSubscription(sub.id)}>
                              <Ban className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                          </>
                        )}
                        {sub.status === 'suspended' && (
                          <Button size="sm" onClick={() => handleResumeSubscription(sub.id)}>
                            <Play className="h-4 w-4 mr-1" /> Resume
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Plan Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={planForm.code} onChange={e => setPlanForm({ ...planForm, code: e.target.value })} placeholder="e.g., professional" />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} placeholder="e.g., Professional Plan" />
            </div>
            <div className="space-y-2">
              <Label>Monthly Price (GHS)</Label>
              <Input type="number" value={planForm.monthly_price} onChange={e => setPlanForm({ ...planForm, monthly_price: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Included Credits</Label>
              <Input type="number" value={planForm.included_credits} onChange={e => setPlanForm({ ...planForm, included_credits: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Features JSON</Label>
              <Textarea value={planForm.features_json} onChange={e => setPlanForm({ ...planForm, features_json: e.target.value })} placeholder='{"feature1": true, "feature2": false}' />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="plan-active" checked={planForm.active} onChange={e => setPlanForm({ ...planForm, active: e.target.checked })} />
              <Label htmlFor="plan-active">Active</Label>
            </div>
            <Button className="w-full" onClick={handleSavePlan}>
              {editingPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Addon Dialog */}
      <Dialog open={addonDialogOpen} onOpenChange={setAddonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAddon ? 'Edit Addon' : 'Create Addon'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={addonForm.code} onChange={e => setAddonForm({ ...addonForm, code: e.target.value })} placeholder="e.g., extra_drivers" />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={addonForm.name} onChange={e => setAddonForm({ ...addonForm, name: e.target.value })} placeholder="e.g., Extra Drivers" />
            </div>
            <div className="space-y-2">
              <Label>Monthly Price (GHS)</Label>
              <Input type="number" value={addonForm.monthly_price} onChange={e => setAddonForm({ ...addonForm, monthly_price: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Feature Code</Label>
              <Input value={addonForm.feature_code} onChange={e => setAddonForm({ ...addonForm, feature_code: e.target.value })} placeholder="e.g., EXTRA_DRIVERS" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={addonForm.info_text} onChange={e => setAddonForm({ ...addonForm, info_text: e.target.value })} placeholder="Addon description" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="addon-active" checked={addonForm.active} onChange={e => setAddonForm({ ...addonForm, active: e.target.checked })} />
              <Label htmlFor="addon-active">Active</Label>
            </div>
            <Button className="w-full" onClick={handleSaveAddon}>
              {editingAddon ? 'Update Addon' : 'Create Addon'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credit Dialog */}
      <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant/Revoke Credits</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Tenant ID</Label>
              <Input value={creditForm.tenant_id} onChange={e => setCreditForm({ ...creditForm, tenant_id: e.target.value })} placeholder="Tenant UUID" />
            </div>
            <div className="space-y-2">
              <Label>Amount (positive to grant, negative to revoke)</Label>
              <Input type="number" value={creditForm.amount} onChange={e => setCreditForm({ ...creditForm, amount: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input value={creditForm.reason} onChange={e => setCreditForm({ ...creditForm, reason: e.target.value })} placeholder="e.g., Service compensation" />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleGrantCredits} disabled={!creditForm.tenant_id || !creditForm.amount}>
                <Plus className="mr-2 h-4 w-4" /> Grant
              </Button>
              <Button className="flex-1" variant="destructive" onClick={handleRevokeCredits} disabled={!creditForm.tenant_id || !creditForm.amount}>
                <Minus className="mr-2 h-4 w-4" /> Revoke
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gift Card Dialog */}
      <Dialog open={giftCardDialogOpen} onOpenChange={setGiftCardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Gift Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={giftCardForm.code} onChange={e => setGiftCardForm({ ...giftCardForm, code: e.target.value })} placeholder="e.g., PROMO2024" />
            </div>
            <div className="space-y-2">
              <Label>Credits</Label>
              <Input type="number" value={giftCardForm.credits} onChange={e => setGiftCardForm({ ...giftCardForm, credits: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Max Uses</Label>
              <Input type="number" value={giftCardForm.max_uses} onChange={e => setGiftCardForm({ ...giftCardForm, max_uses: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="space-y-2">
              <Label>Expires At (optional)</Label>
              <Input type="datetime-local" value={giftCardForm.expires_at} onChange={e => setGiftCardForm({ ...giftCardForm, expires_at: e.target.value })} />
            </div>
            <Button className="w-full" onClick={handleCreateGiftCard}>
              Create Gift Card
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Redeem Gift Card Dialog */}
      <Dialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Gift Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Gift Card Code</Label>
              <Input value={redeemForm.code} onChange={e => setRedeemForm({ ...redeemForm, code: e.target.value })} placeholder="e.g., PROMO2024" />
            </div>
            <div className="space-y-2">
              <Label>Tenant ID</Label>
              <Input value={redeemForm.tenant_id} onChange={e => setRedeemForm({ ...redeemForm, tenant_id: e.target.value })} placeholder="Tenant UUID" />
            </div>
            <Button className="w-full" onClick={handleRedeemGiftCard}>
              Redeem Gift Card
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
