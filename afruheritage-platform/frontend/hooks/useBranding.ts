'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ApiError, brandingAPI, getToken } from '@/lib/api'

interface TenantBranding {
  company_name: string
  logo_url: string
  favicon_url: string
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  default_currency: string
  default_language: 'en' | 'zh'
  supported_languages: string[]
  maps_enabled: boolean
  public_tracking_enabled: boolean
  csv_import_enabled: boolean
  group_members_enabled: boolean
  max_group_members: number
  support_email: string
  support_phone: string
  legal_footer_text: string
  legal_company_name: string
  pseudo_email_domain: string
  template_code: string | null
}

interface BrandingContextType {
  branding: TenantBranding | null
  isLoading: boolean
  error: string | null
  refreshBranding: () => Promise<void>
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined)

// Default branding fallback
const defaultBranding: TenantBranding = {
  company_name: 'Afruheritage',
  logo_url: '/placeholder-logo.svg',
  favicon_url: '/favicon.ico',
  primary_color: '#0ea5e9',
  secondary_color: '#64748b',
  accent_color: '#f59e0b',
  background_color: '#ffffff',
  default_currency: 'GHS',
  default_language: 'en',
  supported_languages: ['en', 'zh'],
  maps_enabled: true,
  public_tracking_enabled: true,
  csv_import_enabled: true,
  group_members_enabled: true,
  max_group_members: 50,
  support_email: 'support@afruheritage.com',
  support_phone: '+233 30 123 4567',
  legal_footer_text: '© 2024 Afruheritage. All rights reserved.',
  legal_company_name: 'Afruheritage Logistics Ltd',
  pseudo_email_domain: 'phone.afruheritage.com',
  template_code: null,
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<TenantBranding | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBranding()
  }, [])

  const loadBranding = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = getToken()

      if (token) {
        const response = await brandingAPI.get()
        setBranding(response)
        return
      }

      const response = await brandingAPI.getPublic()
      setBranding(response)
    } catch (error) {
      if (!(error instanceof ApiError && (error.status === 401 || error.status === 404))) {
        console.error('Failed to load branding:', error)
        setError('Failed to load branding')
      }

      // Use default branding as fallback
      setBranding(defaultBranding)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshBranding = async () => {
    await loadBranding()
  }

  // Apply branding to CSS custom properties
  useEffect(() => {
    if (branding && typeof window !== 'undefined') {
      const root = document.documentElement
      root.style.setProperty('--color-primary', branding.primary_color)
      root.style.setProperty('--color-secondary', branding.secondary_color)
      root.style.setProperty('--color-accent', branding.accent_color)
      root.style.setProperty('--color-background', branding.background_color)
      
      // Update favicon
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
      if (favicon && branding.favicon_url) {
        favicon.href = branding.favicon_url
      }
      
      // Update page title
      if (document.title === 'Afruheritage' || !document.title.includes(branding.company_name)) {
        document.title = `${branding.company_name} - Powered by Afruheritage`
      }
    }
  }, [branding])

  const value: BrandingContextType = {
    branding,
    isLoading,
    error,
    refreshBranding,
  }

  return React.createElement(
    BrandingContext.Provider,
    { value },
    children
  )
}

export function useBranding() {
  const context = useContext(BrandingContext)
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider')
  }
  return context
}
