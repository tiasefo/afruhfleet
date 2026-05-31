'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'

type PageActionsBarProps = {
  backHref: string
  backLabel: string
  className?: string
}

export function PageActionsBar({ backHref, backLabel, className }: PageActionsBarProps) {
  const router = useRouter()

  const handleLogout = () => {
    document.cookie = 'afruheritage_access_token=; Max-Age=0; path=/; SameSite=Lax'
    document.cookie = 'afruheritage_user=; Max-Age=0; path=/; SameSite=Lax'
    router.push('/login')
    router.refresh()
  }

  return (
    <div className={`mb-3 flex flex-wrap items-center justify-between gap-2 ${className || ''}`}>
      <Button asChild variant="ghost" className="-ml-2">
        <Link href={backHref}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backLabel}
        </Link>
      </Button>
      <Button variant="outline" onClick={handleLogout} className="gap-2">
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  )
}
