import { cookies } from 'next/headers'

export type UserRole = 'admin' | 'customer'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: UserRole
}

// Simulate fetching user from cookie (replace with real API call)
export function getCurrentUser(): AuthUser | null {
  const cookie = cookies().get('afruheritage_user')?.value
  if (!cookie) return null
  try {
    const user = JSON.parse(cookie)
    if (user && user.id && user.role) return user as AuthUser
  } catch {}
  return null
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'admin'
}

export function isCustomer(user: AuthUser | null): boolean {
  return user?.role === 'customer'
}
