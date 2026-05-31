'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, MessageSquare, Phone } from 'lucide-react'
import Link from 'next/link'

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-primary py-20 sm:py-28">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-primary-foreground/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl">
            Ready to transform your freight operations?
          </h2>
          <p className="mt-6 text-pretty text-lg text-primary-foreground/80">
            Join 500+ freight forwarders who have modernized their business with Afruheritage. 
            Start your free trial today - no credit card required.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="w-full gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90 sm:w-auto"
            >
              <Link href="/login">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full gap-2 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto"
            >
              <Link href="/support">
                <MessageSquare className="h-4 w-4" />
                Contact Sales
              </Link>
            </Button>
          </div>

          {/* Contact Options */}
          <div className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
            <a
              href="mailto:support@afruheritage.com"
              className="flex items-center gap-2 text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
            >
              <MessageSquare className="h-4 w-4" />
              support@afruheritage.com
            </a>
            <a
              href="tel:+233000000000"
              className="flex items-center gap-2 text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
            >
              <Phone className="h-4 w-4" />
              +233 (0) 00 000 0000
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
