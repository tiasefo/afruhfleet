import { redirect } from 'next/navigation'

import { UserManagement } from '@/components/admin/user-management'
import { isAdmin } from '@/lib/auth'
import { getCurrentUserServer } from '@/lib/auth-server'
import { PageActionsBar } from '@/components/shared/page-actions-bar'

export default async function AdminUsersPage() {
  const user = await getCurrentUserServer()
  if (!user || !isAdmin(user)) {
    redirect('/login')
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageActionsBar backHref="/admin" backLabel="Back to Admin Dashboard" />
      <h1 className="text-3xl font-bold">User Directory</h1>
      <p className="mt-2 text-gray-600">Manage tenant users, role assignment, and access status.</p>
      <UserManagement tenantId={user.tenantId} />
    </div>
  )
}
