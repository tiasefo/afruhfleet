'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function StoreRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    const subdomain = typeof window !== 'undefined' ? localStorage.getItem('tenant_subdomain') : null
    if (subdomain) {
      router.push(`/store/${subdomain}`)
    } else {
      router.push('/dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
