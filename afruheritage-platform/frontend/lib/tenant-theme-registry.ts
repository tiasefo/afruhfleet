import type { TenantContext } from './tenant-context'

export type TenantThemeCode = 'freight' | 'fleet' | 'default'

export type StorefrontConfig = {
  motto?: string
  headline?: string
  whatsapp?: { tracking?: string; general?: string }
  contacts?: {
    tracking?: { department?: string; staff?: string; phone?: string; whatsapp?: string; notes?: string }
    general?: { department?: string; phone?: string; whatsapp?: string }
  }
  billing_staff?: Array<{ range?: string; name?: string; phone?: string; phone_digits?: string; note?: string }>
  payment?: { network?: string; merchant_name?: string; merchant_id?: string; phone?: string; phone_digits?: string; is_placeholder?: boolean }
  services?: Array<{ title?: string; desc?: string; icon?: string }>
  marketplaces?: string[]
  workflow?: Array<{ step?: string; title?: string; desc?: string }>

  hero?: {
    type?: 'video' | 'image' | 'static'
    video?: string
    poster?: string
    tagline?: string
    subheadline?: string
    stats?: Array<{ value?: string; label?: string }>
    buttons?: Array<{ label?: string; href?: string; icon?: string; variant?: 'primary' | 'outline' }>
  }

  cta?: {
    type?: 'video' | 'image' | 'static'
    video?: string
    poster?: string
    title?: string
    subtitle?: string
    buttons?: Array<{ label?: string; href?: string; icon?: string; variant?: 'primary' | 'outline' }>
  }

  notices?: Array<{
    title?: string
    tag?: string
    image?: string
    desc?: string
    priority?: 'normal' | 'warning' | 'info'
  }>

  reminders?: Array<{ title?: string; desc?: string; icon?: string }>

  estimator?: {
    modes?: Array<{ id?: string; label?: string; rate?: number; unit?: string }>
    currency?: string
    whatsapp_number?: string
    whatsapp_text?: string
  }

  support?: {
    title?: string
    description?: string
    show_form?: boolean
    show_whatsapp?: boolean
    show_phone?: boolean
    show_email?: boolean
  }

  gallery?: {
    title?: string
    description?: string
    api_endpoint?: string
  }

  nav_links?: Array<{ label?: string; href?: string }>

  about_content?: string
  privacy_content?: string
  cookies_content?: string
  terms_content?: string
  refund_policy_content?: string
  shipping_policy_content?: string
}

export type TenantPublicTheme = {
  slug: string
  themeCode: TenantThemeCode
  basePath: string
  name: string
  logo: string
  primaryColor: string
  accentColor: string
  primaryDarkColor: string
  bgColor: string
  textColor: string
  supportEmail: string
  supportPhone: string
  legalFooterText: string
  legalCompanyName: string
  storefrontConfig: StorefrontConfig | null
}

/**
 * Resolve a tenant theme from a TenantContext object (fetched from the API).
 * Returns a theme that can be used by the storefront rendering layer.
 *
 * - Maps engine types: 'freight', 'fleet', etc. to their corresponding theme.
 * - Falls back to 'default' for unknown engine types.
 * - Never returns null for a valid TenantContext.
 */
export function resolveTenantThemeFromContext(ctx: TenantContext): TenantPublicTheme {
  const themeCode: TenantThemeCode =
    ctx.theme_code === 'freight'
      ? 'freight'
      : ctx.theme_code === 'fleet'
        ? 'fleet'
        : 'default'

  const primary = ctx.primary_color || '#0ea5e9'
  const accent = ctx.accent_color || '#f59e0b'
  const bg = ctx.background_color || '#ffffff'
  const text = ctx.text_color || '#0f172a'

  // Derive a darker primary for hover states
  const primaryDark = darkenHex(primary, 15)

  return {
    slug: ctx.slug,
    themeCode,
    basePath: `/store/${ctx.slug}`,
    name: ctx.company_name,
    logo: ctx.logo_url || '',
    primaryColor: primary,
    accentColor: accent,
    primaryDarkColor: primaryDark,
    bgColor: bg,
    textColor: text,
    supportEmail: ctx.support_email || '',
    supportPhone: ctx.support_phone || '',
    legalFooterText: ctx.legal_footer_text || '',
    legalCompanyName: ctx.legal_company_name || '',
    storefrontConfig: ctx.storefront_config || null,
  }
}

/**
 * Server-side resolution: fetch tenant context from the API and return a theme.
 * Returns null only if the tenant doesn't exist (genuine 404).
 */
export async function resolveTenantTheme(slug: string): Promise<TenantPublicTheme | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_BASE_URL && process.env.NEXT_PUBLIC_API_BASE_URL.startsWith('http') ? process.env.NEXT_PUBLIC_API_BASE_URL : 'http://api:8000')
    const response = await fetch(`${baseUrl}/api/v1/tenant-context/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    })
    if (!response.ok) return null
    const raw = await response.json()

    // The API may return either a flat TenantContext or a nested shape with
    // theme/contact/legal/features sub-objects. Normalize to flat.
    const ctx: TenantContext = {
      id: raw.id || raw.slug || slug,
      slug: raw.slug || slug,
      company_name: raw.company_name || '',
      logo_url: raw.logo_url ?? raw.theme?.logo_url ?? null,
      favicon_url: raw.favicon_url ?? raw.theme?.favicon_url ?? null,
      primary_color: raw.primary_color || raw.theme?.primary_color || '#0ea5e9',
      secondary_color: raw.secondary_color || raw.theme?.secondary_color || '#64748b',
      accent_color: raw.accent_color || raw.theme?.accent_color || '#f59e0b',
      background_color: raw.background_color || raw.theme?.background_color || '#ffffff',
      text_color: raw.text_color || raw.theme?.foreground_color || '#0f172a',
      default_currency: raw.default_currency || 'GHS',
      default_language: raw.default_language || 'en',
      supported_languages: raw.supported_languages || ['en'],
      maps_enabled: raw.maps_enabled ?? raw.features?.maps_enabled ?? true,
      public_tracking_enabled: raw.public_tracking_enabled ?? raw.features?.public_tracking_enabled ?? true,
      csv_import_enabled: raw.csv_import_enabled ?? raw.features?.csv_import_enabled ?? true,
      group_members_enabled: raw.group_members_enabled ?? raw.features?.group_members_enabled ?? true,
      max_group_members: raw.max_group_members ?? raw.features?.max_group_members ?? 50,
      support_email: raw.support_email || raw.contact?.support_email || '',
      support_phone: raw.support_phone || raw.contact?.support_phone || '',
      legal_footer_text: raw.legal_footer_text || raw.legal?.legal_footer_text || '',
      legal_company_name: raw.legal_company_name || raw.legal?.legal_company_name || '',
      theme_code: raw.theme_code || raw.template_code || 'default',
      storefront_config: raw.storefront_config || undefined,
    }

    return resolveTenantThemeFromContext(ctx)
  } catch {
    return null
  }
}

function darkenHex(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, ((num >> 16) & 0xff) - Math.round(255 * (percent / 100)))
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * (percent / 100)))
  const b = Math.max(0, (num & 0xff) - Math.round(255 * (percent / 100)))
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
}
