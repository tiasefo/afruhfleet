import { TenantContext } from './tenant-context'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export async function fetchTenantContextServer(identifier: string): Promise<TenantContext | null> {
  if (!identifier) return null
  const url = `${API_BASE}/api/v1/tenant-context/${identifier}`
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'force-cache',
    })
    if (!res.ok) return null
    return (await res.json()) as TenantContext
  } catch {
    return null
  }
}

export async function fetchTenantContextByHostServer(host: string): Promise<TenantContext | null> {
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
    return null
  }
  const url = `${API_BASE}/api/v1/tenant-context/resolve/host`
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', 'x-forwarded-host': host },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as TenantContext
  } catch {
    return null
  }
}

export function generateThemeCSSVariables(theme: TenantContext['theme']): string {
  const vars: string[] = []
  if (theme.primary_color) vars.push(`--primary: ${theme.primary_color}`)
  if (theme.secondary_color) vars.push(`--secondary: ${theme.secondary_color}`)
  if (theme.accent_color) vars.push(`--accent: ${theme.accent_color}`)
  if (theme.background_color) vars.push(`--background: ${theme.background_color}`)
  if (theme.foreground_color) vars.push(`--foreground: ${theme.foreground_color}`)
  if (theme.success_color) vars.push(`--success: ${theme.success_color}`)
  if (theme.warning_color) vars.push(`--warning: ${theme.warning_color}`)
  if (theme.danger_color) vars.push(`--danger: ${theme.danger_color}`)
  if (theme.radius) vars.push(`--radius: ${theme.radius}`)
  if (theme.font_family) vars.push(`--font-sans: ${theme.font_family}`)
  return vars.join('; ')
}

export function generateThemeStyleTag(theme: TenantContext['theme']): string {
  const cssVars = generateThemeCSSVariables(theme)
  if (!cssVars) return ''
  return `:root { ${cssVars}; }`
}
