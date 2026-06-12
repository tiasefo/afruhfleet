'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslation } from '@/hooks/useTranslation'
import { useAuth } from '@/hooks/useAuth'

const countries = [
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
]

const navLinks = [
  {
    label: 'Solutions',
    href: '/solutions',
    submenu: [
      { label: 'Shipment Tracking', href: '/track' },
      { label: 'Freight Management', href: '/shipments' },
      { label: 'Customs Clearance', href: '/customs' },
      { label: 'Duty Calculator', href: '/customs/duty-calculator' },
      { label: 'Warehouse Services', href: '/pricing' },
    ],
  },
  {
    label: 'Platform',
    href: '/platform',
    submenu: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Fleetbase Console', href: '/fleetbase/console' },
      { label: 'Live Map', href: '/fleetbase/live-map' },
      { label: 'API Documentation', href: '/docs' },
    ],
  },
  {
    label: 'Resources',
    href: '/resources',
    submenu: [
      { label: 'Help Center', href: '/support' },
      { label: 'Documentation', href: '/docs' },
      { label: 'Vendor Portal', href: '/vendors' },
    ],
  },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation()
  const { user, token } = useAuth()
  const [lang, setLang] = useState('en')

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">A</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-foreground">
            Afruheritage
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) =>
            link.submenu ? (
              <DropdownMenu key={link.label}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-1 text-muted-foreground hover:text-foreground">
                    {link.label}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {link.submenu.map((sublink) => (
                    <DropdownMenuItem key={sublink.label} asChild>
                      <Link href={sublink.href}>{sublink.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button key={link.label} variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ),
          )}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Button variant="outline" asChild>
            <Link href="/customs">Customs Clearance</Link>
          </Button>

          {/* Country Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <span className="text-lg">🌍</span>
                <span>Locations</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {countries.map((country) => (
                <DropdownMenuItem key={country.code} asChild>
                  <Link href={`/locations/${country.code.toLowerCase()}`} className="flex items-center gap-2">
                    <span className="text-xl">{country.flag}</span>
                    <span>{country.name}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {token ? (
            <Button asChild>
              <Link href="/dashboard">{user?.full_name || 'Dashboard'}</Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href="/tenant-request">Request Tenant</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/login">{t('auth.login')}</Link>
              </Button>
              <Button asChild>
                <Link href="/register">{t('auth.get_started')}</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-80">
            <div className="flex flex-col gap-6 pt-6">
              <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <span className="text-lg font-bold text-primary-foreground">A</span>
                </div>
                <span className="text-xl font-semibold">Afruheritage</span>
              </Link>

              <Button asChild className="w-full">
                <Link href="/customs" onClick={() => setIsOpen(false)}>
                  Customs Clearance
                </Link>
              </Button>

              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <div key={link.label}>
                    {link.submenu ? (
                      <div className="space-y-1">
                        <span className="text-sm font-medium text-foreground">{link.label}</span>
                        <div className="ml-4 flex flex-col gap-1">
                          {link.submenu.map((sublink) => (
                            <Link
                              key={sublink.label}
                              href={sublink.href}
                              className="text-sm text-muted-foreground hover:text-foreground"
                              onClick={() => setIsOpen(false)}
                            >
                              {sublink.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm font-medium text-foreground hover:text-primary"
                        onClick={() => setIsOpen(false)}
                      >
                        {link.label}
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              {/* Mobile Country Selector */}
              <div className="space-y-2 pt-4 border-t">
                <span className="text-sm font-medium text-foreground">Our Locations</span>
                <div className="grid grid-cols-2 gap-2">
                  {countries.map((country) => (
                    <Link
                      key={country.code}
                      href={`/locations/${country.code.toLowerCase()}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="text-xl">{country.flag}</span>
                      <span>{country.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t">
                {token ? (
                  <Button asChild className="w-full">
                    <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                      {user?.full_name || 'Dashboard'}
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="w-full">
                      <Link href="/tenant-request" onClick={() => setIsOpen(false)}>Request Tenant</Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/login" onClick={() => setIsOpen(false)}>{t('auth.login')}</Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/register" onClick={() => setIsOpen(false)}>{t('auth.get_started')}</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
