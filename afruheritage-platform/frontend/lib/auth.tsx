'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface AuthUser {
  email: string
  full_name: string
  is_superuser: boolean
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async (t: string) => {
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${t}` },
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        setTokenState(null)
        setUser(null)
        setLoading(false)
        return
      }
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      }
    } catch {
      // Network error — keep token, don't log out
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (saved) {
      setTokenState(saved)
      fetchUser(saved)
    } else {
      setLoading(false)
    }
  }, [fetchUser])

  const login = useCallback((t: string) => {
    localStorage.setItem('token', t)
    setTokenState(t)
    fetchUser(t)
  }, [fetchUser])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setTokenState(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
