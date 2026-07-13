"use client"

import { useState } from "react"
import Link from "next/link"
import { useTenant } from "@/components/tenant-context-provider"
import { TrackShipment } from "./track-shipment"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"

export function GenericStorefront() {
  const { tenant } = useTenant()
  const companyName = tenant.company_name || "Afruheritage"
  const logoUrl = tenant.logo_url || "/favicon.ico"
  const supportEmail = tenant.support_email || "support@afruheritage.com"
  const supportPhone = tenant.support_phone || ""

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader
        companyName={companyName}
        logoUrl={logoUrl}
        primaryColor={tenant.primary_color}
      />
      <main className="flex-1">
        {/* Hero */}
        <section
          className="relative overflow-hidden px-4 py-20 text-white"
          style={{ background: `linear-gradient(135deg, ${tenant.primary_color}, ${tenant.primary_color}dd)` }}
        >
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {companyName}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
              Professional logistics and freight forwarding services.
              Track your shipments in real-time and manage your cargo with ease.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/login"
                className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-lg transition hover:bg-gray-100"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Create Account
              </Link>
            </div>
          </div>
        </section>

        {/* Track Shipment */}
        {tenant.public_tracking_enabled && (
          <section className="mx-auto -mt-12 max-w-3xl px-4">
            <TrackShipment primaryColor={tenant.primary_color} />
          </section>
        )}

        {/* Services */}
        <section className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Our Services
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-gray-500">
            Comprehensive logistics solutions tailored to your needs
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <ServiceCard
              title="Freight Forwarding"
              description="Air, sea, and land freight forwarding with global coverage and competitive rates."
              icon="container"
            />
            <ServiceCard
              title="Shipment Tracking"
              description="Real-time tracking for all your shipments with automated status updates."
              icon="track"
            />
            <ServiceCard
              title="Cargo Management"
              description="Comprehensive cargo management including storage, packaging, and distribution."
              icon="cargo"
            />
            <ServiceCard
              title="Customs Clearance"
              description="Expert customs clearance services to ensure smooth international trade."
              icon="customs"
            />
            <ServiceCard
              title="Group Shipments"
              description="Group your shipments together for cost-effective consolidated shipping."
              icon="group"
            />
            <ServiceCard
              title="Online Payments"
              description="Secure online payment system for invoices, storage fees, and shipping costs."
              icon="payment"
            />
          </div>
        </section>

        {/* CTA */}
        <section
          className="px-4 py-16 text-center text-white"
          style={{ backgroundColor: tenant.primary_color }}
        >
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Create an account today and start managing your shipments with {companyName}.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-block rounded-lg bg-white px-8 py-3 text-sm font-semibold text-gray-900 shadow-lg transition hover:bg-gray-100"
          >
            Create Free Account
          </Link>
        </section>
      </main>

      <SiteFooter
        companyName={companyName}
        supportEmail={supportEmail}
        supportPhone={supportPhone}
        legalFooterText={tenant.legal_footer_text}
        primaryColor={tenant.primary_color}
      />
    </div>
  )
}

function ServiceCard({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: string
}) {
  const icons: Record<string, string> = {
    container: "📦",
    track: "📍",
    cargo: "🚢",
    customs: "📋",
    group: "👥",
    payment: "💳",
  }
  return (
    <div className="rounded-xl border border-gray-200 p-6 transition hover:shadow-lg">
      <div className="mb-4 text-3xl">{icons[icon] || "✦"}</div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  )
}
