'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  Warehouse,
  CreditCard,
  Settings,
  FileText,
  Image as ImageIcon,
  type LucideIcon,
} from 'lucide-react'
import { useTenant } from '@/components/tenant-context-provider'
import { TenantLogo } from '@/components/tenant-logo'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/portal', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Cargo', href: '/portal/cargo', icon: Package },
      { label: 'Orders', href: '/portal/orders', icon: ShoppingCart },
      { label: 'Customers', href: '/portal/customers', icon: Users },
    ],
  },
  {
    title: 'Logistics',
    items: [
      { label: 'Fleet', href: '/portal/fleet', icon: Truck },
      { label: 'Warehouse', href: '/portal/warehouse', icon: Warehouse },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Billing', href: '/portal/billing', icon: CreditCard },
      { label: 'Documents', href: '/portal/documents', icon: FileText },
      { label: 'Gallery', href: '/portal/gallery', icon: ImageIcon },
      { label: 'Settings', href: '/portal/settings', icon: Settings },
    ],
  },
]

export function PortalSidebar() {
  const pathname = usePathname()
  const tenant = useTenant()

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <TenantLogo href="/portal" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {tenant && (
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">
            {tenant.subscription.plan_code} plan
          </p>
        </div>
      )}
    </aside>
  )
}
