import Link from "next/link"
import { Package, Users, FileText, Bell, ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { stats, cargo } from "@/lib/admin-data"

const cards = [
  { label: "Cargo records", value: stats.cargoRecords.toLocaleString(), icon: Package, href: "/admin/shipments" },
  { label: "Members", value: stats.members.toLocaleString(), icon: Users, href: "/admin/users" },
  { label: "Manifest profiles", value: stats.manifestProfiles.toLocaleString(), icon: FileText, href: "/admin/shipments" },
  { label: "Pending notices", value: String(stats.pendingNotices), icon: Bell, href: "/admin" },
]

function statusVariant(status: string) {
  if (status === "Delivered") return "bg-chart-5/15 text-chart-5"
  if (status === "Customs") return "bg-destructive/15 text-destructive"
  if (status === "At China WH") return "bg-accent/20 text-accent-foreground"
  return "bg-primary/10 text-primary"
}

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of AMOOKSCO cargo operations and members.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Card key={c.label}>
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <Link href={c.href} aria-label={`Go to ${c.label}`}>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </div>
                <div>
                  <p className="text-2xl font-bold">{c.value}</p>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent cargo</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/shipments">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Shipping mark</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>CBM</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">ETA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargo.map((c) => (
                  <TableRow key={c.ref}>
                    <TableCell className="font-mono text-xs">{c.ref}</TableCell>
                    <TableCell className="font-medium">{c.mark}</TableCell>
                    <TableCell>{c.mode}</TableCell>
                    <TableCell>{c.cbm}</TableCell>
                    <TableCell>
                      <Badge className={statusVariant(c.status)} variant="secondary">
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{c.eta}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
