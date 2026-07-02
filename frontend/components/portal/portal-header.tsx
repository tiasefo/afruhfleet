'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, isAdmin, isCustomer } from '@/lib/auth'
import { LogOut, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export function PortalHeader() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  useState(() => {
    try {
      const user = getCurrentUser()
      if (user) {
        setUserRole(user.role)
        setUserName(user.fullName)
      }
    } catch {}
  })

  const handleLogout = () => {
    document.cookie = 'afruheritage_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'afruheritage_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    setUserRole(null)
    setUserName(null)
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-foreground">Portal</h2>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {userName?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
              </div>
              <span className="text-sm font-medium">{userName || 'User'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-xs text-muted-foreground">
              Role: {userRole || 'Unknown'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive">
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
