'use client'

import { useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const HIDDEN_PATHS = new Set([
  '/',
  '/login',
])

function getFallbackPath(pathname: string): string {
  if (pathname === '/dashboard') return '/'
  if (pathname.startsWith('/dashboard/')) return '/dashboard'
  return '/dashboard'
}

export function GlobalBackButton() {
  const pathname = usePathname()
  const router = useRouter()

  const shouldShow = useMemo(() => {
    if (!pathname) return false
    return !HIDDEN_PATHS.has(pathname)
  }, [pathname])

  if (!shouldShow || !pathname) {
    return null
  }

  const fallbackPath = getFallbackPath(pathname)

  return (
    <div className="pointer-events-none fixed left-4 top-4 z-50">
      <Button
        type="button"
        variant="outline"
        className="pointer-events-auto bg-background/95 shadow-sm backdrop-blur"
        onClick={() => {
          if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back()
            return
          }
          router.push(fallbackPath)
        }}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
    </div>
  )
}
