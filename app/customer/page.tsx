import { getCurrentUser, isCustomer } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default function CustomerDashboardPage() {
  const user = getCurrentUser()
  if (!user || !isCustomer(user)) {
    redirect('/login')
  }
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Customer Dashboard</h1>
      <p>Welcome, {user.fullName}! You have customer access.</p>
      {/* Add customer-only features here */}
    </div>
  )
}
