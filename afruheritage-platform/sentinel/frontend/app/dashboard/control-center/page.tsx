'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  SlidersHorizontal,
  Globe,
  Users,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Shield,
  Truck,
  MapPin,
  Bell,
  Webhook,
  Smartphone,
  Route,
  PackageCheck,
  Contact,
  DollarSign,
  Zap,
  Plus,
  Trash2,
  Boxes,
  UsersRound,
  FileSpreadsheet,
  Eye,
  Map,
  Store,
} from 'lucide-react'

const PHASE_LABELS: Record<string, string> = {
  phase_1: 'Phase 1 — Immediate',
  phase_2: 'Phase 2 — Short-term',
  phase_3: 'Phase 3 — Medium-term',
  shared: 'Shared Services — Tenant-level',
}

const PHASE_COLORS: Record<string, string> = {
  phase_1: 'bg-green-100 text-green-700',
  phase_2: 'bg-blue-100 text-blue-700',
  phase_3: 'bg-purple-100 text-purple-700',
  shared: 'bg-amber-100 text-amber-700',
}

const FEATURE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pod: PackageCheck,
  contacts_places: Contact,
  service_rates: DollarSign,
  dispatch_engine: Truck,
  route_planning: Route,
  webhooks: Webhook,
  notifications: Bell,
  route_optimization: MapPin,
  vrp_solver: Zap,
  driver_mobile_app: Smartphone,
  shipments: Boxes,
  group_members: UsersRound,
  csv_import: FileSpreadsheet,
  public_tracking: Eye,
  maps: Map,
  storefront: Store,
}

interface FeatureFlag {
  id: string
  feature_code: string
  phase: string
  display_name: string
  description: string | null
  enabled_globally: boolean
  requires_plan_upgrade: boolean
  min_plan_code: string | null
}

interface TenantAssignment {
  id: string
  tenant_id: string
  feature_code: string
  enabled: boolean
  enabled_until: string | null
  notes: string | null
}

interface Summary {
  total_features: number
  globally_enabled: number
  total_tenant_assignments: number
  active_tenant_assignments: number
  features_by_phase: Record<string, number>
}

