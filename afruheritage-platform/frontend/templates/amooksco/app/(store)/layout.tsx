import type { ReactNode } from "react"
import { SiteHeader } from "@/templates/amooksco/components/site-header"
import { SiteFooter } from "@/templates/amooksco/components/site-footer"
import { ChatWidget } from "@/templates/amooksco/components/chat-widget"

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <ChatWidget />
    </div>
  )
}
