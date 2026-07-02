'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useBranding } from '@/hooks/useBranding'
import { useTranslation } from '@/hooks/useTranslation'
import { brandingAPI, domainsAPI, templatesApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BackButton } from '@/components/back-button'
import { 
  Settings, 
  Palette, 
  Globe, 
  Save, 
  Upload,
  Eye,
  Loader2,
  Link2,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  Store,
  Check,
  X,
  Mail,
} from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const { branding, refreshBranding } = useBranding()
  const { t, lang, setLang } = useTranslation()
  
  const [formData, setFormData] = useState({
    company_name: '',
    logo_url: '',
    favicon_url: '',
    primary_color: '',
    secondary_color: '',
    accent_color: '',
    background_color: '',
    default_currency: '',
    default_language: 'en',
    support_email: '',
    support_phone: '',
    legal_footer_text: '',
    legal_company_name: '',
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState('')

  // Custom domain state
  const [customDomains, setCustomDomains] = useState<any[]>([])
  const [domainSettings, setDomainSettings] = useState<any>(null)
  const [newHostname, setNewHostname] = useState('')
  const [domainLoading, setDomainLoading] = useState(false)
  const [domainError, setDomainError] = useState('')
  const [domainSuccess, setDomainSuccess] = useState('')
  const [refreshingId, setRefreshingId] = useState<string | null>(null)
  const [copiedText, setCopiedText] = useState('')

  // Storefront templates state
  const [templates, setTemplates] = useState<any[]>([])
  const [showTemplateDrawer, setShowTemplateDrawer] = useState(false)
  const [selectingTemplate, setSelectingTemplate] = useState<string | null>(null)
  const [currentTemplateCode, setCurrentTemplateCode] = useState<string | null>(null)

  // Import settings state
  const [pseudoEmailDomain, setPseudoEmailDomain] = useState('phone.afruheritage.com')
  const [importSaving, setImportSaving] = useState(false)
  const [importSaved, setImportSaved] = useState(false)

  const isAdmin = user?.role === 'company_admin' || user?.is_tenant_admin

  const loadDomains = useCallback(async () => {
    if (!user?.tenant_id) return
    try {
      const [domains, settings] = await Promise.all([
        domainsAPI.list(user.tenant_id),
        domainsAPI.settings(user.tenant_id),
      ])
      setCustomDomains(Array.isArray(domains) ? domains : [])
      setDomainSettings(settings)
    } catch {
      // Non-critical — domain section just stays empty
    }
  }, [user?.tenant_id])

  const handleRequestDomain = async () => {
    if (!newHostname.trim() || !user?.tenant_id) return
    const hostname = newHostname.trim().toLowerCase()
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z]{2,})+$/.test(hostname)) {
      setDomainError('Enter a valid domain (e.g. portal.yourcompany.com)')
      return
    }
    setDomainLoading(true)
    setDomainError('')
    setDomainSuccess('')
    try {
      const domain = await domainsAPI.request(user.tenant_id, hostname, user.email)
      setCustomDomains(prev => [domain, ...prev.filter((d: any) => d.hostname !== hostname)])
      setNewHostname('')
      setDomainSuccess(`Domain ${hostname} requested. Add the DNS record below to verify.`)
    } catch (err: any) {
      setDomainError(err?.message || 'Failed to request domain')
    } finally {
      setDomainLoading(false)
    }
  }

  const handleRefreshStatus = async (domainId: string) => {
    setRefreshingId(domainId)
    try {
      const updated = await domainsAPI.refreshStatus(domainId)
      setCustomDomains(prev => prev.map((d: any) => d.id === domainId ? updated : d))
    } catch {
      // Silently fail — user can try again
    } finally {
      setRefreshingId(null)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label)
      setTimeout(() => setCopiedText(''), 2000)
    } catch {
      // Clipboard API may not be available on non-HTTPS
    }
  }

  const domainStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const domainStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      requested: 'Requested',
      pending_verification: 'Pending DNS Verification',
      pending_ssl: 'Pending SSL',
      active: 'Active',
      failed: 'Failed',
    }
    return map[status] ?? status
  }


  // Load current branding
  useEffect(() => {
    if (branding) {
      setFormData({
        company_name: branding.company_name || '',
        logo_url: branding.logo_url || '',
        favicon_url: branding.favicon_url || '',
        primary_color: branding.primary_color || '#0ea5e9',
        secondary_color: branding.secondary_color || '#64748b',
        accent_color: branding.accent_color || '#f59e0b',
        background_color: branding.background_color || '#ffffff',
        default_currency: branding.default_currency || 'GHS',
        default_language: branding.default_language || 'en',
        support_email: branding.support_email || '',
        support_phone: branding.support_phone || '',
        legal_footer_text: branding.legal_footer_text || '',
        legal_company_name: branding.legal_company_name || '',
      })
      setLogoPreview(branding.logo_url || '')
      if (branding.pseudo_email_domain) {
        setPseudoEmailDomain(branding.pseudo_email_domain)
      }
      if (branding.template_code) {
        setCurrentTemplateCode(branding.template_code)
      }
    }
  }, [branding])

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const tmpls = await templatesApi.list()
        setTemplates(Array.isArray(tmpls) ? tmpls : [])
      } catch {
        // ignore
      }
    }
    loadTemplates()
  }, [])

  // Load domains when user is available
  useEffect(() => {
    if (user?.tenant_id) {
      loadDomains()
    }
  }, [user?.tenant_id, loadDomains])


  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await brandingAPI.update(formData)
      await refreshBranding()
    } catch (error) {
      console.error('Failed to save branding:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
        setFormData(prev => ({
          ...prev,
          logo_url: reader.result as string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSelectTemplate = async (templateCode: string) => {
    setSelectingTemplate(templateCode)
    try {
      await templatesApi.select(templateCode)
      setCurrentTemplateCode(templateCode)
      setShowTemplateDrawer(false)
      await refreshBranding()
    } catch (error) {
      console.error('Failed to select template:', error)
    } finally {
      setSelectingTemplate(null)
    }
  }

  const handleSaveImportSettings = async () => {
    setImportSaving(true)
    setImportSaved(false)
    try {
      await brandingAPI.update({ pseudo_email_domain: pseudoEmailDomain })
      await refreshBranding()
      setImportSaved(true)
      setTimeout(() => setImportSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save import settings:', error)
    } finally {
      setImportSaving(false)
    }
  }

  if (isLoading) {
    return (
    <>
      <BackButton />
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="mt-2 text-sm text-gray-600">Customize your tenant branding and preferences</p>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Company Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Legal Company Name</label>
                  <Input
                    value={formData.legal_company_name}
                    onChange={(e) => handleInputChange('legal_company_name', e.target.value)}
                    placeholder="Enter legal company name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                  <Input
                    type="email"
                    value={formData.support_email}
                    onChange={(e) => handleInputChange('support_email', e.target.value)}
                    placeholder="support@company.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Support Phone</label>
                  <Input
                    value={formData.support_phone}
                    onChange={(e) => handleInputChange('support_phone', e.target.value)}
                    placeholder="+233 30 123 4567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Legal Footer Text</label>
                  <Textarea
                    value={formData.legal_footer_text}
                    onChange={(e) => handleInputChange('legal_footer_text', e.target.value)}
                    placeholder="© 2024 Company Name. All rights reserved."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Branding Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Branding Colors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                    <div className="flex space-x-2">
                      <Input
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.primary_color}
                        onChange={(e) => handleInputChange('primary_color', e.target.value)}
                        placeholder="#0ea5e9"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                    <div className="flex space-x-2">
                      <Input
                        type="color"
                        value={formData.secondary_color}
                        onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.secondary_color}
                        onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                        placeholder="#64748b"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                    <div className="flex space-x-2">
                      <Input
                        type="color"
                        value={formData.accent_color}
                        onChange={(e) => handleInputChange('accent_color', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.accent_color}
                        onChange={(e) => handleInputChange('accent_color', e.target.value)}
                        placeholder="#f59e0b"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                    <div className="flex space-x-2">
                      <Input
                        type="color"
                        value={formData.background_color}
                        onChange={(e) => handleInputChange('background_color', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={formData.background_color}
                        onChange={(e) => handleInputChange('background_color', e.target.value)}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Localization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Localization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Language</label>
                    <Select value={formData.default_language} onValueChange={(value) => handleInputChange('default_language', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="zh">中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
                    <Select value={formData.default_currency} onValueChange={(value) => handleInputChange('default_currency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GHS">GHS</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Domain — visible to company_admin / tenant admins only */}
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Link2 className="w-5 h-5 mr-2" />
                    Custom Domain
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Platform subdomain info */}
                  {domainSettings?.platform_subdomain && (
                    <div className="bg-blue-50 rounded-lg p-3 text-sm">
                      <p className="font-medium text-blue-800 mb-1">Your platform address</p>
                      <div className="flex items-center gap-2">
                        <code className="text-blue-700">{domainSettings.platform_subdomain}</code>
                        <a
                          href={`https://${domainSettings.platform_subdomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Existing custom domains */}
                  {customDomains.filter((d: any) => d.domain_type !== 'provider_subdomain').length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700">Custom domains</p>
                      {customDomains
                        .filter((d: any) => d.domain_type !== 'provider_subdomain')
                        .map((domain: any) => (
                          <div key={domain.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {domainStatusIcon(domain.status)}
                                <span className="font-mono text-sm">{domain.hostname}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  domain.status === 'active'
                                    ? 'bg-green-100 text-green-700'
                                    : domain.status === 'failed'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {domainStatusLabel(domain.status)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRefreshStatus(domain.id)}
                                  disabled={refreshingId === domain.id}
                                  title="Refresh verification status"
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${refreshingId === domain.id ? 'animate-spin' : ''}`} />
                                </Button>
                              </div>
                            </div>

                            {/* Show CNAME + TXT records when pending */}
                            {domain.status !== 'active' && (
                              <div className="bg-gray-50 rounded p-3 text-xs space-y-2">
                                <p className="font-medium text-gray-700">Add a CNAME record in your DNS provider:</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-gray-500 mb-0.5">Name</p>
                                    <div className="flex items-center gap-1 bg-white border rounded px-2 py-1">
                                      <code className="flex-1 truncate">{domain.hostname}</code>
                                      <button onClick={() => copyToClipboard(domain.hostname, 'name')} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </div>
                                    {copiedText === 'name' && <p className="text-green-600 text-xs mt-0.5">Copied!</p>}
                                  </div>
                                  <div>
                                    <p className="text-gray-500 mb-0.5">Points to</p>
                                    <div className="flex items-center gap-1 bg-white border rounded px-2 py-1">
                                      <code className="flex-1 truncate">{domain.fallback_hostname || 'afruheritage.com'}</code>
                                      <button onClick={() => copyToClipboard(domain.fallback_hostname || 'afruheritage.com', 'value')} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </div>
                                    {copiedText === 'value' && <p className="text-green-600 text-xs mt-0.5">Copied!</p>}
                                  </div>
                                </div>
                                {domain.verification_name && (
                                  <div className="mt-2 pt-2 border-t">
                                    <p className="font-medium text-gray-700 mb-1">Also add this TXT record for SSL:</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <p className="text-gray-500 mb-0.5">TXT Name</p>
                                        <div className="flex items-center gap-1 bg-white border rounded px-2 py-1">
                                          <code className="flex-1 truncate">{domain.verification_name}</code>
                                          <button onClick={() => copyToClipboard(domain.verification_name, 'txt-name')} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                                            <Copy className="w-3 h-3" />
                                          </button>
                                        </div>
                                        {copiedText === 'txt-name' && <p className="text-green-600 text-xs mt-0.5">Copied!</p>}
                                      </div>
                                      <div>
                                        <p className="text-gray-500 mb-0.5">TXT Value</p>
                                        <div className="flex items-center gap-1 bg-white border rounded px-2 py-1">
                                          <code className="flex-1 truncate">{domain.verification_value}</code>
                                          <button onClick={() => copyToClipboard(domain.verification_value, 'txt-value')} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                                            <Copy className="w-3 h-3" />
                                          </button>
                                        </div>
                                        {copiedText === 'txt-value' && <p className="text-green-600 text-xs mt-0.5">Copied!</p>}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <p className="text-gray-500 pt-1">DNS changes can take up to 48 hours to propagate. Use the refresh button to check status.</p>
                              </div>
                            )}
                            {domain.last_error && (
                              <p className="text-xs text-red-600 bg-red-50 rounded p-2">{domain.last_error}</p>
                            )}
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Request new domain */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Request a custom domain
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Use your own domain (e.g. <code>portal.mycompany.com</code>). You will add a CNAME record pointing to this platform and a TXT record for SSL verification.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={newHostname}
                        onChange={(e) => setNewHostname(e.target.value)}
                        placeholder="portal.yourcompany.com"
                        className="flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && handleRequestDomain()}
                      />
                      <Button onClick={handleRequestDomain} disabled={domainLoading || !newHostname.trim()}>
                        {domainLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request'}
                      </Button>
                    </div>
                    {domainError && (
                      <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {domainError}
                      </p>
                    )}
                    {domainSuccess && (
                      <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {domainSuccess}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Logo Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Logo Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Company Logo" 
                      className="mx-auto h-24 w-24 object-contain border rounded-lg"
                    />
                  ) : (
                    <div className="mx-auto h-24 w-24 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No logo</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                  <Input
                    value={formData.logo_url}
                    onChange={(e) => handleInputChange('logo_url', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Or Upload New Logo</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Favicon URL</label>
                  <Input
                    value={formData.favicon_url}
                    onChange={(e) => handleInputChange('favicon_url', e.target.value)}
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4" style={{ backgroundColor: formData.background_color }}>
                  <div className="flex items-center space-x-3 mb-4">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="h-8 w-8" />
                    ) : (
                      <div 
                        className="h-8 w-8 rounded flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: formData.primary_color }}
                      >
                        {formData.company_name?.[0]?.toUpperCase() || 'A'}
                      </div>
                    )}
                    <span 
                      className="font-semibold"
                      style={{ color: formData.primary_color }}
                    >
                      {formData.company_name || 'Company Name'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Button 
                        size="sm"
                        style={{ backgroundColor: formData.primary_color }}
                      >
                        Primary Button
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        style={{ borderColor: formData.secondary_color, color: formData.secondary_color }}
                      >
                        Secondary Button
                      </Button>
                    </div>
                    
                    <div 
                      className="text-sm p-2 rounded"
                      style={{ backgroundColor: formData.accent_color + '20', color: formData.accent_color }}
                    >
                      Accent color preview
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Storefront Template & Import Settings */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Storefront Template */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Storefront Template
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowTemplateDrawer(true)}>
                  <Palette className="h-4 w-4 mr-1" />
                  {currentTemplateCode ? 'Change' : 'Select'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {currentTemplateCode ? (
                <div className="flex items-center gap-4">
                  {(() => {
                    const t = templates.find(t => t.template_code === currentTemplateCode)
                    if (!t) return <span className="text-sm text-gray-500">{currentTemplateCode}</span>
                    return (
                      <>
                        <div className="flex gap-1">
                          {['primary_color', 'secondary_color', 'accent_color'].map(key => (
                            <div key={key} className="h-8 w-8 rounded border" style={{ backgroundColor: t.preset?.[key] || '#ccc' }} />
                          ))}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{t.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{t.template_code}</p>
                        </div>
                      </>
                    )
                  })()}
                </div>
              ) : (
                <div className="py-6 text-center text-gray-500">
                  <Store className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No storefront template selected.</p>
                  <Button className="mt-3" size="sm" onClick={() => setShowTemplateDrawer(true)}>
                    <Palette className="h-4 w-4 mr-1" /> Choose Template
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Import Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Import Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pseudo-Email Domain</label>
                <p className="text-xs text-gray-500 mb-2">
                  Domain suffix used when generating login emails for CSV-imported members without an email address.
                  Format: <code>phone@domain</code>
                </p>
                <Input
                  value={pseudoEmailDomain}
                  onChange={(e) => setPseudoEmailDomain(e.target.value)}
                  placeholder="phone.afruheritage.com"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button size="sm" onClick={handleSaveImportSettings} disabled={importSaving}>
                  {importSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Import Settings
                </Button>
                {importSaved && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Saved!
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Template Drawer */}
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
                      className={`rounded-lg border p-4 cursor-pointer transition-all hover:border-primary ${currentTemplateCode === t.template_code ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => handleSelectTemplate(t.template_code)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{t.name}</span>
                        {currentTemplateCode === t.template_code && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      {t.description && (
                        <p className="text-xs text-gray-500 mb-2">{t.description}</p>
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
      </div>
    </div>
  )
}
