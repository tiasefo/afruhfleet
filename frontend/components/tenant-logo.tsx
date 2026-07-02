import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTenant } from '@/components/tenant-context-provider'

interface TenantLogoProps {
  className?: string
  href?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function TenantLogo({ className = '', href = '/', showText = true, size = 'md' }: TenantLogoProps) {
  const tenant = useTenant()

  const dimensions = {
    sm: { box: 'h-7 w-7', text: 'text-base', icon: 'text-sm' },
    md: { box: 'h-9 w-9', text: 'text-xl', icon: 'text-lg' },
    lg: { box: 'h-12 w-12', text: 'text-2xl', icon: 'text-xl' },
  }

  const dim = dimensions[size]
  const companyName = tenant?.company_name || 'Afruheritage'
  const logoUrl = tenant?.theme?.logo_url
  const initial = companyName.charAt(0).toUpperCase()

  const content = (
    <>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={companyName}
          width={36}
          height={36}
          className={`${dim.box} rounded-lg object-contain`}
        />
      ) : (
        <div className={`flex ${dim.box} items-center justify-center rounded-lg bg-primary`}>
          <span className={`${dim.icon} font-bold text-primary-foreground`}>{initial}</span>
        </div>
      )}
      {showText && (
        <span className={`${dim.text} font-semibold tracking-tight text-foreground`}>
          {companyName}
        </span>
      )}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={`flex items-center gap-2 ${className}`}>
        {content}
      </Link>
    )
  }

  return <div className={`flex items-center gap-2 ${className}`}>{content}</div>
}
