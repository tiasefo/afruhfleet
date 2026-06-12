import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'

export default function CustomsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      {children}
      <Footer />
    </>
  )
}
