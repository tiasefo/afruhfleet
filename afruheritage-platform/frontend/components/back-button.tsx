'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BackButton({ label = 'Back', fallback = '/' }: { label?: string; fallback?: string }) {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      size="sm"
      className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
      onClick={() => {
        if (window.history.length > 1) {
          router.back()
        } else {
          router.push(fallback)
        }
      }}
    >
      <ArrowLeft className="mr-1 h-4 w-4" />
      {label}
    </Button>
  )
}
