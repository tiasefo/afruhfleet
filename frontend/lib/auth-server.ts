import { cookies } from 'next/headers'

import { AuthUser, parseAuthUser } from '@/lib/auth'

export async function getCurrentUserServer(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  return parseAuthUser(cookieStore.get('afruheritage_user')?.value)
}