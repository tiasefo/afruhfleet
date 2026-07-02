'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useBranding } from '@/hooks/useBranding'
import { brandingAPI, productsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BackButton } from '@/components/back-button'
import {
  Loader2,
  Eye,
  Save,
  ArrowUp,
  ArrowDown,
  ImagePlus,
  ShoppingBag,
  Type,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Check,
  AlertCircle,
} from 'lucide-react'

interface StoreSection {
  id: string
  type: 'hero' | 'featured_products' | 'about' | 'contact'
  enabled: boolean
  title?: string
  subtitle?: string
  body?: string
}

interface StorefrontConfig {
  sections: StoreSection[]
  hero_image_url?: string
  featured_product_ids: string[]
}

const DEFAULT_CONFIG: StorefrontConfig = {
  sections: [
    { id: 'hero', type: 'hero', enabled: true, title: 'Welcome to Our Store', subtitle: 'Quality freight services delivered with care' },
    { id: 'featured', type: 'featured_products', enabled: true, title: 'Featured Services' },
    { id: 'about', type: 'about', enabled: true, title: 'About Us', body: 'We provide reliable freight forwarding services across Africa and beyond.' },
    { id: 'contact', type: 'contact', enabled: true, title: 'Contact Us' },
  ],
  featured_product_ids: [],
}

