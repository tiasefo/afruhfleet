'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, setToken, clearToken, getToken } from '@/lib/api'

interface AdminUser {
  id: string
  email: string
  role: string
  full_name: string
}

export function useAuth() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const data = await api.get('/sentinel/auth/me')
      setUser(data)
    } catch {
      clearToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMe() }, [fetchMe])

  const login = async (email: string, password: string) => {
    const data = await api.post('/sentinel/auth/login', { email, password })
    setToken(data.access_token)
    await fetchMe()
    return data
  }

  const logout = () => {
    clearToken()
    setUser(null)
  }

  return { user, loading, login, logout, isAuthenticated: !!user }
}
