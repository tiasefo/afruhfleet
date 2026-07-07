"use client"

import { useMemo, useState } from "react"
import { Search, UserPlus, MoreHorizontal, Shield, Mail } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  staff as seedStaff,
  members as seedMembers,
  roleLabels,
  type Staff,
  type StaffRole,
} from "@/lib/admin-data"

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function statusBadge(status: string) {
  if (status === "active") return "bg-chart-5/15 text-chart-5"
  if (status === "invited") return "bg-accent/20 text-accent-foreground"
  return "bg-destructive/15 text-destructive"
}

export function UserManagement() {
  const [staff, setStaff] = useState<Staff[]>(seedStaff)
  const [query, setQuery] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<StaffRole>("customer_support")

  const filteredStaff = useMemo(() => {
    const q = query.toLowerCase()
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    )
  }, [staff, query])

  const filteredMembers = useMemo(() => {
    const q = query.toLowerCase()
    return seedMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.mark.toLowerCase().includes(q) ||
        m.phone.includes(q),
    )
  }, [query])

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteName || !inviteEmail) {
      toast.error("Enter a name and email to send an invite.")
      return
    }
    setStaff((prev) => [
      {
        id: `u${prev.length + 1}-${Date.now()}`,
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        status: "invited",
      },
      ...prev,
    ])
    toast.success(`Invitation sent to ${inviteName}.`)
    setInviteName("")
    setInviteEmail("")
    setInviteRole("customer_support")
  }

  function changeRole(id: string, role: StaffRole) {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, role } : s)))
    toast.success("Role updated.")
  }

  function toggleSuspend(id: string) {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "suspended" ? "active" : "suspended" }
          : s,
      ),
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage staff roles and permissions, and review registered members.
        </p>
      </div>

      {/* Invite staff */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <UserPlus className="h-4 w-4 text-primary" />
            Invite a staff member
          </h2>
          <form
            onSubmit={handleInvite}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
          >
            <div className="grid gap-1.5">
              <Label htmlFor="invite-name">Full name</Label>
              <Input
                id="invite-name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="e.g. Priscilla Owusu"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@amooksco.com"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as StaffRole)}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue>
                    {(v: string) => roleLabels[v as StaffRole] ?? v}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="gap-2">
              <Mail className="h-4 w-4" />
              Send invite
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, mark or phone"
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="staff">
        <TabsList>
          <TabsTrigger value="staff">Staff ({filteredStaff.length})</TabsTrigger>
          <TabsTrigger value="members">
            Members ({filteredMembers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {initials(s.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium">{s.name}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {s.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={s.role}
                            onValueChange={(v) => changeRole(s.id, v as StaffRole)}
                            disabled={s.role === "tenant_owner"}
                          >
                            <SelectTrigger className="h-8 w-[180px]">
                              <SelectValue>
                                {(v: string) => roleLabels[v as StaffRole] ?? v}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(roleLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusBadge(s.status)}>
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Actions for ${s.name}`}
                                />
                              }
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => toast.info(`Permissions for ${s.name}`)}
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                View permissions
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                disabled={s.role === "tenant_owner"}
                                onClick={() => toggleSuspend(s.id)}
                              >
                                {s.status === "suspended"
                                  ? "Reactivate account"
                                  : "Suspend account"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Shipping mark</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Goods</TableHead>
                      <TableHead className="text-right">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell>
                          <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                            {m.mark}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{m.phone}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {m.goods}
                        </TableCell>
                        <TableCell className="text-right text-sm">{m.joined}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
