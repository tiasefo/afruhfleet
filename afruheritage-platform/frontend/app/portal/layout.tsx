// AppShell is provided by the root layout.tsx — no duplicate wrapper needed here.
// Previously this rendered a second <AppShell>, causing the double-sidebar bug (P3.1).

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
