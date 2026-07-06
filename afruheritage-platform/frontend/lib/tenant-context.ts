import { resolvePublicTenantId } from './tenant'

export interface TenantContext {
  id: string
  slug: string
  company_name: string
  logo_url: string | null
  favicon_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  text_color: string
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
  theme_code: string
}

const DEFAULT_TENANT_CONTEXT: TenantContext = {
  id: 'platform',
  slug: 'platform',
  company_name: 'Afruheritage',
  logo_url: null,
  favicon_url: '/favicon.ico',
  primary_color: '#0ea5e9',
  secondary_color: '#64748b',
  accent_color: '#f59e0b',
  background_color: '#ffffff',
  text_color: '#0f172a',
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
  theme_code: 'default',
}

export async function fetchTenantContextServer(slug: string): Promise<TenantContext | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8100'
    const response = await fetch(`${baseUrl}/api/v1/tenant-context/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to fetch tenant context:', error)
    return null
  }
}

/**
 * Client-side fetch of tenant context. Uses a same-origin relative URL so it
 * flows through the Next.js `/api/v1/*` rewrite to the control plane in every
 * environment. `identifier` may be a slug, subdomain, custom domain, or UUID —
 * the backend's `/tenant-context/{identifier}` resolver handles all of them.
 * Returns null on any miss/error (caller decides the fallback) — no silent defaults.
 */
export async function fetchTenantContextClient(identifier: string): Promise<TenantContext | null> {
  try {
    const response = await fetch(`/api/v1/tenant-context/${encodeURIComponent(identifier)}`, {
      cache: 'no-store',
    })
    if (!response.ok) {
      return null
    }
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch tenant context (client):', error)
    return null
  }
}

export async function fetchTenantContextByHostServer(host: string): Promise<TenantContext | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8100'
    const hostname = host.split(':')[0].toLowerCase()

    // Try the full hostname first (matches custom_domain via resolve_tenant)
    const response = await fetch(`${baseUrl}/api/v1/tenant-context/${encodeURIComponent(hostname)}`, {
      cache: 'no-store',
    })

    if (response.ok) {
      return await response.json()
    }

    // If full hostname didn't match, try extracting subdomain (e.g., "amooksco" from "amooksco.afruheritage.com")
    const parts = hostname.split('.')
    if (parts.length >= 3) {
      const subdomain = parts[0]
      const subResponse = await fetch(`${baseUrl}/api/v1/tenant-context/${encodeURIComponent(subdomain)}`, {
        cache: 'no-store',
      })
      if (subResponse.ok) {
        return await subResponse.json()
      }
    }

    return null
  } catch (error) {
    console.error('Failed to fetch tenant context by host:', error)
    return null
  }
}

export function applyTenantTheme(context: TenantContext): void {
  if (typeof document === 'undefined') return
  
  const root = document.documentElement
  root.style.setProperty('--color-primary', context.primary_color)
  root.style.setProperty('--color-secondary', context.secondary_color)
  root.style.setProperty('--color-accent', context.accent_color)
  root.style.setProperty('--color-background', context.background_color)
  root.style.setProperty('--color-text', context.text_color)
  
  // Update favicon
  let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null
  if (!favicon) {
    favicon = document.createElement('link')
    favicon.rel = 'icon'
    document.head.appendChild(favicon)
  }
  if (context.favicon_url) {
    favicon.href = context.favicon_url
  }
  
  // Update page title
  if (context.id !== 'platform') {
    document.title = `${context.company_name}`
  }
}

export function getDefaultTenantContext(): TenantContext {
  return { ...DEFAULT_TENANT_CONTEXT }
}

export function isPlatformTenant(context: TenantContext): boolean {
  return context.id === 'platform' || context.slug === 'platform'
}
