export type UserRole = 'admin' | 'customer'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: UserRole
  tenantId?: string | null
}

export function parseAuthUser(value: string | undefined): AuthUser | null {
  if (!value) return null
  try {
    const user = JSON.parse(value)
    if (user && user.id && user.role) return user as AuthUser
  } catch {}
  return null
}

export function getCurrentUser(): AuthUser | null {
  if (typeof document === 'undefined') {
    return null
  }

  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith('afruheritage_user='))
    ?.split('=')
    .slice(1)
    .join('=')

  return parseAuthUser(cookie ? decodeURIComponent(cookie) : undefined)
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'admin'
}

export function isCustomer(user: AuthUser | null): boolean {
  return user?.role === 'customer'
}
