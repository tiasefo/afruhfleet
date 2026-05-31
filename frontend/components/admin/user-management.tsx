"use client"

import { useEffect, useState } from "react"
import { getApiBaseUrl, getCookie, joinApiUrl } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface TenantUser {
  id: string
  email: string
  full_name: string
  tenant_id?: string | null
  is_tenant_admin: boolean
  is_active: boolean
  created_at: string
}

interface TenantUserAudit {
  id: string
  actor_email: string
  event_type: string
  entity_type: string
  entity_id: string
  details_json: string
  created_at: string
}

interface UserManagementProps {
  tenantId?: string | null
}

export function UserManagement({ tenantId }: UserManagementProps) {
  const [users, setUsers] = useState<TenantUser[]>([])
  const [auditEvents, setAuditEvents] = useState<TenantUserAudit[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [sendInviteEmail, setSendInviteEmail] = useState(true)
  const [isTenantAdmin, setIsTenantAdmin] = useState(false)

  const apiBaseUrl = getApiBaseUrl()

  const buildAuthHeaders = (): Record<string, string> => {
    const token = getCookie("afruheritage_access_token")
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  const loadUsers = async () => {
    setLoading(true)
    setError("")
    try {
      if (!apiBaseUrl) throw new Error("API base URL missing")
      const query = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : ""
      const res = await fetch(joinApiUrl(apiBaseUrl, `/users${query}`), { headers: buildAuthHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || "Failed to load users")
      setUsers(Array.isArray(data) ? data : [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const loadAudit = async () => {
    setError("")
    try {
      if (!apiBaseUrl) throw new Error("API base URL missing")
      const query = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}&limit=40` : "?limit=40"
      const res = await fetch(joinApiUrl(apiBaseUrl, `/users/audit${query}`), { headers: buildAuthHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || "Failed to load audit events")
      setAuditEvents(Array.isArray(data) ? data : [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load audit events")
    }
  }

  useEffect(() => {
    void loadUsers()
    void loadAudit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseUrl, tenantId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      if (!apiBaseUrl) throw new Error("API base URL missing")
      const res = await fetch(joinApiUrl(apiBaseUrl, "/users"), {
        method: "POST",
        headers: {
          ...buildAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password: sendInviteEmail ? undefined : password,
          send_invite_email: sendInviteEmail,
          is_tenant_admin: isTenantAdmin,
          tenant_id: tenantId || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || "Failed to create user")
      setFullName("")
      setEmail("")
      setPassword("")
      setSendInviteEmail(true)
      setIsTenantAdmin(false)
      await loadUsers()
      await loadAudit()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create user")
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (id: string, active: boolean) => {
    setSaving(true)
    setError("")
    try {
      if (!apiBaseUrl) throw new Error("API base URL missing")
      const query = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : ""
      const res = await fetch(joinApiUrl(apiBaseUrl, `/users/${id}/status${query}`), {
        method: "PATCH",
        headers: {
          ...buildAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: active }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || "Failed to update status")
      await loadUsers()
      await loadAudit()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update status")
    } finally {
      setSaving(false)
    }
  }

  const updateRole = async (id: string, adminRole: boolean) => {
    setSaving(true)
    setError("")
    try {
      if (!apiBaseUrl) throw new Error("API base URL missing")
      const query = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : ""
      const res = await fetch(joinApiUrl(apiBaseUrl, `/users/${id}/role${query}`), {
        method: "PATCH",
        headers: {
          ...buildAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_tenant_admin: adminRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || "Failed to update role")
      await loadUsers()
      await loadAudit()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update role")
    } finally {
      setSaving(false)
    }
  }

  const sendResetLink = async (id: string) => {
    setSaving(true)
    setError("")
    try {
      if (!apiBaseUrl) throw new Error("API base URL missing")
      const query = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : ""
      const res = await fetch(joinApiUrl(apiBaseUrl, `/users/${id}/send-reset-link${query}`), {
        method: "POST",
        headers: buildAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || "Failed to send reset link")
      await loadAudit()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset link")
    } finally {
      setSaving(false)
    }
  }

  const deleteUser = async (id: string) => {
    setSaving(true)
    setError("")
    try {
      if (!apiBaseUrl) throw new Error("API base URL missing")
      const query = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : ""
      const res = await fetch(joinApiUrl(apiBaseUrl, `/users/${id}${query}`), {
        method: "DELETE",
        headers: buildAuthHeaders(),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.detail || "Failed to delete user")
      }
      await loadUsers()
      await loadAudit()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete user")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Tenant User Directory</h2>
        <p className="mt-1 text-sm text-gray-500">Create users and control active/suspended access for your tenant.</p>

        <form onSubmit={handleCreate} className="mt-4 grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={saving}
          />
          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={saving}
          />
          <Input
            placeholder="Temporary password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required={!sendInviteEmail}
            disabled={saving}
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={sendInviteEmail}
              onChange={(e) => setSendInviteEmail(e.target.checked)}
              disabled={saving}
            />
            Send invite email (user sets password via link)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isTenantAdmin}
              onChange={(e) => setIsTenantAdmin(e.target.checked)}
              disabled={saving}
            />
            Grant tenant admin role
          </label>
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Create User"}</Button>
          </div>
        </form>

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Users</h3>
        {loading ? (
          <div className="mt-3 text-sm text-gray-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="mt-3 text-sm text-gray-500">No users found for this tenant.</div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-3">Name</th>
                  <th className="pb-2 pr-3">Email</th>
                  <th className="pb-2 pr-3">Role</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">{user.full_name}</td>
                    <td className="py-2 pr-3">{user.email}</td>
                    <td className="py-2 pr-3">{user.is_tenant_admin ? "Tenant Admin" : "Member"}</td>
                    <td className="py-2 pr-3">{user.is_active ? "Active" : "Suspended"}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-2">
                        {user.is_active ? (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(user.id, false)} disabled={saving}>
                            Suspend
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(user.id, true)} disabled={saving}>
                            Activate
                          </Button>
                        )}
                        {user.is_tenant_admin ? (
                          <Button size="sm" variant="outline" onClick={() => updateRole(user.id, false)} disabled={saving}>
                            Make Member
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => updateRole(user.id, true)} disabled={saving}>
                            Make Admin
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => deleteUser(user.id)} disabled={saving}>
                          Delete
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => sendResetLink(user.id)} disabled={saving}>
                          Send Reset Link
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">User Management Audit Trail</h3>
        {auditEvents.length === 0 ? (
          <div className="mt-3 text-sm text-gray-500">No audit events recorded yet.</div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-3">When</th>
                  <th className="pb-2 pr-3">Actor</th>
                  <th className="pb-2 pr-3">Event</th>
                  <th className="pb-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {auditEvents.map((event) => (
                  <tr key={event.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 text-gray-600">{new Date(event.created_at).toLocaleString()}</td>
                    <td className="py-2 pr-3">{event.actor_email}</td>
                    <td className="py-2 pr-3">{event.event_type.replace(/_/g, " ")}</td>
                    <td className="py-2 font-mono text-xs text-gray-600">{event.details_json}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
