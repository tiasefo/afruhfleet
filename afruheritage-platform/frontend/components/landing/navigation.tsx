'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Globe, ChevronDown, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth'
import { useTenant } from '@/components/tenant-context-provider'

const navLinks = [
  {
    label: 'Solutions',
    href: '/customs',
    submenu: [
      { label: 'Shipment Tracking', href: '/track' },
      { label: 'Freight Management', href: '/fleetbase/console' },
      { label: 'Customs Clearance', href: '/customs' },
      { label: 'Duty Calculator', href: '/customs/duty-calculator' },
      { label: 'Storefront Templates', href: '/templates' },
    ]
  },
  {
    label: 'Locations',
    href: '/locations/ghana',
    submenu: [
      { label: 'Ghana', href: '/locations/ghana' },
      { label: 'Kenya', href: '/locations/kenya' },
      { label: 'Somalia', href: '/locations/somalia' },
      { label: 'Djibouti', href: '/locations/djibouti' },
      { label: 'Nigeria', href: '/locations/nigeria' },
      { label: 'China', href: '/locations/china' },
    ]
  },
  {
    label: 'Platform',
    href: '/dashboard',
    submenu: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Real-time Tracking', href: '/track' },
      { label: 'Documentation', href: '/docs' },
      { label: 'Fleet Console', href: '/fleetbase/console' },
    ]
  },
  { label: 'For Vendors', href: '/vendors' },
  { label: 'Support', href: '/support' },
  { label: 'Pricing', href: '/pricing' },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [language, setLanguage] = useState<'en' | 'zh'>('en')
  const router = useRouter()
  const { user, logout } = useAuth()
  const { tenant } = useTenant()

  const handleLogout = () => {
    logout()
    setIsOpen(false)
    router.push('/login')
    router.refresh()
  }

  const companyName = tenant.company_name
  const logoLetter = companyName.charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">{logoLetter}</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-foreground">
            {companyName}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            link.submenu ? (
              <DropdownMenu key={link.label}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-1 text-muted-foreground hover:text-foreground">
                    {link.label}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
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
            )
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 lg:flex">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <Globe className="h-4 w-4" />
                {language === 'en' ? 'EN' : '中文'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('en')}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('zh')}>
                中文
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user?.is_superuser && (
            <Button asChild>
              <Link href="/admin">Admin Dashboard</Link>
            </Button>
          )}
          {user && !user.is_superuser && (
            <Button asChild>
              <Link href="/dashboard">Customer Dashboard</Link>
            </Button>
          )}
          {user && (
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          )}
          {!user && (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/login">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
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
                  <span className="text-lg font-bold text-primary-foreground">{logoLetter}</span>
                </div>
                <span className="text-xl font-semibold">{companyName}</span>
              </Link>

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

              <div className="flex flex-col gap-2 pt-4 border-t">
                <Button variant="outline" className="w-full justify-center gap-2" onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}>
                  <Globe className="h-4 w-4" />
                  {language === 'en' ? 'Switch to 中文' : 'Switch to English'}
                </Button>
                {user ? (
                  <Button variant="outline" className="w-full justify-center gap-2" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/login" onClick={() => setIsOpen(false)}>Sign In</Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/login" onClick={() => setIsOpen(false)}>Get Started</Link>
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
