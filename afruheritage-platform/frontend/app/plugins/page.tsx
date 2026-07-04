'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Puzzle,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Shield,
  Zap,
  Info,
  ExternalLink,
  X,
} from 'lucide-react'

interface Plugin {
  name: string
  feature_name: string
  description: string
  required_endpoints: string[]
  feature_flags: string[]
  risks?: {
    ui_change: string
    business_type_change: string
    data_impact: string
  }
}

interface PluginDetail extends Plugin {
  installed?: boolean
  healthy?: boolean
}

export default function PluginCatalogPage() {
  const { user, token } = useAuth()
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null)
  const [installDialogOpen, setInstallDialogOpen] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [consent, setConsent] = useState({
    ui_change: false,
    business_type_change: false,
    data_impact: false,
  })
  const [acknowledgedRisks, setAcknowledgedRisks] = useState<string[]>([])

  const loadPlugins = async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await api.get('/plugins/catalog')
      setPlugins(Array.isArray(data) ? data : [])
    } catch (err: any) {
      toast.error('Failed to load plugins: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlugins()
  }, [token])

  const handleInstallClick = (plugin: Plugin) => {
    setSelectedPlugin(plugin)
    setConsent({ ui_change: false, business_type_change: false, data_impact: false })
    setAcknowledgedRisks([])
    setInstallDialogOpen(true)
  }

  const handleRiskToggle = (risk: string) => {
    setAcknowledgedRisks(prev =>
      prev.includes(risk)
        ? prev.filter(r => r !== risk)
        : [...prev, risk]
    )
  }

  const handleInstall = async () => {
    if (!selectedPlugin) return
    
    setInstalling(true)
    try {
      const result = await api.post('/plugins/install', {
        plugin_name: selectedPlugin.name,
        consent_ui_change: consent.ui_change,
        consent_business_type_change: consent.business_type_change,
        consent_data_impact: consent.data_impact,
        acknowledged_risks: acknowledgedRisks,
      })
      
      if (result.success) {
        toast.success(`Plugin installed successfully: ${result.message}`)
        setInstallDialogOpen(false)
        await loadPlugins()
      } else {
        toast.warning(`Installation attempted: ${result.message}`)
      }
    } catch (err: any) {
      toast.error('Installation failed: ' + err.message)
    } finally {
      setInstalling(false)
    }
  }

  const canInstall = consent.ui_change && consent.business_type_change && consent.data_impact

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Puzzle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                Plugin Catalog
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Browse and install plugins to enhance your storefront
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
                  <strong>Important:</strong> Installing plugins may change your storefront appearance, 
                  business type classification, or modify existing data. You will be asked to provide 
                  explicit consent before installation. All changes are logged for compliance purposes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          /* Plugin Grid */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plugins.map((plugin) => (
              <Card key={plugin.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Puzzle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{plugin.feature_name}</CardTitle>
                        <p className="text-xs text-slate-500 font-mono mt-1">{plugin.name}</p>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-sm mt-2">
                    {plugin.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Required Endpoints */}
                  {plugin.required_endpoints && plugin.required_endpoints.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Required Endpoints
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {plugin.required_endpoints.slice(0, 3).map((ep: string) => (
                          <Badge key={ep} variant="outline" className="text-xs">
                            {ep}
                          </Badge>
                        ))}
                        {plugin.required_endpoints.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{plugin.required_endpoints.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Feature Flags */}
                  {plugin.feature_flags && plugin.feature_flags.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Features
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {plugin.feature_flags.map((flag: string) => (
                          <Badge key={flag} variant="secondary" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risks Warning */}
                  {plugin.risks && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <div className="text-xs text-amber-800 dark:text-amber-200">
                          <p className="font-medium mb-1">Installation may:</p>
                          <ul className="space-y-1">
                            <li>• {plugin.risks.ui_change}</li>
                            <li>• {plugin.risks.business_type_change}</li>
                            <li>• {plugin.risks.data_impact}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleInstallClick(plugin)}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Install Plugin
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
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
                  <DialogTitle className="text-xl">Install Plugin: {selectedPlugin?.feature_name}</DialogTitle>
                  <DialogDescription className="text-sm">
                    Please review and accept the following before installation
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Plugin Details */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <h4 className="font-medium mb-2">Plugin Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Name:</span>
                    <span className="font-mono">{selectedPlugin?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Features:</span>
                    <span>{selectedPlugin?.feature_flags.length} enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Endpoints:</span>
                    <span>{selectedPlugin?.required_endpoints.length} required</span>
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
                        I understand this plugin may change my storefront appearance and layout
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
                        I understand this plugin may change my industry or business type classification
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
                        I understand this plugin may modify or replace existing data in my system
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Risk Acknowledgment */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Risk Acknowledgment
                </h4>
                <div className="space-y-2">
                  {['UI change', 'Business type change', 'Data impact'].map((risk) => (
                    <label key={risk} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acknowledgedRisks.includes(risk)}
                        onChange={() => handleRiskToggle(risk)}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm">I acknowledge and accept: {risk}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Legal Notice */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Legal Notice:</strong> Your consent and acknowledgments will be logged for compliance 
                  purposes. By clicking "Install", you agree to these terms and authorize the plugin installation.
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
                    Installing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Install Plugin
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
