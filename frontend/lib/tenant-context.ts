export interface TenantTheme {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  foreground_color: string;
  success_color: string;
  warning_color: string;
  danger_color: string;
  font_family: string;
  radius: string;
  logo_url: string | null;
  favicon_url: string | null;
  og_image_url: string | null;
}

export interface TenantContact {
  support_email: string | null;
  support_phone: string | null;
  support_url: string | null;
  notification_from_name: string | null;
  notification_from_email: string | null;
}

export interface TenantLegal {
  legal_company_name: string | null;
  legal_footer_text: string | null;
  terms_url: string | null;
  privacy_url: string | null;
}

export interface TenantFeatureFlags {
  maps_enabled: boolean;
  public_tracking_enabled: boolean;
  csv_import_enabled: boolean;
  group_members_enabled: boolean;
  max_group_members: number;
  ai_enabled: boolean;
  marketplace_enabled: boolean;
  custom_domains_enabled: boolean;
}

export interface TenantSubscriptionInfo {
  plan_code: string;
  status: string;
  trial: boolean;
  credits_balance: number;
  features: string[];
}

export interface TenantSEO {
  title: string | null;
  description: string | null;
  keywords: string[];
  og_title: string | null;
  og_description: string | null;
  twitter_card: string;
  canonical_url: string | null;
  robots: string;
}

export interface TenantContext {
  id: string;
  slug: string;
  company_name: string;
  tagline: string | null;
  domain: string | null;
  subdomain: string | null;
  custom_domain: string | null;
  default_language: string;
  supported_languages: string[];
  template_code: string | null;
  storefront_config: Record<string, unknown> | null;
  theme: TenantTheme;
  contact: TenantContact;
  legal: TenantLegal;
  features: TenantFeatureFlags;
  subscription: TenantSubscriptionInfo;
  seo: TenantSEO;
  created_at: string | null;
  updated_at: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const CACHE_KEY_PREFIX = 'tenant_ctx_';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedContext {
  data: TenantContext;
  fetchedAt: number;
}

export function getApiBaseUrl(): string {
  return API_BASE;
}

export function getCachedTenantContext(slug: string): TenantContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY_PREFIX + slug);
    if (!raw) return null;
    const cached: CachedContext = JSON.parse(raw);
    if (Date.now() - cached.fetchedAt > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY_PREFIX + slug);
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

export function setCachedTenantContext(slug: string, data: TenantContext): void {
  if (typeof window === 'undefined') return;
  try {
    const cached: CachedContext = { data, fetchedAt: Date.now() };
    sessionStorage.setItem(CACHE_KEY_PREFIX + slug, JSON.stringify(cached));
  } catch {
    // sessionStorage might be full or unavailable
  }
}

export async function fetchTenantContext(identifier: string): Promise<TenantContext | null> {
  const cached = getCachedTenantContext(identifier);
  if (cached) return cached;

  const url = `${API_BASE}/api/v1/tenant-context/${identifier}`;
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      console.error(`[TenantContext] Failed to fetch: ${res.status} ${res.statusText}`);
      return null;
    }
    const data: TenantContext = await res.json();
    setCachedTenantContext(identifier, data);
    return data;
  } catch (err) {
    console.error('[TenantContext] Error fetching:', err);
    return null;
  }
}

export async function fetchTenantContextByHost(): Promise<TenantContext | null> {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
    return null;
  }
  const url = `${API_BASE}/api/v1/tenant-context/resolve/host`;
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const data: TenantContext = await res.json();
    return data;
  } catch {
    return null;
  }
}

export function applyTenantThemeToCSS(theme: TenantTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--primary', theme.primary_color);
  root.style.setProperty('--secondary', theme.secondary_color);
  root.style.setProperty('--accent', theme.accent_color);
  root.style.setProperty('--background', theme.background_color);
  root.style.setProperty('--foreground', theme.foreground_color);
  root.style.setProperty('--success', theme.success_color);
  root.style.setProperty('--warning', theme.warning_color);
  root.style.setProperty('--danger', theme.danger_color);
  root.style.setProperty('--radius', theme.radius);
  if (theme.font_family) {
    root.style.setProperty('--font-sans', theme.font_family);
  }
}

export function applyTenantFavicon(faviconUrl: string | null): void {
  if (typeof document === 'undefined') return;
  if (!faviconUrl) return;
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = faviconUrl;
}