export default function ControlCenterPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [features, setFeatures] = useState<FeatureFlag[]>([])
  const [assignments, setAssignments] = useState<TenantAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [newTenantId, setNewTenantId] = useState('')
  const [newFeatureCode, setNewFeatureCode] = useState('')

  const loadAll = async () => {
    setLoading(true)
    try {
      const [sumData, featData, assignData] = await Promise.all([
        api.get<Summary>('/sentinel/control-center/summary'),
        api.get<FeatureFlag[]>('/sentinel/control-center/features'),
        api.get<TenantAssignment[]>('/sentinel/control-center/tenant-features'),
      ])
      setSummary(sumData)
      setFeatures(featData)
      setAssignments(assignData)
    } catch (e: any) {
      toast.error('Failed to load Control Center data: ' + (e.message || 'Unknown'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const toggleGlobal = async (feature: FeatureFlag) => {
    setActionLoading(feature.feature_code)
    try {
      await api.patch(`/sentinel/control-center/features/${feature.feature_code}`, {
        enabled_globally: !feature.enabled_globally,
      })
      toast.success(`${feature.display_name} is now ${!feature.enabled_globally ? 'globally enabled' : 'disabled'}`)
      loadAll()
    } catch (e: any) {
      toast.error('Failed to update: ' + (e.message || 'Unknown'))
    } finally {
      setActionLoading(null)
    }
  }

  const createAssignment = async () => {
    if (!newTenantId.trim() || !newFeatureCode.trim()) return
    setActionLoading('create')
    try {
      await api.post('/sentinel/control-center/tenant-features', {
        tenant_id: newTenantId.trim(),
        feature_code: newFeatureCode.trim(),
        enabled: true,
      })
      toast.success('Tenant feature assignment created')
      setNewTenantId('')
      setNewFeatureCode('')
      loadAll()
    } catch (e: any) {
      toast.error('Failed to create assignment: ' + (e.message || 'Unknown'))
    } finally {
      setActionLoading(null)
    }
  }

  const deleteAssignment = async (id: string) => {
    setActionLoading(id)
    try {
      await api.delete(`/sentinel/control-center/tenant-features/${id}`)
      toast.success('Assignment deleted')
      loadAll()
    } catch (e: any) {
      toast.error('Failed to delete: ' + (e.message || 'Unknown'))
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SlidersHorizontal className="h-6 w-6 text-primary" />
            Control Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage platform-wide feature flags and per-tenant feature assignments.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{summary.total_features}</p>
                  <p className="text-xs text-muted-foreground">Total Features</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{summary.globally_enabled}</p>
                  <p className="text-xs text-muted-foreground">Globally Enabled</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{summary.total_tenant_assignments}</p>
                  <p className="text-xs text-muted-foreground">Tenant Assignments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{summary.active_tenant_assignments}</p>
                  <p className="text-xs text-muted-foreground">Active Assignments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="features">
        <TabsList>
          <TabsTrigger value="features">Feature Flags</TabsTrigger>
          <TabsTrigger value="assignments">Tenant Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-4 mt-4">
          {Object.entries(PHASE_LABELS).map(([phase, label]) => {
            const phaseFeatures = features.filter((f) => f.phase === phase)
            if (phaseFeatures.length === 0) return null
            return (
              <Card key={phase}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={PHASE_COLORS[phase]}>{label}</Badge>
                    <span className="text-sm text-muted-foreground">{phaseFeatures.length} features</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {phaseFeatures.map((feature) => {
                    const Icon = FEATURE_ICONS[feature.feature_code] || Shield
                    return (
                      <div key={feature.id} className="flex items-start justify-between border-b last:border-0 pb-3 last:pb-0">
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{feature.display_name}</p>
                              {feature.requires_plan_upgrade && (
                                <Badge variant="outline" className="text-[10px]">
                                  {feature.min_plan_code || 'Plan'}+
                                </Badge>
                              )}
                            </div>
                            {feature.description && (
                              <p className="text-sm text-muted-foreground mt-0.5 max-w-xl">{feature.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">Code: <code className="bg-muted px-1 rounded">{feature.feature_code}</code></p>
                          </div>
                        </div>
                        <Button
                          variant={feature.enabled_globally ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleGlobal(feature)}
                          disabled={actionLoading === feature.feature_code}
                        >
                          {actionLoading === feature.feature_code ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : feature.enabled_globally ? (
                            <><ToggleRight className="h-4 w-4 mr-1" /> Enabled</>
                          ) : (
                            <><ToggleLeft className="h-4 w-4 mr-1" /> Disabled</>
                          )}
                        </Button>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create New Assignment</CardTitle>
              <CardDescription>Assign a specific feature to a tenant.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Tenant ID (UUID or slug)"
                value={newTenantId}
                onChange={(e) => setNewTenantId(e.target.value)}
                className="flex-1"
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newFeatureCode}
                onChange={(e) => setNewFeatureCode(e.target.value)}
              >
                <option value="">Select feature...</option>
                {features.map((f) => (
                  <option key={f.feature_code} value={f.feature_code}>{f.display_name}</option>
                ))}
              </select>
              <Button onClick={createAssignment} disabled={actionLoading === 'create' || !newTenantId.trim() || !newFeatureCode.trim()}>
                {actionLoading === 'create' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Assign</>}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No tenant assignments yet.</p>
              ) : (
                <div className="space-y-2">
                  {assignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                      <div className="flex items-center gap-3">
                        <Badge variant={a.enabled ? 'default' : 'secondary'} className="text-[10px]">
                          {a.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">{a.feature_code}</p>
                          <p className="text-xs text-muted-foreground">Tenant: {a.tenant_id}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAssignment(a.id)}
                        disabled={actionLoading === a.id}
                      >
                        {actionLoading === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-500" />}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
