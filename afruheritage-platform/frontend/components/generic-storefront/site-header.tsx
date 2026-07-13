"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"

export function SiteHeader({
  companyName,
  logoUrl,
  primaryColor,
}: {
  companyName: string
  logoUrl: string
  primaryColor: string
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={`${companyName} logo`}
              width={36}
              height={36}
              className="rounded"
            />
          )}
          <span className="text-lg font-bold text-gray-900">{companyName}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/track" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Track
          </Link>
          <Link href="/customs" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Customs Calculator
          </Link>
          <Link href="/support" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Support
          </Link>
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Sign In
          </Link>
        </nav>

        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="border-t border-gray-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link href="/track" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Track Shipment
            </Link>
            <Link href="/customs" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Customs Calculator
            </Link>
            <Link href="/support" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Support
            </Link>
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Sign In
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
