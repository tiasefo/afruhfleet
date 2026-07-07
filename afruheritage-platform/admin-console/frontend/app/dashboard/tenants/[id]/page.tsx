'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  Building2,
  ArrowLeft,
  ShoppingBag,
  Truck,
  Package,
  Users,
  ExternalLink,
  Loader2,
  ImagePlus,
  Store,
  Palette,
  Check,
  X,
  Mail,
  Save,
  Plug,
  Zap,
} from 'lucide-react'
import { BrandingDrawer } from '@/components/branding-drawer'
import { NewArrivalsDrawer } from '@/components/new-arrivals-drawer'
import { GalleryDrawer } from '@/components/gallery-drawer'

export default function TenantDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [tenant, setTenant] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [fleetbaseData, setFleetbaseData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [templates, setTemplates] = useState<any[]>([])
  const [showTemplateDrawer, setShowTemplateDrawer] = useState(false)
  const [selectingTemplate, setSelectingTemplate] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [pseudoEmailDomain, setPseudoEmailDomain] = useState('phone.afruheritage.com')
  const [brandingLoading, setBrandingLoading] = useState(false)
  const [brandingSaving, setBrandingSaving] = useState(false)
  const [plugins, setPlugins] = useState<any[]>([])
  const [tenantPlugins, setTenantPlugins] = useState<any[]>([])
  const [pluginsLoading, setPluginsLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const tenants = await api.get('/admin/tenants')
      const t = (Array.isArray(tenants) ? tenants : tenants.items || []).find(
        (x: any) => x.id === id
      )
      setTenant(t || null)

      try {
        const prods = await api.get(`/admin/tenants/${id}/products`)
        setProducts(Array.isArray(prods) ? prods : [])
      } catch (e: any) {
        toast.error('Failed to load products: ' + e.message)
      }

      try {
        const drivers = await api.get(`/admin/tenants/${id}/fleetbase/drivers`)
        setFleetbaseData((prev) => ({ ...prev, drivers: drivers.drivers || [] }))
      } catch {
        // ignore
      }

      try {
        const tmpls = await api.get('/admin/templates')
        setTemplates(Array.isArray(tmpls) ? tmpls : [])
      } catch {
        // ignore
      }

      try {
        const branding = await api.get(`/admin/templates/branding/${id}`)
        if (branding.pseudo_email_domain) {
          setPseudoEmailDomain(branding.pseudo_email_domain)
        }
        if (branding.template_code) {
          setSelectedTemplate(branding.template_code)
        }
      } catch {
        // ignore
      }

      try {
        setPluginsLoading(true)
        const [allPlugins, tenantPluginData] = await Promise.all([
          api.get('/admin/plugins'),
          api.get(`/admin/tenants/${id}/plugins`)
        ])
        setPlugins(Array.isArray(allPlugins) ? allPlugins : [])
        setTenantPlugins(Array.isArray(tenantPluginData) ? tenantPluginData : [])
      } catch {
        // ignore
      } finally {
        setPluginsLoading(false)
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) load()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium">Tenant not found</h3>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/tenants')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tenants
        </Button>
      </div>
    )
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'suspended':
        return 'bg-red-100 text-red-700'
      case 'draft':
        return 'bg-gray-100 text-gray-700'
      case 'approved':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-yellow-100 text-yellow-700'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/tenants')}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{tenant.company_name || tenant.name}</h1>
            <p className="text-sm text-muted-foreground">
              {tenant.subdomain || tenant.slug} &middot; {tenant.contact_email || tenant.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusColor(tenant.status || tenant.launch_status)}>
            {tenant.status || tenant.launch_status}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`/store/${tenant.subdomain || tenant.slug}`, '_blank')}
          >
            <ExternalLink className="mr-1 h-4 w-4" /> View Storefront
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{products.length}</div>
              <div className="text-xs text-muted-foreground">Products</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{fleetbaseData.drivers?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Drivers</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{tenant.plan_code || '—'}</div>
              <div className="text-xs text-muted-foreground">Plan</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{tenant.fleetbase_org_id ? 'Yes' : 'No'}</div>
              <div className="text-xs text-muted-foreground">Fleetbase Ready</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
          <TabsTrigger value="storefront">Storefront</TabsTrigger>
          <TabsTrigger value="plugins">Plugins ({tenantPlugins.length})</TabsTrigger>
          <TabsTrigger value="fleetbase">Fleetbase</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-muted-foreground">ID:</span> {tenant.id}</div>
                <div><span className="text-muted-foreground">Slug:</span> {tenant.subdomain || tenant.slug}</div>
                <div><span className="text-muted-foreground">Contact:</span> {tenant.contact_email || tenant.email}</div>
                <div><span className="text-muted-foreground">Plan:</span> {tenant.plan_code || 'None'}</div>
                {tenant.fleetbase_org_id && (
                  <div><span className="text-muted-foreground">Fleetbase Org:</span> {tenant.fleetbase_org_id}</div>
                )}
                <div>
                  <span className="text-muted-foreground">Status:</span>{' '}
                  <Badge className={statusColor(tenant.status || tenant.launch_status)}>
                    {tenant.status || tenant.launch_status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          {products.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium">No products yet</h3>
                <p className="text-sm text-muted-foreground">This tenant hasn't added any products.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p: any) => (
                <Card key={p.id}>
                  <CardHeader className="pb-2">
                    <div className="aspect-video bg-gray-100 rounded-md overflow-hidden mb-2 flex items-center justify-center">
                      {p.images && p.images.length > 0 ? (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImagePlus className="h-8 w-8 text-gray-300" />
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      {p.is_featured && <Badge className="bg-orange-100 text-orange-700">Featured</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p className="text-gray-600 line-clamp-2">{p.short_description || p.description || 'No description'}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-semibold">GHS {p.price}</span>
                      <span className="text-xs text-muted-foreground">Stock: {p.stock_quantity}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="plugins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5 text-primary" />
                Plugin Marketplace
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pluginsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : plugins.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Plug className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No plugins available in the marketplace.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {plugins.map((plugin: any) => {
                    const isInstalled = tenantPlugins.some((tp: any) => tp.plugin_code === plugin.plugin_code)
                    return (
                      <Card key={plugin.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary" />
                                {plugin.name}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground font-mono mt-1">{plugin.plugin_code}</p>
                            </div>
                            <Badge variant={isInstalled ? 'default' : 'outline'}>
                              {isInstalled ? 'Installed' : 'Available'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground line-clamp-2">{plugin.description || 'No description'}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">v{plugin.version || '1.0.0'}</span>
                            <Button
                              size="sm"
                              variant={isInstalled ? 'outline' : 'default'}
                              onClick={async () => {
                                try {
                                  if (isInstalled) {
                                    await api.delete(`/admin/tenants/${id}/plugins/${plugin.plugin_code}`)
                                    toast.success('Plugin disabled')
                                  } else {
                                    await api.post(`/admin/tenants/${id}/plugins`, { plugin_code: plugin.plugin_code })
                                    toast.success('Plugin enabled')
                                  }
                                  load()
                                } catch (e: any) {
                                  toast.error('Failed: ' + e.message)
                                }
                              }}
                            >
                              {isInstalled ? 'Disable' : 'Enable'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storefront" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  Storefront Template
                </CardTitle>
                <Button size="sm" onClick={() => setShowTemplateDrawer(true)}>
                  <Palette className="h-4 w-4 mr-1" />
                  {selectedTemplate ? 'Change Template' : 'Select Template'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedTemplate ? (
                <div className="flex items-center gap-4">
                  {(() => {
                    const t = templates.find(t => t.template_code === selectedTemplate)
                    if (!t) return <span className="text-sm text-muted-foreground">{selectedTemplate}</span>
                    return (
                      <>
                        <div className="flex gap-1">
                          {['primary_color', 'secondary_color', 'accent_color'].map(key => (
                            <div key={key} className="h-8 w-8 rounded border" style={{ backgroundColor: t.preset?.[key] || '#ccc' }} />
                          ))}
                        </div>
                        <div>
                          <p className="font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{t.template_code}</p>
                        </div>
                      </>
                    )
                  })()}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Store className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No storefront template selected for this tenant.</p>
                  <Button className="mt-3" size="sm" onClick={() => setShowTemplateDrawer(true)}>
                    <Palette className="h-4 w-4 mr-1" /> Choose a Template
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Storefront Configuration Drawers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Storefront Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Configure your storefront appearance, content, and branding settings.
              </p>
              <div className="flex flex-wrap gap-3">
                <BrandingDrawer tenantId={id} />
                <NewArrivalsDrawer tenantId={id} />
                <GalleryDrawer tenantId={id} />
              </div>
            </CardContent>
          </Card>

          {/* Import Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Import Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pseudo-Email Domain</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Domain suffix used when generating login emails for CSV-imported members without an email address.
                  Format: <code className="bg-gray-100 px-1 rounded">phone@domain</code>
                </p>
                <input
                  type="text"
                  value={pseudoEmailDomain}
                  onChange={(e) => setPseudoEmailDomain(e.target.value)}
                  placeholder="phone.afruheritage.com"
                  className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={async () => {
                    setBrandingSaving(true)
                    try {
                      await api.patch(`/admin/templates/branding/${id}`, {
                        pseudo_email_domain: pseudoEmailDomain,
                      })
                      toast.success('Import settings saved')
                    } catch (e: any) {
                      toast.error('Failed to save: ' + e.message)
                    } finally {
                      setBrandingSaving(false)
                    }
                  }}
                  disabled={brandingSaving}
                >
                  {brandingSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Import Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {showTemplateDrawer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Select Storefront Template</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowTemplateDrawer(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {templates.map(t => (
                    <div
                      key={t.id}
                      className={`rounded-lg border p-4 cursor-pointer transition-all hover:border-primary ${selectedTemplate === t.template_code ? 'border-primary bg-primary/5' : ''}`}
                      onClick={async () => {
                        setSelectingTemplate(t.template_code)
                        try {
                          await api.post('/admin/templates/select', { template_code: t.template_code })
                          setSelectedTemplate(t.template_code)
                          setShowTemplateDrawer(false)
                          toast.success(`Template "${t.name}" applied to tenant`)
                        } catch (e: any) {
                          toast.error('Failed to select template: ' + e.message)
                        } finally {
                          setSelectingTemplate(null)
                        }}
                      }
                    >
                      <div className="aspect-video bg-gray-100 rounded-md overflow-hidden mb-3 flex items-center justify-center">
                        {t.preview_image ? (
                          <img src={t.preview_image} alt={t.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImagePlus className="h-8 w-8 text-gray-300" />
                        )}
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{t.template_code}</p>
                        </div>
                        {selectedTemplate === t.template_code && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      {t.preset && (
                        <div className="flex gap-1 mt-2">
                          {['primary_color', 'secondary_color', 'accent_color'].map(key => (
                            <div key={key} className="h-4 w-4 rounded border" style={{ backgroundColor: t.preset?.[key] || '#ccc' }} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <TabsContent value="fleetbase">
          <Card>
            <CardHeader><CardTitle>Fleetbase Preview</CardTitle></CardHeader>
            <CardContent>
              {!tenant.fleetbase_org_id ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Fleetbase not yet provisioned for this tenant.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Org ID: <code className="bg-gray-100 px-1 rounded">{tenant.fleetbase_org_id}</code>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{fleetbaseData.drivers?.length || 0}</div>
                        <div className="text-xs text-muted-foreground">Drivers</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
