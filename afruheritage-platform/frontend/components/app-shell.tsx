'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useBranding } from '@/hooks/useBranding'
import {
  LayoutDashboard,
  Package,
  Users,
  CreditCard,
  Settings,
  HelpCircle,
  ShoppingBag,
  BadgeCheck,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Home,
  Globe,
  Shield,
  Truck,
  Calculator,
  ExternalLink,
  UserCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FAQChatWidget } from "@/components/faq-chat-widget"

// Routes where the AppShell should NOT render
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/register/company',
  '/pricing',
  '/docs',
  '/track',
  '/support/ticket',
  '/onboarding',
  '/tenant-request',
]

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true
  if (pathname.startsWith('/register/')) return true
  if (pathname.startsWith('/support/ticket/')) return true
  return false
}

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  roles?: string[]   // undefined = visible to all authenticated users
  superonly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Products', href: '/products', icon: ShoppingBag },
  { label: 'Shipments', href: '/shipments', icon: Package },
  { label: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
  { label: 'CRM', href: '/crm', icon: BarChart3 },
  { label: 'Customs Duty', href: '/customs/duty-calculator', icon: Calculator },
  { label: 'Team Members', href: '/members', icon: Users },
  { label: 'KYC', href: '/kyc', icon: BadgeCheck },
  { label: 'Support', href: '/support/dashboard', icon: HelpCircle },
  { label: 'Billing', href: '/billing', icon: CreditCard },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Storefront', href: '/storefront', icon: ShoppingBag },
  { label: 'Vendors', href: '/vendors', icon: Truck },
  { label: 'Profile', href: '/profile', icon: UserCircle },
]

const ADMIN_ITEMS: NavItem[] = [
  { label: 'Admin Console', href: '/admin', icon: Shield, superonly: true },
]

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
      {item.badge && (
        <Badge variant="secondary" className="ml-auto text-xs">
          {item.badge}
        </Badge>
      )}
    </Link>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, token, logout } = useAuth()
  const { branding } = useBranding()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const shouldRender = !isPublicRoute(pathname) && !!token

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const displayName = branding?.company_name || 'Afruheritage'
  const logoUrl = branding?.logo_url

  if (!shouldRender) {
    return <>{children}</>
  }

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.superonly) return false
    return true
  })
  const adminItems = user?.is_superuser ? ADMIN_ITEMS : []

  const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div className="flex h-full flex-col">
      {/* Brand header */}
      <div className="border-b p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
          onClick={onLinkClick}
        >
          {logoUrl ? (
            <img src={logoUrl} alt={displayName} className="h-8 w-8 rounded-lg object-contain" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <Link
          href="/"
          onClick={onLinkClick}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Home className="h-4 w-4 shrink-0" />
          <span>Home</span>
        </Link>

        <div className="my-2 border-t" />

        {visibleNavItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname === item.href || pathname.startsWith(item.href + '/')}
            onClick={onLinkClick}
          />
        ))}

        {(() => {
          const subdomain = typeof window !== 'undefined' ? localStorage.getItem('tenant_subdomain') : null
          return subdomain ? (
            <>
              <div className="my-2 border-t" />
              <a
                href={`/store/${subdomain}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onLinkClick}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span>View My Store</span>
              </a>
            </>
          ) : null
        })()}

        {adminItems.length > 0 && (
          <>
            <div className="my-2 border-t" />
            <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Admin
            </p>
            {adminItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={pathname === item.href || pathname.startsWith(item.href + '/')}
                onClick={onLinkClick}
              />
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t p-4 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2 text-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{user?.full_name}</p>
            <p className="truncate text-xs text-muted-foreground capitalize">{user?.role?.replace(/_/g, ' ') || 'User'}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r bg-card lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-card border-r transform transition-transform duration-200 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute right-2 top-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <SidebarContent onLinkClick={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar (mobile only) */}
        <header className="flex items-center gap-3 border-b bg-card px-4 py-3 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <span className="text-xs font-bold text-primary-foreground">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-semibold">{displayName}</span>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      {/* AI Chat Widget */}
      <FAQChatWidget />
    </div>
  )
}
