'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Truck, Bike, Car, Package } from 'lucide-react'

export function VendorHero() {
  const scrollToRegister = () => {
    document.getElementById('vendor-registration')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20 lg:py-28">
      {/* Background Video */}
      <div className="absolute inset-0 opacity-20">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        >
          <source src="/assets/videos/Vans-2220419522-640_adpp_is.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/5 px-4 py-1.5 text-primary">
            Delivery Services Partnership
          </Badge>
          
          <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Grow Your{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Delivery Business
            </span>{' '}
            With Afruheritage
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            Join our network of trusted delivery partners. Connect with freight forwarders and tenants 
            who need your services. Earn more, manage better, grow faster.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" onClick={scrollToRegister} className="min-w-48 gap-2">
              Register as Vendor
              <Package className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="min-w-48" asChild>
              <a href="#benefits">See Benefits</a>
            </Button>
          </div>

          {/* Vehicle Types */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-6 lg:gap-10">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Truck className="h-8 w-8" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Trucks</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Car className="h-8 w-8" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Cars</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Bike className="h-8 w-8" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Motorbikes</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="5.5" cy="17.5" r="3.5"/>
                  <circle cx="18.5" cy="17.5" r="3.5"/>
                  <path d="M15 6a1 1 0 100-2 1 1 0 000 2zm-3 11.5V14l-3-3 4-3 2 3h2"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-muted-foreground">Bicycles</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
