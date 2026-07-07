import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { AdminShell } from "@/components/admin/admin-shell"

export const metadata: Metadata = {
  title: "AMOOKSCO Operations Console",
  description: "Internal operations console for AMOOKSCO Logistics staff.",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in?from=/admin")

  return (
    <AdminShell
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
    >
      {children}
    </AdminShell>
  )
}
