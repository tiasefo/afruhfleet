'use client'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { useState, useEffect } from "react"
import Image from "next/image"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { 
  X, ArrowUpRight, Store, Maximize2, Check, 
  AlertTriangle, Loader2, Info, Palette, Layout,
  Zap, Shield, RefreshCw 
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

interface Template {
  id: string
  template_code: string
  name: string
  description: string
  preset: any
  is_active: boolean
}

export default function TemplatesPage() {
  const [mounted, setMounted] = useState(false)
  const { user, token } = useAuth()
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [installing, setInstalling] = useState(false)
  const [installDialogOpen, setInstallDialogOpen] = useState(false)
  const [consent, setConsent] = useState({
    ui_change: false,
    business_type_change: false,
    data_impact: false,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && token) loadTemplates()
  }, [token, mounted])

  const loadTemplates = async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const data = await api.get('/storefront-templates')
      setTemplates(Array.isArray(data) ? data.filter(t => t.preset) : [])
    } catch (err: any) {
      toast.error('Failed to load templates: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template)
  }

  const handleSelect = (template: Template) => {
    setSelectedTemplate(template)
    setConsent({ ui_change: false, business_type_change: false, data_impact: false })
    setInstallDialogOpen(true)
  }

  const handleInstall = async () => {
    if (!selectedTemplate) return
    
    setInstalling(true)
    try {
      const result = await api.post('/storefront-templates/select', {
        template_code: selectedTemplate.template_code,
      })
      
      if (result.status === 'success') {
        toast.success(`Template "${selectedTemplate.name}" activated successfully`)
        setInstallDialogOpen(false)
        await loadTemplates()
      } else {
        toast.warning('Template activation attempted: ' + (result.message || 'Unknown error'))
      }
    } catch (err: any) {
      toast.error('Template activation failed: ' + err.message)
    } finally {
      setInstalling(false)
    }
  }

  const canInstall = consent.ui_change && consent.business_type_change && consent.data_impact

  const getTemplateImage = (template: Template) => {
    return template.preset?.image || `/images/${template.template_code}-hero.png`
  }

  const getSwatches = (template: Template) => {
    if (!template.preset) {
      return ["#0078D4", "#323130", "#00BCF2"]
    }
    return template.preset.swatches || [
      template.preset.primary_color || "#0078D4",
      template.preset.secondary_color || "#323130",
      template.preset.accent_color || "#00BCF2",
    ]
  }

  const getTags = (template: Template) => {
    return template.preset?.tags || ["Theme", "Branding"]
  }

  const getFeatures = (template: Template) => {
    return template.preset?.features || []
  }

  if (!mounted) {
    return <div className="p-8">Loading templates...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                Storefront Templates
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Browse, preview, and select templates for your storefront
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <strong>WordPress-Style Template System:</strong> Browse available templates, 
                  preview them in detail, and activate with one click. Template changes may affect 
                  your storefront appearance, business type classification, and data. You'll be asked 
                  to provide explicit consent before activation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : templates.length === 0 ? (
          <div className="flex justify-center py-12">
            <p className="text-slate-600 dark:text-slate-400">No templates available</p>
          </div>
        ) : (
          /* Template Grid */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <Image
                    src={getTemplateImage(template)}
                    alt={`${template.name} storefront preview`}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex gap-1.5">
                    {getSwatches(template).map((color: string) => (
                      <span 
                        key={color} 
                        className="size-4 rounded-full border border-white/50" 
                        style={{ backgroundColor: color }} 
                      />
                    ))}
                  </div>
                  {template.is_active && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      <Check className="h-3 w-3" />
                      Active
                    </div>
                  )}
                  <button
                    onClick={() => handlePreview(template)}
                    className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-lg bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 hover:opacity-100"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Features */}
                  {template.preset && getFeatures(template).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Features
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {getFeatures(template).slice(0, 4).map((feature: string) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            {feature}
                          </Badge>
                        ))}
                        {getFeatures(template).length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{getFeatures(template).length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {template.preset && (
                    <div className="flex flex-wrap gap-1">
                      {getTags(template).map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handlePreview(template)}
                  >
                    <Layout className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleSelect(template)}
                    disabled={template.is_active}
                  >
                    {template.is_active ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Active
                      </>
                    ) : (
                      <>
                        <Palette className="h-4 w-4 mr-2" />
                        Activate
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {previewTemplate && (
          <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Layout className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{previewTemplate.name}</DialogTitle>
                    <DialogDescription className="text-sm">
                      Template preview and details
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Template Image */}
                <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Image
                    src={getTemplateImage(previewTemplate)}
                    alt={`${previewTemplate.name} preview`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* Template Details */}
                {previewTemplate.preset ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Color Scheme
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Primary</span>
                          <div className="flex items-center gap-2">
                            <span 
                              className="size-6 rounded border border-slate-300" 
                              style={{ backgroundColor: previewTemplate.preset?.primary_color }} 
                            />
                            <span className="text-xs font-mono">{previewTemplate.preset?.primary_color}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Secondary</span>
                          <div className="flex items-center gap-2">
                            <span 
                              className="size-6 rounded border border-slate-300" 
                              style={{ backgroundColor: previewTemplate.preset?.secondary_color }} 
                            />
                            <span className="text-xs font-mono">{previewTemplate.preset?.secondary_color}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Accent</span>
                          <div className="flex items-center gap-2">
                            <span 
                              className="size-6 rounded border border-slate-300" 
                              style={{ backgroundColor: previewTemplate.preset?.accent_color }} 
                            />
                            <span className="text-xs font-mono">{previewTemplate.preset?.accent_color}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Features
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {getFeatures(previewTemplate).map((feature: string) => (
                          <Badge key={feature} variant="secondary" className="text-sm">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">No template details available</p>
                  </div>
                )}

                {/* Required Endpoints */}
                {previewTemplate.preset?.required_endpoints && (
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Required Endpoints
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {previewTemplate.preset.required_endpoints.slice(0, 5).map((ep: string) => (
                        <Badge key={ep} variant="outline" className="text-xs font-mono">
                          {ep}
                        </Badge>
                      ))}
                      {previewTemplate.preset.required_endpoints.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{previewTemplate.preset.required_endpoints.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPreviewTemplate(null)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setPreviewTemplate(null)
                    handleSelect(previewTemplate)
                  }}
                  disabled={previewTemplate.is_active}
                >
                  {previewTemplate.is_active ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Currently Active
                    </>
                  ) : (
                    <>
                      <Palette className="h-4 w-4 mr-2" />
                      Activate Template
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Installation Consent Dialog */}
        <Dialog open={installDialogOpen} onOpenChange={setInstallDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Activate Template: {selectedTemplate?.name}</DialogTitle>
                  <DialogDescription className="text-sm">
                    Please review and accept the following before activation
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Template Details */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <h4 className="font-medium mb-2">Template Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Template:</span>
                    <span className="font-mono">{selectedTemplate?.template_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Features:</span>
                    <span>{getFeatures(selectedTemplate!).length} enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Endpoints:</span>
                    <span>{selectedTemplate?.preset?.required_endpoints?.length || 0} required</span>
                  </div>
                </div>
              </div>

              {/* Consent Checkboxes */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Required Consents
                </h4>
                
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Switch
                      checked={consent.ui_change}
                      onCheckedChange={(checked) => setConsent(prev => ({ ...prev, ui_change: checked }))}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">UI Changes</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        I understand this template may change my storefront appearance and layout
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Switch
                      checked={consent.business_type_change}
                      onCheckedChange={(checked) => setConsent(prev => ({ ...prev, business_type_change: checked }))}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Business Type Changes</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        I understand this template may change my industry or business type classification
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Switch
                      checked={consent.data_impact}
                      onCheckedChange={(checked) => setConsent(prev => ({ ...prev, data_impact: checked }))}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Data Impact</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        I understand this template may modify or replace existing data in my system
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Legal Notice */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Legal Notice:</strong> Your consent will be logged for compliance purposes. 
                  By clicking "Activate Template", you agree to these terms and authorize the template activation.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setInstallDialogOpen(false)}
                disabled={installing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleInstall}
                disabled={!canInstall || installing}
                className="bg-primary text-primary-foreground"
              >
                {installing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Palette className="h-4 w-4 mr-2" />
                    Activate Template
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
