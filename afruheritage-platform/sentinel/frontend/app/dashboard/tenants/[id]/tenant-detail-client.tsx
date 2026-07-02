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
} from 'lucide-react'

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

  const load = async () => {
    setLoading(true)
    try {
      const tenants = await api.get('/sentinel/tenants')
      const t = (Array.isArray(tenants) ? tenants : tenants.items || []).find(
        (x: any) => x.id === id
      )
      setTenant(t || null)

      try {
        const prods = await api.get(`/sentinel/tenants/${id}/products`)
        setProducts(Array.isArray(prods) ? prods : [])
      } catch (e: any) {
        toast.error('Failed to load products: ' + e.message)
      }

      try {
        const drivers = await api.get(`/sentinel/tenants/${id}/fleetbase/drivers`)
        setFleetbaseData((prev) => ({ ...prev, drivers: drivers.drivers || [] }))
      } catch {
        // ignore
      }

      try {
        const tmpls = await api.get('/sentinel/templates')
        setTemplates(Array.isArray(tmpls) ? tmpls : [])
      } catch {
        // ignore
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
                          await api.post('/sentinel/templates/select', { template_code: t.template_code })
                          setSelectedTemplate(t.template_code)
                          setShowTemplateDrawer(false)
                          toast.success(`Template "${t.name}" applied to tenant`)
                        } catch (e: any) {
                          toast.error('Failed to select template: ' + e.message)
                        } finally {
                          setSelectingTemplate(null)
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{t.name}</span>
                        {selectedTemplate === t.template_code && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      {t.description && (
                        <p className="text-xs text-muted-foreground mb-2">{t.description}</p>
                      )}
                      <div className="flex gap-1">
                        {['primary_color', 'secondary_color', 'accent_color', 'background_color'].map(key => (
                          <div key={key} className="h-6 w-6 rounded border" style={{ backgroundColor: t.preset?.[key] || '#ccc' }} />
                        ))}
                      </div>
                      {selectingTemplate === t.template_code && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                          <Loader2 className="h-3 w-3 animate-spin" /> Applying...
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
