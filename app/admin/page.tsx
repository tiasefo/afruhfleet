
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard'

export default function AdminDashboardPage() {
  const user = getCurrentUser()
  if (!user || !isAdmin(user)) {
    redirect('/login')
  }
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p>Welcome, {user.fullName}! You have admin access.</p>
      <AnalyticsDashboard />
    </div>
  )
}
