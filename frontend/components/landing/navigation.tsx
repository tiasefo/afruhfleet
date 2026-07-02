'use client'


import { useState, useEffect } from 'react'
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
import { getCurrentUser, isAdmin, isCustomer } from '@/lib/auth'
import { TenantLogo } from '@/components/tenant-logo'
import { useTenant } from '@/components/tenant-context-provider'

const navLinks = [
  { 
    label: 'Solutions', 
    href: '/solutions',
    submenu: [
      { label: 'Shipment Tracking', href: '/track' },
      { label: 'Freight Management', href: '/solutions/freight-management' },
      { label: 'Customs Clearance', href: '/solutions/customs-clearance' },
      { label: 'Warehouse Services', href: '/solutions/warehouse-services' },
    ]
  },
  { 
    label: 'Platform', 
    href: '/platform',
    submenu: [
      { label: 'AI Assistant', href: '/platform/ai-assistant' },
      { label: 'Real-time Tracking', href: '/track' },
      { label: 'Document Management', href: '/platform/document-management' },
      { label: 'API Integration', href: '/platform/api-integration' },
    ]
  },
  { label: 'For Vendors', href: '/vendors' },
  { label: 'About Us', href: '/about' },
  { label: 'Support', href: '/support' },
  { label: 'Pricing', href: '/pricing' },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [language, setLanguage] = useState<'en' | 'zh'>('en')
  const router = useRouter()
  const tenant = useTenant()

  const supportedLanguages = tenant?.supported_languages || ['en', 'zh']

  // Determine user role for navigation
  const [userRole, setUserRole] = useState<string | null>(null)
  useEffect(() => {
    try {
      const user = getCurrentUser()
      if (user) setUserRole(user.role)
      else setUserRole(null)
    } catch {
      setUserRole(null)
    }
  }, [])

  const handleLogout = () => {
    document.cookie = 'afruheritage_access_token=; Max-Age=0; path=/; SameSite=Lax'
    document.cookie = 'afruheritage_user=; Max-Age=0; path=/; SameSite=Lax'
    setUserRole(null)
    setIsOpen(false)
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <TenantLogo href="/" />

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

          {userRole === 'admin' && (
            <Button asChild>
              <Link href="/admin">Admin Dashboard</Link>
            </Button>
          )}
          {userRole === 'customer' && (
            <Button asChild>
              <Link href="/customer">Customer Dashboard</Link>
            </Button>
          )}
          {userRole && (
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          )}
          {!userRole && (
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
              <TenantLogo href="/" />
              
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
                {userRole ? (
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
