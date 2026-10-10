import { Store } from "lucide-react"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"

export function Marketplace({ theme }: { theme: TenantPublicTheme }) {
  return (
    <section id="marketplace" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: theme.primaryColor }}>
          Marketplace
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Fleet Vendor Marketplace</h2>
        <p className="mt-3 text-muted-foreground">
          Source vehicles, spare parts, fuel programs, and equipment from verified vendors.
        </p>
      </div>

      <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
        <span
          className="flex size-14 items-center justify-center rounded-full text-white"
          style={{ background: theme.primaryColor }}
        >
          <Store className="size-7" />
        </span>
        <h3 className="mt-5 text-xl font-semibold">Coming Soon</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          The vendor marketplace is under development and is not available yet.
          When it launches, verified vendors will be able to list vehicles, parts,
          and services directly on this storefront.
        </p>
      </div>
    </section>
  )
}
