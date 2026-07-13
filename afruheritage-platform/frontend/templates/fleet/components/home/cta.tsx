import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"

export function CTA({ theme }: { theme: TenantPublicTheme }) {
  return (
    <section style={{ background: theme.primaryColor }}>
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-white sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to manage your fleet?
        </h2>
        <p className="mx-auto mt-3 max-w-xl opacity-80">
          Create an account to manage routes, track vehicles, access the vendor marketplace,
          and run your entire transport operation from one dashboard.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: theme.accentColor, color: theme.primaryColor }}
          >
            Create Free Account <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Staff Login
          </Link>
        </div>
      </div>
    </section>
  )
}
