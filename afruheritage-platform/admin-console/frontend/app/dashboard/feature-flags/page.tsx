'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { BackButton } from '@/components/back-button'
import {
  Flag,
  RefreshCw,
  Search,
  Plus,
  Edit,
  Trash2,
  Globe,
  Building2,
  Check,
  X,
} from 'lucide-react'

interface FeatureFlag {
  key: string
  name: string
  description: string
  enabled: boolean
  category?: string
}

interface TenantFeatureFlags {
  tenant_id: string
  tenant_name?: string
  flags: Record<string, boolean>
}

interface GlobalFeatureFlags {
  flags: Record<string, boolean>
}

export default function FeatureFlagsPage() {
  const [globalFlags, setGlobalFlags] = useState<GlobalFeatureFlags | null>(null)
  const [tenantFlags, setTenantFlags] = useState<TenantFeatureFlags[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [tenantFilter, setTenantFilter] = useState('')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<TenantFeatureFlags | null>(null)

  const loadGlobalFlags = async () => {
    try {
      const response = await api.get('/admin/feature-flags/global')
      setGlobalFlags(response)
    } catch (error) {
      toast.error('Failed to load global feature flags')
      console.error(error)
    }
  }

  const loadTenantFlags = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/tenants')
      const flagsData = await Promise.all(
        (response || []).map(async (tenant: any) => {
          try {
            const flags = await api.get(`/admin/feature-flags/tenant/${tenant.id}`)
            return {
              tenant_id: tenant.id,
              tenant_name: tenant.company_name,
              flags: flags.flags || {},
            }
          } catch {
            return {
              tenant_id: tenant.id,
              tenant_name: tenant.company_name,
              flags: {},
            }
          }
        })
      )
      setTenantFlags(flagsData)
    } catch (error) {
      toast.error('Failed to load tenant feature flags')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGlobalFlags()
    loadTenantFlags()
  }, [])

  const handleToggleGlobalFlag = async (key: string, enabled: boolean) => {
    if (!globalFlags) return
    try {
      const updatedFlags = { ...globalFlags.flags, [key]: enabled }
      await api.patch('/admin/feature-flags/global', { flags: updatedFlags })
      setGlobalFlags({ flags: updatedFlags })
      toast.success('Global flag updated successfully')
    } catch (error) {
      toast.error('Failed to update global flag')
    }
  }

  const handleToggleTenantFlag = async (tenantId: string, key: string, enabled: boolean) => {
    try {
      const tenant = tenantFlags.find((t) => t.tenant_id === tenantId)
      if (!tenant) return
      const updatedFlags = { ...tenant.flags, [key]: enabled }
      await api.patch(`/admin/feature-flags/tenant/${tenantId}`, { flags: updatedFlags })
      setTenantFlags(
        tenantFlags.map((t) =>
          t.tenant_id === tenantId ? { ...t, flags: updatedFlags } : t
        )
      )
      toast.success('Tenant flag updated successfully')
    } catch (error) {
      toast.error('Failed to update tenant flag')
    }
  }

  const handleEditTenantFlags = async () => {
    if (!selectedTenant) return
    try {
      await api.patch(`/admin/feature-flags/tenant/${selectedTenant.tenant_id}`, {
        flags: selectedTenant.flags,
      })
      toast.success('Tenant flags updated successfully')
      setEditDialogOpen(false)
      loadTenantFlags()
    } catch (error) {
      toast.error('Failed to update tenant flags')
    }
  }

  const flagDefinitions: FeatureFlag[] = [
    { key: 'maps_enabled', name: 'Maps', description: 'Enable map visualization', enabled: true, category: 'Core' },
    { key: 'public_tracking_enabled', name: 'Public Tracking', description: 'Enable public shipment tracking', enabled: true, category: 'Core' },
    { key: 'csv_import_enabled', name: 'CSV Import', description: 'Enable bulk CSV import', enabled: true, category: 'Core' },
    { key: 'group_members_enabled', name: 'Group Members', description: 'Enable group member management', enabled: true, category: 'Core' },
    { key: 'ai_chat_enabled', name: 'AI Chat', description: 'Enable AI assistant chat', enabled: true, category: 'AI' },
    { key: 'custom_domains_enabled', name: 'Custom Domains', description: 'Enable custom domain support', enabled: false, category: 'Advanced' },
    { key: 'api_access_enabled', name: 'API Access', description: 'Enable API access for tenant', enabled: false, category: 'Advanced' },
    { key: 'analytics_enabled', name: 'Analytics', description: 'Enable analytics dashboard', enabled: true, category: 'Analytics' },
    { key: 'warehouse_enabled', name: 'Warehouse', description: 'Enable warehouse management', enabled: false, category: 'Operations' },
    { key: 'customs_enabled', name: 'Customs', description: 'Enable customs integration', enabled: false, category: 'Operations' },
  ]

  const filteredTenants = tenantFlags.filter(
    (tenant) =>
      tenant.tenant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.tenant_id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-3xl font-bold">Feature Flags</h1>
        </div>
        <Button onClick={() => { loadGlobalFlags(); loadTenantFlags(); }} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="global" className="space-y-6">
        <TabsList>
          <TabsTrigger value="global">
            <Globe className="w-4 h-4 mr-2" />
            Global Flags
          </TabsTrigger>
          <TabsTrigger value="tenant">
            <Building2 className="w-4 h-4 mr-2" />
            Tenant Flags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Feature Flags</CardTitle>
            </CardHeader>
            <CardContent>
              {globalFlags ? (
                <div className="space-y-4">
                  {flagDefinitions.map((flag) => (
                    <div key={flag.key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Flag className="w-4 h-4 text-gray-400" />
                          <h3 className="font-medium">{flag.name}</h3>
                          <Badge variant="outline">{flag.category}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{flag.description}</p>
                      </div>
                      <Switch
                        checked={globalFlags.flags[flag.key] || false}
                        onCheckedChange={(checked) => handleToggleGlobalFlag(flag.key, checked)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">Loading global flags...</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenant" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by tenant name or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading tenant flags...</div>
              ) : filteredTenants.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No tenants found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maps</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CSV Import</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI Chat</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Analytics</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredTenants.map((tenant) => (
                        <tr key={tenant.tenant_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap font-medium">{tenant.tenant_name || tenant.tenant_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Switch
                              checked={tenant.flags.maps_enabled || false}
                              onCheckedChange={(checked) => handleToggleTenantFlag(tenant.tenant_id, 'maps_enabled', checked)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Switch
                              checked={tenant.flags.public_tracking_enabled || false}
                              onCheckedChange={(checked) => handleToggleTenantFlag(tenant.tenant_id, 'public_tracking_enabled', checked)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Switch
                              checked={tenant.flags.csv_import_enabled || false}
                              onCheckedChange={(checked) => handleToggleTenantFlag(tenant.tenant_id, 'csv_import_enabled', checked)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Switch
                              checked={tenant.flags.ai_chat_enabled || false}
                              onCheckedChange={(checked) => handleToggleTenantFlag(tenant.tenant_id, 'ai_chat_enabled', checked)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Switch
                              checked={tenant.flags.analytics_enabled || false}
                              onCheckedChange={(checked) => handleToggleTenantFlag(tenant.tenant_id, 'analytics_enabled', checked)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button size="sm" variant="ghost" onClick={() => { setSelectedTenant(tenant); setEditDialogOpen(true); }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Tenant Flags Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tenant Feature Flags</DialogTitle>
            <DialogDescription>Configure feature flags for {selectedTenant?.tenant_name}</DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4">
              {flagDefinitions.map((flag) => (
                <div key={flag.key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-gray-400" />
                      <h3 className="font-medium">{flag.name}</h3>
                      <Badge variant="outline">{flag.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{flag.description}</p>
                  </div>
                  <Switch
                    checked={selectedTenant.flags[flag.key] || false}
                    onCheckedChange={(checked) =>
                      setSelectedTenant({
                        ...selectedTenant,
                        flags: { ...selectedTenant.flags, [flag.key]: checked },
                      })
                    }
                  />
                </div>
              ))}
              <Button onClick={handleEditTenantFlags} className="w-full">Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
