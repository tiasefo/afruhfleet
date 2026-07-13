"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Settings, Save, Tag, AlertCircle } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface PlatformSettings {
  default_trial_days: number
}

interface PlanTier {
  tier_code: string
  display_name: string
  price_monthly: number
  max_group_members: number
  features: string[]
  is_active: boolean
}

export function PlansPricingDrawer({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<PlatformSettings>({ default_trial_days: 14 })
  const [tiers, setTiers] = useState<PlanTier[]>([])
  const [editingTier, setEditingTier] = useState<PlanTier | null>(null)
  const [editForm, setEditForm] = useState({
    display_name: "",
    price_monthly: "",
    max_group_members: "",
    features: "",
    is_active: true,
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [s, t] = await Promise.all([
        api.get<PlatformSettings>("/sentinel/settings/platform"),
        api.get<PlanTier[]>("/sentinel/settings/plan-tiers"),
      ])
      setSettings(s)
      setTiers(t)
    } catch (err) {
      toast.error("Failed to load platform settings")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) loadData()
  }, [open, loadData])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const updated = await api.patch<PlatformSettings>("/sentinel/settings/platform", {
        default_trial_days: settings.default_trial_days,
      })
      setSettings(updated)
      toast.success("Trial days updated")
    } catch {
      toast.error("Failed to update trial days")
    } finally {
      setSaving(false)
    }
  }

  const startEditTier = (tier: PlanTier) => {
    setEditingTier(tier)
    setEditForm({
      display_name: tier.display_name,
      price_monthly: String(tier.price_monthly),
      max_group_members: String(tier.max_group_members),
      features: tier.features.join("\n"),
      is_active: tier.is_active,
    })
  }

  const saveTier = async () => {
    if (!editingTier) return
    setSaving(true)
    try {
      const features = editForm.features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean)
      const updated = await api.patch<PlanTier>(
        `/sentinel/settings/plan-tiers/${editingTier.tier_code}`,
        {
          display_name: editForm.display_name,
          price_monthly: Number(editForm.price_monthly),
          max_group_members: Number(editForm.max_group_members),
          features,
          is_active: editForm.is_active,
        }
      )
      setTiers((prev) =>
        prev.map((t) => (t.tier_code === updated.tier_code ? updated : t))
      )
      setEditingTier(null)
      toast.success(`${updated.display_name} updated`)
    } catch {
      toast.error("Failed to update plan tier")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Tag className="h-4 w-4" />
            Plans & Pricing
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Plans & Pricing Configuration
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 px-4 pb-8">
            <Tabs defaultValue="settings">
              <TabsList className="w-full">
                <TabsTrigger value="settings" className="flex-1">Platform Settings</TabsTrigger>
                <TabsTrigger value="tiers" className="flex-1">Plan Tiers</TabsTrigger>
              </TabsList>

              {/* Platform Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Trial Duration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="trial-days">Default Trial Days</Label>
                      <Input
                        id="trial-days"
                        type="number"
                        min={1}
                        max={365}
                        value={settings.default_trial_days}
                        onChange={(e) =>
                          setSettings({ default_trial_days: Number(e.target.value) })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        New trial subscriptions will expire after this many days. Existing trials are unaffected.
                      </p>
                    </div>
                    <Button onClick={saveSettings} disabled={saving} className="gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Plan Tiers Tab */}
              <TabsContent value="tiers" className="space-y-4">
                {tiers.map((tier) => (
                  <Card key={tier.tier_code}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          {tier.display_name}
                          <Badge variant={tier.is_active ? "default" : "outline"}>
                            {tier.is_active ? "Active" : "Disabled"}
                          </Badge>
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            editingTier?.tier_code === tier.tier_code
                              ? setEditingTier(null)
                              : startEditTier(tier)
                          }
                        >
                          {editingTier?.tier_code === tier.tier_code ? "Cancel" : "Edit"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {editingTier?.tier_code === tier.tier_code ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label>Display Name</Label>
                              <Input
                                value={editForm.display_name}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, display_name: e.target.value })
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label>Price (GHS/month)</Label>
                              <Input
                                type="number"
                                value={editForm.price_monthly}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, price_monthly: e.target.value })
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label>Max Group Members</Label>
                            <Input
                              type="number"
                              value={editForm.max_group_members}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  max_group_members: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Features (one per line)</Label>
                            <Textarea
                              rows={8}
                              value={editForm.features}
                              onChange={(e) =>
                                setEditForm({ ...editForm, features: e.target.value })
                              }
                              className="font-mono text-xs"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={editForm.is_active}
                              onCheckedChange={(checked) =>
                                setEditForm({ ...editForm, is_active: checked })
                              }
                            />
                            <Label>Active</Label>
                          </div>
                          <Button onClick={saveTier} disabled={saving} className="gap-2">
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Save Tier
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Price</span>
                            <span className="font-medium">GHS {tier.price_monthly}/month</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Max Members</span>
                            <span className="font-medium">{tier.max_group_members}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Features</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {tier.features.map((f) => (
                                <Badge key={f} variant="secondary" className="text-xs">
                                  {f}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
