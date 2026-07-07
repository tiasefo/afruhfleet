'use client'

import { Workflow } from "@/templates/amooksco/components/home/workflow"
import { Services } from "@/templates/amooksco/components/home/services"
import { Track } from "@/templates/amooksco/components/home/track"
import { Estimator } from "@/templates/amooksco/components/home/estimator"
import { Payments } from "@/templates/amooksco/components/home/payments"
import { CTA } from "@/templates/amooksco/components/home/cta"
import { SiteHeader } from "@/templates/amooksco/components/site-header"
import { SiteFooter } from "@/templates/amooksco/components/site-footer"
import { ChatWidget } from "@/templates/amooksco/components/chat-widget"
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

export default function StorefrontPage() {
  const { user, token, isLoading: authLoading } = useAuth()

  // Show loading state while auth loads
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading storefront...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, redirect to login
  if (!user || !token) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return null
  }

  // Render Amooksco template directly
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Workflow />
        <Services />
        <Track />
        <Estimator />
        <Payments />
        <CTA />
      </main>
      <SiteFooter />
      <ChatWidget />
    </div>
  )
}
