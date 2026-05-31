'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, getToken, setToken, clearToken, authApi } from '@/lib/api_updated'
import { persistTenantId } from '@/lib/tenant'

interface User {
  id: string
  email: string
  full_name: string
  role?: string
  is_superuser?: boolean
  is_tenant_admin?: boolean
  onboarding_complete?: boolean
  tenant_id?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithToken: (token: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const loginWithToken = async (accessToken: string) => {
    setToken(accessToken)
    setTokenState(accessToken)
    const userData = await authApi.me()
    setUser(userData)
    persistTenantId(userData.tenant_id)
    if (userData.is_superuser) {
      router.push('/dashboard')
    } else if (!userData.onboarding_complete) {
      router.push('/onboarding')
    } else {
      router.push('/dashboard')
    }
  }

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
      const response = await authApi.login({ username: email, password })
      const { access_token } = response
      
      setToken(access_token)
      setTokenState(access_token)

      const userData = await authApi.me()
      setUser(userData)
      persistTenantId(userData.tenant_id)
      
      // Redirect based on user role
      if (userData.is_superuser) {
        router.push('/dashboard')
      } else if (!userData.onboarding_complete) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    clearToken()
    persistTenantId(null)
    setTokenState(null)
    setUser(null)
    router.push('/login')
  }

  const refreshUser = async () => {
    try {
      const userData = await authApi.me()
      setUser(userData)
      persistTenantId(userData.tenant_id)
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
    loginWithToken,
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
