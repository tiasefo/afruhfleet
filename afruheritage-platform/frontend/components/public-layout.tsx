import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