export default function StorefrontBuilderPage() {
  const { user, token } = useAuth()
  const { branding } = useBranding()
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [config, setConfig] = useState<StorefrontConfig>(DEFAULT_CONFIG)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [heroImage, setHeroImage] = useState<string>('')

  const load = async () => {
    setIsLoading(true)
    try {
      const [prodData, brandData] = await Promise.all([
        productsApi.list(),
        brandingAPI.get(),
      ])
      setProducts(Array.isArray(prodData) ? prodData : [])
      const savedConfig = brandData?.storefront_config
      if (savedConfig) {
        setConfig({
          ...DEFAULT_CONFIG,
          ...savedConfig,
          sections: savedConfig.sections || DEFAULT_CONFIG.sections,
        })
        setHeroImage(savedConfig.hero_image_url || '')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (token) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const payload = {
        ...config,
        hero_image_url: heroImage || undefined,
      }
      await brandingAPI.update({ storefront_config: payload })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (e: any) {
      console.error('Failed to save storefront config:', e)
    } finally {
      setIsSaving(false)
    }
  }

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const sections = [...config.sections]
    if (direction === 'up' && index > 0) {
      ;[sections[index - 1], sections[index]] = [sections[index], sections[index - 1]]
    } else if (direction === 'down' && index < sections.length - 1) {
      ;[sections[index + 1], sections[index]] = [sections[index], sections[index + 1]]
    }
    setConfig({ ...config, sections })
  }

  const toggleSection = (id: string) => {
    setConfig({
      ...config,
      sections: config.sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    })
  }

  const updateSection = (id: string, updates: Partial<StoreSection>) => {
    setConfig({
      ...config,
      sections: config.sections.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })
  }

  const toggleFeaturedProduct = (productId: string) => {
    const ids = config.featured_product_ids.includes(productId)
      ? config.featured_product_ids.filter((id) => id !== productId)
      : [...config.featured_product_ids, productId]
    setConfig({ ...config, featured_product_ids: ids })
  }

  const subdomain = typeof window !== 'undefined' ? localStorage.getItem('tenant_subdomain') : null
  const publicStoreUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/store/${subdomain || ''}`
    : ''

  if (isLoading) {
    return (
    <>
      <BackButton />
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      </>
    )
  }

  const featuredProducts = products.filter((p) => config.featured_product_ids.includes(p.id))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Storefront Builder</h1>
              <p className="mt-2 text-sm text-gray-600">
                Customize your public store layout, content, and featured products
              </p>
            </div>
            <div className="flex gap-3">
              {publicStoreUrl && (
                <Button variant="outline" asChild>
                  <a href={publicStoreUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Live Store
                  </a>
                </Button>
              )}
              <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saveSuccess ? 'Saved!' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Editor Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sections */}
            <Card>
              <CardHeader>
                <CardTitle>Page Sections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.sections.map((section, index) => (
                  <div key={section.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={section.enabled}
                          onCheckedChange={() => toggleSection(section.id)}
                        />
                        <span className="font-medium capitalize">{section.type.replace('_', ' ')}</span>
                        {section.enabled && <Badge variant="secondary">Visible</Badge>}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveSection(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveSection(index, 'down')}
                          disabled={index === config.sections.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {section.enabled && (
                      <div className="space-y-3 pt-2 border-t">
                        <div>
                          <label className="text-sm font-medium">Section Title</label>
                          <Input
                            value={section.title || ''}
                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                            placeholder="Enter section title"
                          />
                        </div>
                        {(section.type === 'hero' || section.type === 'about') && (
                          <div>
                            <label className="text-sm font-medium">
                              {section.type === 'hero' ? 'Subtitle / Tagline' : 'Body Text'}
                            </label>
                            <Textarea
                              value={section.subtitle || section.body || ''}
                              onChange={(e) =>
                                updateSection(section.id, {
                                  [section.type === 'hero' ? 'subtitle' : 'body']: e.target.value,
                                })
                              }
                              placeholder={section.type === 'hero' ? 'Enter tagline' : 'Enter description'}
                              rows={3}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Hero Image */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImagePlus className="w-5 h-5" />
                  Hero Banner Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Input
                    value={heroImage}
                    onChange={(e) => setHeroImage(e.target.value)}
                    placeholder="Paste image URL or upload via Settings > Logo"
                  />
                  {heroImage && (
                    <div className="relative rounded-lg overflow-hidden border aspect-video bg-gray-100">
                      <img
                        src={heroImage}
                        alt="Hero preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Featured Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Featured Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Select up to 6 products to display in the Featured Services section.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => toggleFeaturedProduct(product.id)}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        config.featured_product_ids.includes(product.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-sm text-gray-600">
                            {product.currency || 'GHS'} {product.price}
                          </p>
                        </div>
                        {config.featured_product_ids.includes(product.id) && (
                          <Check className="w-5 h-5 text-primary shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {products.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                    <p>No products yet. Go to Products to create some.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Live Preview Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.sections
                  .filter((s) => s.enabled)
                  .map((section) => (
                    <div key={section.id} className="border rounded-lg p-3">
                      <p className="text-xs font-semibold uppercase text-gray-500 mb-1">
                        {section.type.replace('_', ' ')}
                      </p>
                      {section.type === 'hero' && (
                        <div>
                          {heroImage && (
                            <div className="aspect-video rounded bg-gray-100 mb-2 overflow-hidden">
                              <img
                                src={heroImage}
                                alt="Hero"
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            </div>
                          )}
                          <p className="font-bold text-sm">{section.title}</p>
                          <p className="text-sm text-gray-600">{section.subtitle}</p>
                        </div>
                      )}
                      {section.type === 'featured_products' && (
                        <div className="space-y-2">
                          <p className="font-medium text-sm">{section.title}</p>
                          {featuredProducts.length > 0 ? (
                            <div className="space-y-2">
                              {featuredProducts.slice(0, 3).map((p) => (
                                <div key={p.id} className="flex items-center gap-2 text-xs bg-gray-50 rounded p-2">
                                  <ShoppingBag className="w-3 h-3 text-gray-400" />
                                  <span className="truncate">{p.name}</span>
                                  <span className="shrink-0 ml-auto">{p.currency || 'GHS'} {p.price}</span>
                                </div>
                              ))}
                              {featuredProducts.length > 3 && (
                                <p className="text-xs text-gray-500 text-center">
                                  +{featuredProducts.length - 3} more
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">No featured products selected</p>
                          )}
                        </div>
                      )}
                      {section.type === 'about' && (
                        <div>
                          <p className="font-medium text-sm">{section.title}</p>
                          <p className="text-xs text-gray-600 line-clamp-3">{section.body}</p>
                        </div>
                      )}
                      {section.type === 'contact' && (
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{section.title}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Mail className="w-3 h-3" />
                            {branding?.support_email || 'support@example.com'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Phone className="w-3 h-3" />
                            {branding?.support_phone || '+233 30 123 4567'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <MapPin className="w-3 h-3" />
                            Accra, Ghana
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Full Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Storefront Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-0">
            {config.sections
              .filter((s) => s.enabled)
              .map((section) => (
                <div key={section.id}>
                  {section.type === 'hero' && (
                    <div className="relative bg-gradient-to-r from-primary/10 to-accent/10 py-16 px-8 text-center">
                      {heroImage && (
                        <div className="absolute inset-0 overflow-hidden">
                          <img
                            src={heroImage}
                            alt=""
                            className="w-full h-full object-cover opacity-30"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        </div>
                      )}
                      <div className="relative">
                        <h1 className="text-3xl font-bold" style={{ color: branding?.primary_color }}>
                          {section.title}
                        </h1>
                        <p className="mt-3 text-lg text-gray-600">{section.subtitle}</p>
                      </div>
                    </div>
                  )}
                  {section.type === 'featured_products' && (
                    <div className="py-12 px-8 bg-white">
                      <h2 className="text-2xl font-bold text-center mb-8">{section.title}</h2>
                      {featuredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {featuredProducts.map((p) => (
                            <div key={p.id} className="border rounded-lg overflow-hidden">
                              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                                {p.images?.[0] ? (
                                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  <ShoppingBag className="w-8 h-8 text-gray-400" />
                                )}
                              </div>
                              <div className="p-4">
                                <h3 className="font-medium">{p.name}</h3>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{p.short_description || p.description}</p>
                                <p className="text-lg font-bold mt-2" style={{ color: branding?.primary_color }}>
                                  {p.currency || 'GHS'} {p.price}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500">No featured products selected</p>
                      )}
                    </div>
                  )}
                  {section.type === 'about' && (
                    <div className="py-12 px-8 bg-gray-50">
                      <h2 className="text-2xl font-bold text-center mb-4">{section.title}</h2>
                      <p className="text-gray-600 max-w-2xl mx-auto text-center">{section.body}</p>
                    </div>
                  )}
                  {section.type === 'contact' && (
                    <div className="py-12 px-8 bg-white">
                      <h2 className="text-2xl font-bold text-center mb-8">{section.title}</h2>
                      <div className="max-w-md mx-auto space-y-4">
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                          <Mail className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">{branding?.support_email || 'support@example.com'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                          <Phone className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-medium">{branding?.support_phone || '+233 30 123 4567'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                          <MapPin className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="font-medium">Accra, Ghana</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
