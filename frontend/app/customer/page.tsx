import { isCustomer } from '@/lib/auth'
import { getCurrentUserServer } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { CustomerDashboard } from '@/components/customer/customer-dashboard'
import { PageActionsBar } from '@/components/shared/page-actions-bar'

export default async function CustomerDashboardPage() {
  const user = await getCurrentUserServer()
  if (!user || !isCustomer(user)) {
    redirect('/login')
  }
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageActionsBar backHref="/" backLabel="Back to Home" />
      <h1 className="text-3xl font-bold mb-1">Customer Dashboard</h1>
      <p className="text-gray-500 mb-2">Welcome back, {user.fullName}! Track shipments, submit KYC, and manage support from one place.</p>
      <CustomerDashboard tenantId={user.tenantId} />
    </div>
  )
}
