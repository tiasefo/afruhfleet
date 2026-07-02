import { UserManagement } from '@/components/admin/user-management'
import { getCurrentUserServer } from '@/lib/auth-server'

export default async function AdminUsersPage() {
  const user = await getCurrentUserServer()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">User Directory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage tenant users, role assignment, and access status.
        </p>
      </div>
      <UserManagement tenantId={user?.tenantId} />
    </div>
  )
}
