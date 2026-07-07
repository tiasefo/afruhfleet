'use client'

import { useEffect, useState } from 'react'
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '@/components/ui/drawer'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  Plus,
  Minus,
  Gift,
  Pause,
  Play,
  Ban,
  Trash2,
  Edit,
  RefreshCw,
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

interface BillingDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BillingDrawer({ open, onOpenChange }: BillingDrawerProps) {
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
    if (open) {
      loadData()
    }
  }, [open])

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
      await api.post('/api/v1/billing/gift-cards', giftCardForm)
      toast.success('Gift card created successfully')
      setGiftCardDialogOpen(false)
      setGiftCardForm({ code: '', credits: 0, max_uses: 1, expires_at: '' })
      loadData()
    } catch (e: any) {
      toast.error('Failed to create gift card: ' + (e.message || 'Unknown error'))
    }
  }

  const handleDeleteGiftCard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gift card?')) return
    try {
      await api.delete(`/api/v1/billing/gift-cards/${id}`)
      toast.success('Gift card deleted successfully')
      loadData()
    } catch (e: any) {
      toast.error('Failed to delete gift card: ' + (e.message || 'Unknown error'))
    }
  }

  const handleRedeemGiftCard = async () => {
    try {
      await api.post(`/api/v1/billing/gift-cards/${redeemForm.code}/redeem/${redeemForm.tenant_id}`, redeemForm)
      toast.success('Gift card redeemed successfully')
      setRedeemDialogOpen(false)
      setRedeemForm({ code: '', tenant_id: '' })
      loadData()
    } catch (e: any) {
      toast.error('Failed to redeem gift card: ' + (e.message || 'Unknown error'))
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

  const handleEnableSubscription = async (id: string) => {
    try {
      await api.post(`/api/v1/billing/subscriptions/${id}/enable`)
      toast.success('Subscription enabled successfully')
      loadData()
    } catch (e: any) {
      toast.error('Failed to enable subscription: ' + (e.message || 'Unknown error'))
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh] max-w-4xl mx-auto">
        <DrawerHeader>
          <DrawerTitle>Billing & Subscription Management</DrawerTitle>
          <DrawerDescription>Manage plans, addons, credits, gift cards, and subscriptions</DrawerDescription>
        </DrawerHeader>
        
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <Tabs defaultValue="plans" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="plans">Plans</TabsTrigger>
                <TabsTrigger value="addons">Addons</TabsTrigger>
                <TabsTrigger value="credits">Credits</TabsTrigger>
                <TabsTrigger value="gift-cards">Gift Cards</TabsTrigger>
                <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              </TabsList>

              {/* Plans Tab */}
              <TabsContent value="plans" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Subscription Plans</h3>
                  <Button onClick={() => { setEditingPlan(null); setPlanForm({ code: '', name: '', monthly_price: 0, included_credits: 0, features_json: '', active: true }); setPlanDialogOpen(true) }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Plan
                  </Button>
                </div>
                <div className="space-y-2">
                  {plans.map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-sm text-muted-foreground">{plan.code} • ₵{plan.monthly_price}/mo • {plan.included_credits} credits</div>
                        <Badge variant={plan.active ? 'default' : 'secondary'}>{plan.active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingPlan(plan); setPlanForm({ code: plan.code, name: plan.name, monthly_price: plan.monthly_price, included_credits: plan.included_credits, features_json: plan.features_json || '', active: plan.active }); setPlanDialogOpen(true) }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePlan(plan.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Addons Tab */}
              <TabsContent value="addons" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Addons</h3>
                  <Button onClick={() => { setEditingAddon(null); setAddonForm({ code: '', name: '', monthly_price: 0, feature_code: '', info_text: '', active: true }); setAddonDialogOpen(true) }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Addon
                  </Button>
                </div>
                <div className="space-y-2">
                  {addons.map((addon) => (
                    <div key={addon.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <div className="font-medium">{addon.name}</div>
                        <div className="text-sm text-muted-foreground">{addon.code} • ₵{addon.monthly_price}/mo • {addon.feature_code}</div>
                        {addon.info_text && <div className="text-xs text-muted-foreground">{addon.info_text}</div>}
                        <Badge variant={addon.active ? 'default' : 'secondary'}>{addon.active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingAddon(addon); setAddonForm({ code: addon.code, name: addon.name, monthly_price: addon.monthly_price, feature_code: addon.feature_code, info_text: addon.info_text || '', active: addon.active }); setAddonDialogOpen(true) }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAddon(addon.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Credits Tab */}
              <TabsContent value="credits" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Credit Management</h3>
                  <Button onClick={() => setCreditDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Grant/Revoke Credits
                  </Button>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Grant or revoke credits for tenant accounts. Use positive amounts to grant credits and negative amounts to revoke credits.</p>
                </div>
              </TabsContent>

              {/* Gift Cards Tab */}
              <TabsContent value="gift-cards" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Gift Cards</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setRedeemDialogOpen(true)}>
                      <RefreshCw className="mr-2 h-4 w-4" /> Redeem
                    </Button>
                    <Button onClick={() => setGiftCardDialogOpen(true)}>
                      <Gift className="mr-2 h-4 w-4" /> Create Gift Card
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {giftCards.map((card) => (
                    <div key={card.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <div className="font-medium">{card.code}</div>
                        <div className="text-sm text-muted-foreground">{card.credits} credits • {card.remaining_uses}/{card.max_uses} uses</div>
                        {card.expires_at && <div className="text-xs text-muted-foreground">Expires: {new Date(card.expires_at).toLocaleString()}</div>}
                        <Badge variant={card.active ? 'default' : 'secondary'}>{card.active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteGiftCard(card.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Subscriptions Tab */}
              <TabsContent value="subscriptions" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Tenant Subscriptions</h3>
                </div>
                <div className="space-y-2">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <div className="font-medium">{sub.plan_code}</div>
                        <div className="text-sm text-muted-foreground">Tenant: {sub.tenant_id} • {sub.currency}</div>
                        <div className="text-xs text-muted-foreground">Started: {new Date(sub.started_at).toLocaleString()}</div>
                        <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>{sub.status}</Badge>
                        {sub.read_only_reason && <div className="text-xs text-red-500 mt-1">{sub.read_only_reason}</div>}
                      </div>
                      <div className="flex gap-2">
                        {sub.status === 'active' && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handlePauseSubscription(sub.id)} title="Pause">
                              <Pause className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleCancelSubscription(sub.id)} title="Cancel">
                              <Ban className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {sub.status === 'paused' && (
                          <Button variant="ghost" size="icon" onClick={() => handleResumeSubscription(sub.id)} title="Resume">
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {sub.status === 'canceled' && (
                          <Button variant="ghost" size="icon" onClick={() => handleEnableSubscription(sub.id)} title="Enable">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Plan Dialog */}
        <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={planForm.code} onChange={e => setPlanForm({ ...planForm, code: e.target.value })} placeholder="e.g., PRO" />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} placeholder="e.g., Professional" />
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
                <Label>Features (JSON)</Label>
                <Textarea value={planForm.features_json} onChange={e => setPlanForm({ ...planForm, features_json: e.target.value })} placeholder='{"feature1": true, "feature2": "value"}' />
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
                <Input value={addonForm.code} onChange={e => setAddonForm({ ...addonForm, code: e.target.value })} placeholder="e.g., EXTRA_SHIPMENTS" />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={addonForm.name} onChange={e => setAddonForm({ ...addonForm, name: e.target.value })} placeholder="e.g., Extra Shipments" />
              </div>
              <div className="space-y-2">
                <Label>Monthly Price (GHS)</Label>
                <Input type="number" value={addonForm.monthly_price} onChange={e => setAddonForm({ ...addonForm, monthly_price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Feature Code</Label>
                <Input value={addonForm.feature_code} onChange={e => setAddonForm({ ...addonForm, feature_code: e.target.value })} placeholder="e.g., extra_shipments" />
              </div>
              <div className="space-y-2">
                <Label>Info Text</Label>
                <Input value={addonForm.info_text} onChange={e => setAddonForm({ ...addonForm, info_text: e.target.value })} placeholder="Optional description" />
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
      </DrawerContent>
    </Drawer>
  )
}
