
import { isAdmin } from '@/lib/auth'
import { getCurrentUserServer } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard'
import Link from 'next/link'
import { PageActionsBar } from '@/components/shared/page-actions-bar'

export default async function AdminDashboardPage() {
  const user = await getCurrentUserServer()
  if (!user || !isAdmin(user)) {
    redirect('/login')
  }
  return (
    <div className="p-8">
      <PageActionsBar backHref="/" backLabel="Back to Home" />
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p>Welcome, {user.fullName}! You have admin access.</p>
      <div className="mt-3">
        <Link href="/reports/feature-parity" className="text-sm text-blue-600 hover:underline">
          Open feature parity deep-dive report →
        </Link>
      </div>
      <div className="mt-2">
        <Link href="/admin/users" className="text-sm text-blue-600 hover:underline">
          Open tenant user directory →
        </Link>
      </div>
      <AnalyticsDashboard />
    </div>
  )
}
