'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { api, setToken, clearToken } from './api'

interface AuthContextType {
  user: any | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
    if (token) {
      try {
        const user = await api.get('/sentinel/auth/me')
        setUser(user)
      } catch (error) {
        clearToken()
        setUser(null)
      }
    }
    setLoading(false)
  }

  const login = async (email: string, password: string) => {
    const data = await api.post('/sentinel/auth/login', { email, password })
    
    // Store both tokens
    setToken(data.access_token, data.control_plane_token)
    
    // Get user info
    const user = await api.get('/sentinel/auth/me')
    setUser(user)
  }

  const logout = () => {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
