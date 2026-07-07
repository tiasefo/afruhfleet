"use client"

import { SiteHeader } from "@/components/amooksco-v2/site-header"
import { SiteFooter } from "@/components/amooksco-v2/site-footer"
import { PageHeader } from "@/components/amooksco-v2/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Ship, Truck, Package, Globe, Users, Award } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <PageHeader
          eyebrow="About Us"
          title="About AMOOKSCO Logistics"
          description="Your trusted partner for China to Ghana freight forwarding since 2020"
        />
        
        <div className="mx-auto max-w-7xl px-4 py-12">
          {/* Story Section */}
          <section className="mb-16">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h2 className="mb-4 text-2xl font-bold">Our Story</h2>
                <p className="mb-4 text-muted-foreground leading-relaxed">
                  AMOOKSCO Logistics was founded with a simple mission: to make freight forwarding between China and Ghana seamless, reliable, and affordable. We understand the challenges businesses face when importing goods from China - complex logistics, customs clearance, and unreliable shipping partners.
                </p>
                <p className="mb-4 text-muted-foreground leading-relaxed">
                  With years of experience in international logistics and deep knowledge of both Chinese and Ghanaian markets, we've built a network that ensures your goods arrive safely, on time, and at competitive rates.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Today, we're proud to serve hundreds of businesses across Ghana, helping them grow by providing dependable freight forwarding services that they can trust.
                </p>
              </div>
              <div className="flex items-center justify-center rounded-lg bg-muted p-8">
                <div className="text-center">
                  <Ship className="mx-auto mb-4 size-16 text-accent" />
                  <p className="text-4xl font-bold">5+</p>
                  <p className="text-muted-foreground">Years of Experience</p>
                </div>
              </div>
            </div>
          </section>

          {/* Mission & Vision */}
          <section className="mb-16">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="size-5 text-accent" />
                    Our Mission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    To provide exceptional freight forwarding services that connect businesses in Ghana with suppliers in China, making international trade accessible, transparent, and efficient for everyone.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="size-5 text-accent" />
                    Our Vision
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    To become the leading freight forwarding partner in West Africa, known for reliability, innovation, and customer-centric solutions that drive business growth.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Core Values */}
          <section className="mb-16">
            <h2 className="mb-8 text-center text-2xl font-bold">Our Core Values</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <Package className="mb-4 size-8 text-accent" />
                  <h3 className="mb-2 font-semibold">Reliability</h3>
                  <p className="text-sm text-muted-foreground">
                    We deliver on our promises, every time
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <Truck className="mb-4 size-8 text-accent" />
                  <h3 className="mb-2 font-semibold">Efficiency</h3>
                  <p className="text-sm text-muted-foreground">
                    Fast and streamlined logistics processes
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <Users className="mb-4 size-8 text-accent" />
                  <h3 className="mb-2 font-semibold">Customer Focus</h3>
                  <p className="text-sm text-muted-foreground">
                    Your success is our priority
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <Globe className="mb-4 size-8 text-accent" />
                  <h3 className="mb-2 font-semibold">Transparency</h3>
                  <p className="text-sm text-muted-foreground">
                    Clear communication and honest pricing
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Stats */}
          <section className="mb-16">
            <div className="rounded-lg bg-primary p-8 text-primary-foreground">
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-accent">500+</p>
                  <p className="mt-2 text-sm text-primary-foreground/80">Happy Clients</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-accent">10,000+</p>
                  <p className="mt-2 text-sm text-primary-foreground/80">Shipments Delivered</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-accent">99%</p>
                  <p className="mt-2 text-sm text-primary-foreground/80">On-Time Delivery</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-accent">24/7</p>
                  <p className="mt-2 text-sm text-primary-foreground/80">Customer Support</p>
                </div>
              </div>
            </div>
          </section>

          {/* Why Choose Us */}
          <section>
            <h2 className="mb-8 text-center text-2xl font-bold">Why Choose AMOOKSCO?</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex gap-4">
                <Badge className="mt-1" variant="secondary">
                  1
                </Badge>
                <div>
                  <h3 className="font-semibold">End-to-End Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time updates on your shipment status from China to Ghana
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Badge className="mt-1" variant="secondary">
                  2
                </Badge>
                <div>
                  <h3 className="font-semibold">Competitive Pricing</h3>
                  <p className="text-sm text-muted-foreground">
                    Transparent pricing with no hidden fees or surprises
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Badge className="mt-1" variant="secondary">
                  3
                </Badge>
                <div>
                  <h3 className="font-semibold">Customs Expertise</h3>
                  <p className="text-sm text-muted-foreground">
                    Smooth customs clearance with our experienced team
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Badge className="mt-1" variant="secondary">
                  4
                </Badge>
                <div>
                  <h3 className="font-semibold">Dedicated Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Personal assistance throughout your shipping journey
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
