'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Shield, Plus, Trash2, User as UserIcon, Key, Lock } from 'lucide-react'

interface Permission {
  id: string
  name: string
  display_name: string
  description: string | null
  resource_type: string
  permission_type: string
  created_at: string
}

interface Role {
  id: string
  name: string
  display_name: string
  description: string | null
  is_system_role: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

interface UserRole {
  id: string
  user_id: string
  role_id: string
  assigned_at: string
  expires_at: string | null
  is_active: boolean
}

export default function RBACPage() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('permissions')

  // Dialog states
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [showUserRoleDialog, setShowUserRoleDialog] = useState(false)

  // Form states
  const [newPermission, setNewPermission] = useState({
    name: '',
    display_name: '',
    description: '',
    resource_type: 'tenants',
    permission_type: 'read',
  })

  const [newRole, setNewRole] = useState({
    name: '',
    display_name: '',
    description: '',
    is_system_role: false,
  })

  const [newUserRole, setNewUserRole] = useState({
    user_id: '',
    role_id: '',
  })

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const headers = { Authorization: `Bearer ${token}` }

      if (activeTab === 'permissions') {
        const res = await fetch('/api/v1/rbac/permissions', { headers })
        if (res.ok) setPermissions(await res.json())
      } else if (activeTab === 'roles') {
        const res = await fetch('/api/v1/rbac/roles', { headers })
        if (res.ok) setRoles(await res.json())
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPermission = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch('/api/v1/rbac/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPermission),
      })
      if (res.ok) {
        setShowPermissionDialog(false)
        setNewPermission({ name: '', display_name: '', description: '', resource_type: 'tenants', permission_type: 'read' })
        loadData()
      }
    } catch (error) {
      console.error('Failed to create permission:', error)
    }
  }

  const createRole = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch('/api/v1/rbac/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newRole),
      })
      if (res.ok) {
        setShowRoleDialog(false)
        setNewRole({ name: '', display_name: '', description: '', is_system_role: false })
        loadData()
      }
    } catch (error) {
      console.error('Failed to create role:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">RBAC Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage permissions, roles, and user access control.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="user-roles">User Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Permissions</h2>
            </div>
            <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Permission
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Permission</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="perm-name">Name</Label>
                    <Input
                      id="perm-name"
                      value={newPermission.name}
                      onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
                      placeholder="e.g., tenants.read"
                    />
                  </div>
                  <div>
                    <Label htmlFor="perm-display">Display Name</Label>
                    <Input
                      id="perm-display"
                      value={newPermission.display_name}
                      onChange={(e) => setNewPermission({ ...newPermission, display_name: e.target.value })}
                      placeholder="e.g., View Tenants"
                    />
                  </div>
                  <div>
                    <Label htmlFor="perm-desc">Description</Label>
                    <Textarea
                      id="perm-desc"
                      value={newPermission.description}
                      onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
                      placeholder="Permission description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="perm-resource">Resource Type</Label>
                      <Select
                        value={newPermission.resource_type}
                        onValueChange={(v) => setNewPermission({ ...newPermission, resource_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tenants">Tenants</SelectItem>
                          <SelectItem value="users">Users</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="tracking">Tracking</SelectItem>
                          <SelectItem value="tickets">Tickets</SelectItem>
                          <SelectItem value="analytics">Analytics</SelectItem>
                          <SelectItem value="settings">Settings</SelectItem>
                          <SelectItem value="crm">CRM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="perm-type">Permission Type</Label>
                      <Select
                        value={newPermission.permission_type}
                        onValueChange={(v) => setNewPermission({ ...newPermission, permission_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="read">Read</SelectItem>
                          <SelectItem value="write">Write</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={createPermission} className="w-full">
                    Create Permission
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : permissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No permissions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    permissions.map((perm) => (
                      <TableRow key={perm.id}>
                        <TableCell className="font-mono text-sm">{perm.name}</TableCell>
                        <TableCell>{perm.display_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{perm.resource_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={perm.permission_type === 'admin' ? 'destructive' : 'secondary'}>
                            {perm.permission_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(perm.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Roles</h2>
            </div>
            <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Role</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="role-name">Name</Label>
                    <Input
                      id="role-name"
                      value={newRole.name}
                      onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                      placeholder="e.g., warehouse_manager"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role-display">Display Name</Label>
                    <Input
                      id="role-display"
                      value={newRole.display_name}
                      onChange={(e) => setNewRole({ ...newRole, display_name: e.target.value })}
                      placeholder="e.g., Warehouse Manager"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role-desc">Description</Label>
                    <Textarea
                      id="role-desc"
                      value={newRole.description}
                      onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                      placeholder="Role description"
                    />
                  </div>
                  <Button onClick={createRole} className="w-full">
                    Create Role
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>System Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No roles found
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-mono text-sm">{role.name}</TableCell>
                        <TableCell>{role.display_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {role.description || '-'}
                        </TableCell>
                        <TableCell>
                          {role.is_system_role ? (
                            <Badge variant="secondary">System</Badge>
                          ) : (
                            <Badge variant="outline">Custom</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={role.is_active ? 'default' : 'secondary'}>
                            {role.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(role.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-roles" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">User Role Assignments</h2>
            </div>
            <Dialog open={showUserRoleDialog} onOpenChange={setShowUserRoleDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Role to User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="user-id">User ID</Label>
                    <Input
                      id="user-id"
                      value={newUserRole.user_id}
                      onChange={(e) => setNewUserRole({ ...newUserRole, user_id: e.target.value })}
                      placeholder="Enter user UUID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role-select">Role</Label>
                    <Select
                      value={newUserRole.role_id}
                      onValueChange={(v) => setNewUserRole({ ...newUserRole, role_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">Assign Role</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>User role assignments management</p>
                <p className="text-sm mt-2">Assign roles to users to control their access permissions.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
