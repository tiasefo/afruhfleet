'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, RefreshCw, Search, Shield, UserCog } from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  tenant_id?: string
  is_tenant_admin: boolean
  is_superuser: boolean
  is_active: boolean
  onboarding_complete: boolean
  created_at: string
  roles: string[]
  permissions: string[]
}

interface Role {
  id: string
  name: string
  display_name: string
  description?: string
  is_system_role: boolean
  is_active: boolean
  permissions: string[]
}

interface Permission {
  id: string
  name: string
  display_name: string
  description?: string
  resource_type: string
  permission_type: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'admin',
  })

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await api.get<User[]>('/sentinel/users/')
      setUsers(Array.isArray(data) ? data : [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load admin users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreate = async () => {
    setCreating(true)
    try {
      await api.post('/sentinel/auth/users', form)
      toast.success('Admin user created')
      setCreateOpen(false)
      setForm({ email: '', full_name: '', password: '', role: 'admin' })
      loadUsers()
    } catch (e: any) {
      toast.error(e.message || 'Failed to create admin user')
    } finally {
      setCreating(false)
    }
  }

  const filtered = users.filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.email.toLowerCase().includes(q) ||
      u.full_name.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    )
  })

  const roleBadge = (role: string) => {
    if (role === 'super_admin') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    if (role === 'admin') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Users</h1>
          <p className="mt-1 text-muted-foreground">Manage console users and access roles</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Admin User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Admin User</DialogTitle>
              <DialogDescription>Add a new user to the admin console</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="ops@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Minimum 12 characters"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={
                  creating ||
                  !form.full_name ||
                  !form.email ||
                  !form.password ||
                  form.password.length < 12
                }
              >
                {creating ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={loadUsers}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">No admin users found</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <Card key={u.id}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <UserCog className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{u.full_name}</div>
                    <div className="text-sm text-muted-foreground">{u.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={roleBadge(u.role)}>
                    <Shield className="mr-1 h-3.5 w-3.5" />
                    {u.role}
                  </Badge>
                  {!u.is_active && <Badge variant="outline">inactive</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
