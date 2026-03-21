'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useBranding } from '@/hooks/useBranding'
import { useTranslation } from '@/hooks/useTranslation'
import { brandingAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Settings, 
  Palette, 
  Globe, 
  Save, 
  Upload,
  Eye,
  Loader2
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
    }
  }, [branding])

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
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
      </div>
    </div>
  )
}
