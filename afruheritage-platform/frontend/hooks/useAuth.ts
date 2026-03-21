'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, getToken, setToken, clearToken } from '@/lib/api'

interface User {
  id: string
  email: string
  full_name: string
  is_superuser?: boolean
  tenant_id?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = getToken()
    if (savedToken) {
      setTokenState(savedToken)
      refreshUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { access_token, user: userData } = response
      
      setToken(access_token)
      setTokenState(access_token)
      setUser(userData)
      
      // Redirect based on user role
      if (userData.is_superuser) {
        router.push('/dashboard')
      } else {
        router.push('/shipments')
      }
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    clearToken()
    setTokenState(null)
    setUser(null)
    router.push('/login')
  }

  const refreshUser = async () => {
    try {
      const userData = await api.get('/auth/me')
      setUser(userData)
    } catch (error) {
      // Token invalid, clear it
      logout()
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    refreshUser,
  }

  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
