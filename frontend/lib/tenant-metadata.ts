import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { TenantContext } from './tenant-context'
import { fetchTenantContextServer, fetchTenantContextByHostServer } from './tenant-context-server'

const PLATFORM_DEFAULTS = {
  title: 'Afruheritage | AI-Powered Freight Forwarding Platform',
  description: 'The complete logistics platform for Africa. Track shipments, manage cargo, and streamline your supply chain with AI-powered intelligence. Serving Ghana, China, and global trade corridors.',
  keywords: ['freight forwarding', 'logistics', 'shipping', 'cargo', 'Africa', 'Ghana', 'China trade', 'supply chain', 'AI logistics'],
  author: 'Afruheritage',
  themeColorLight: '#1a3a4a',
  themeColorDark: '#0f1f28',
}

export async function resolveTenantSlugFromHeaders(): Promise<string | null> {
  const headerList = await headers()
  const tenantSlug = headerList.get('x-tenant-slug')
  if (tenantSlug) return tenantSlug

  const tenantHost = headerList.get('x-tenant-host')
  if (tenantHost) {
    // For custom domains, we can't resolve slug from header alone
    // The host-based resolution happens via the API
    return tenantHost
  }

  return null
}

export async function resolveTenantContext(): Promise<TenantContext | null> {
  const identifier = await resolveTenantSlugFromHeaders()
  if (!identifier) return null

  // If it looks like a domain, use host-based resolution
  if (identifier.includes('.')) {
    return fetchTenantContextByHostServer(identifier)
  }

  return fetchTenantContextServer(identifier)
}

export function generateTenantMetadata(
  tenant: TenantContext | null,
  pagePath?: string,
): Metadata {
  if (!tenant) {
    return {
      title: PLATFORM_DEFAULTS.title,
      description: PLATFORM_DEFAULTS.description,
      keywords: PLATFORM_DEFAULTS.keywords,
      authors: [{ name: PLATFORM_DEFAULTS.author }],
      openGraph: {
        title: PLATFORM_DEFAULTS.title,
        description: PLATFORM_DEFAULTS.description,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: PLATFORM_DEFAULTS.title,
        description: PLATFORM_DEFAULTS.description,
      },
      robots: { index: true, follow: true },
    }
  }

  const seo = tenant.seo
  const companyName = tenant.company_name
  const title = seo.title || `${companyName} | Logistics & Freight Forwarding`
  const description = seo.description || `${companyName} — professional logistics and freight forwarding services.`
  const keywords = seo.keywords.length > 0 ? seo.keywords : ['logistics', 'freight forwarding', 'shipping', 'cargo']
  const canonical = seo.canonical_url || undefined
  const ogImage = tenant.theme.og_image_url || tenant.theme.logo_url || undefined

  const metadata: Metadata = {
    title,
    description,
    keywords,
    authors: [{ name: companyName }],
    openGraph: {
      title: seo.og_title || title,
      description: seo.og_description || description,
      type: 'website',
      siteName: companyName,
      images: ogImage ? [{ url: ogImage, alt: companyName }] : undefined,
    },
    twitter: {
      card: (seo.twitter_card === 'summary' || seo.twitter_card === 'summary_large_image') ? seo.twitter_card : 'summary_large_image',
      title: seo.og_title || title,
      description: seo.og_description || description,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: {
      index: seo.robots.includes('index'),
      follow: seo.robots.includes('follow'),
    },
  }

  if (canonical) {
    metadata.alternates = {
      canonical,
    }
  }

  if (pagePath && canonical) {
    metadata.alternates = {
      canonical: `${canonical}${pagePath}`,
    }
  }

  return metadata
}

export function generateTenantViewport(
  tenant: TenantContext | null,
): Viewport {
  if (!tenant) {
    return {
      width: 'device-width',
      initialScale: 1,
      themeColor: [
        { media: '(prefers-color-scheme: light)', color: PLATFORM_DEFAULTS.themeColorLight },
        { media: '(prefers-color-scheme: dark)', color: PLATFORM_DEFAULTS.themeColorDark },
      ],
    }
  }

  const primaryColor = tenant.theme.primary_color
  const secondaryColor = tenant.theme.secondary_color

  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: primaryColor },
      { media: '(prefers-color-scheme: dark)', color: secondaryColor },
    ],
  }
}

export function generateTenantJsonLd(
  tenant: TenantContext | null,
  pagePath?: string,
): Record<string, unknown> | null {
  if (!tenant) return null

  const canonical = tenant.seo.canonical_url || ''
  const url = pagePath ? `${canonical}${pagePath}` : canonical

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: tenant.company_name,
    description: tenant.seo.description || tenant.tagline || undefined,
    url: url || undefined,
    logo: tenant.theme.logo_url || undefined,
    email: tenant.contact.support_email || undefined,
    telephone: tenant.contact.support_phone || undefined,
    address: {
      '@type': 'PostalAddress',
      addressCountry: tenant.default_language === 'zh' ? 'CN' : 'GH',
    },
    sameAs: [],
  }
}

export function generateTenantIcons(tenant: TenantContext | null): Metadata['icons'] {
  if (!tenant || !tenant.theme.favicon_url) {
    return undefined
  }

  return {
    icon: tenant.theme.favicon_url,
    shortcut: tenant.theme.favicon_url,
    apple: tenant.theme.favicon_url,
  }
}
