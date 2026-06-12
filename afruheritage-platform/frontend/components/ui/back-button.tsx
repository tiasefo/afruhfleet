'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from './button'

interface BackButtonProps {
  href?: string
  label?: string
}

export function BackButton({ href = '/', label = 'Back' }: BackButtonProps) {
  return (
    <Link href={href}>
      <Button variant="ghost" size="sm" className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Button>
    </Link>
  )
}
