import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const tickets = [
  { id: "TK-1042", subject: "Can't find tracking number on sheet", member: "AGYIRIGO", dept: "Tracking", priority: "High", status: "Open", age: "2h" },
  { id: "TK-1041", subject: "Re-direct package sea to air", member: "YAARAHMAN", dept: "Tracking", priority: "Medium", status: "In progress", age: "5h" },
  { id: "TK-1039", subject: "Billing query for shipping mark", member: "FAYEMK", dept: "Billing", priority: "Low", status: "Open", age: "1d" },
  { id: "TK-1037", subject: "Double name confirmation", member: "KASANTE", dept: "Tracking", priority: "Medium", status: "Resolved", age: "2d" },
  { id: "TK-1035", subject: "Bank payment screenshot not received", member: "BEACON", dept: "Billing", priority: "High", status: "In progress", age: "3d" },
]

function statusColor(s: string) {
  if (s === "Resolved") return "bg-chart-5/15 text-chart-5"
  if (s === "In progress") return "bg-accent/20 text-accent-foreground"
  return "bg-primary/10 text-primary"
}
function priorityColor(p: string) {
  if (p === "High") return "bg-destructive/15 text-destructive"
  if (p === "Medium") return "bg-accent/20 text-accent-foreground"
  return "bg-muted text-muted-foreground"
}

export default function TicketsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
        <p className="text-muted-foreground">
          Customer requests routed from the storefront support form.
        </p>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Mark</TableHead>
                  <TableHead>Dept</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Age</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.id}</TableCell>
                    <TableCell className="font-medium">{t.subject}</TableCell>
                    <TableCell>
                      <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                        {t.member}
                      </span>
                    </TableCell>
                    <TableCell>{t.dept}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={priorityColor(t.priority)}>
                        {t.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColor(t.status)}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{t.age}</TableCell>
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
