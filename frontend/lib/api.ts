export function getApiBaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || null
}

export function joinApiUrl(apiBaseUrl: string, endpoint: string): string {
  const normalizedBase = apiBaseUrl.replace(/\/$/, '')
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  if (normalizedBase.endsWith('/api/v1') && normalizedEndpoint.startsWith('/api/v1/')) {
    return `${normalizedBase}${normalizedEndpoint.slice('/api/v1'.length)}`
  }

  return `${normalizedBase}${normalizedEndpoint}`
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null

  const raw = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))
    ?.split('=')
    .slice(1)
    .join('=')

  return raw ? decodeURIComponent(raw) : null
}