'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Play, Ship, Plane, Truck, Globe2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export function HeroSection() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Background Video/Image - Desktop Hero */}
      {!isMobile && (
        <div className="absolute inset-0 -z-10">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover opacity-20"
          >
            <source src="/assets/videos/istockphoto-945121252-640_adpp_is.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-background/30" />
        </div>
      )}

      {/* Background Pattern - Fallback */}
      {isMobile && (
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/5 blur-[100px]" />
          <div className="absolute right-1/4 top-1/3 -z-10 h-[200px] w-[200px] rounded-full bg-accent/10 blur-[80px]" />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Content */}
          <div className="flex flex-col items-start">
            <Badge variant="secondary" className="mb-6 gap-2 border-accent/20 bg-accent/10 px-3 py-1.5 text-accent-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
              </span>
              Now serving Ghana, Nigeria, and China trade routes
            </Badge>

            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              The Future of{' '}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                African Freight
              </span>{' '}
              is Here
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              AI-powered logistics platform built for Africa. Track shipments in real-time, 
              manage customs clearance, and scale your freight business with intelligent automation.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button size="lg" asChild className="gap-2">
                <Link href="/login">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2" asChild>
                <Link href="#how-it-works">
                  <Play className="h-4 w-4" />
                  Watch Demo
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  <strong className="text-foreground">500+</strong> freight forwarders trust us
                </span>
              </div>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="text-accent">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                <span><strong className="text-foreground">4.9/5</strong> customer rating</span>
              </div>
            </div>
          </div>

          {/* Right Visual - Shipping Routes Animation or Video */}
          <div className="relative hidden lg:block">
            <div className="relative aspect-square rounded-2xl border bg-card/50 p-8 shadow-xl backdrop-blur overflow-hidden">
              {/* Desktop: Show animated globe */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-64 w-64">
                  {/* Center Globe */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Globe2 className="h-32 w-32 text-primary/20" strokeWidth={0.5} />
                  </div>
                  
                  {/* Orbiting Icons */}
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                        <Ship className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }}>
                    <div className="absolute -right-4 top-1/2 -translate-y-1/2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg">
                        <Plane className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: '30s' }}>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-3 text-primary-foreground shadow-lg">
                        <Truck className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="absolute -left-4 top-8 rounded-lg border bg-card p-3 shadow-lg">
                <div className="text-xs text-muted-foreground">Active Shipments</div>
                <div className="text-2xl font-bold text-primary">12,847</div>
              </div>
              
              <div className="absolute -right-4 top-1/3 rounded-lg border bg-card p-3 shadow-lg">
                <div className="text-xs text-muted-foreground">Countries</div>
                <div className="text-2xl font-bold text-foreground">45+</div>
              </div>
              
              <div className="absolute -left-4 bottom-12 rounded-lg border bg-card p-3 shadow-lg">
                <div className="text-xs text-muted-foreground">On-time Rate</div>
                <div className="text-2xl font-bold text-chart-4">98.5%</div>
              </div>
              
              <div className="absolute -right-4 bottom-8 rounded-lg border bg-card p-3 shadow-lg">
                <div className="text-xs text-muted-foreground">AI Responses</div>
                <div className="text-2xl font-bold text-accent">24/7</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
