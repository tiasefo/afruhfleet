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
import { cargo } from "@/lib/admin-data"

function statusVariant(status: string) {
  if (status === "Delivered") return "bg-chart-5/15 text-chart-5"
  if (status === "Customs") return "bg-destructive/15 text-destructive"
  if (status === "At China WH") return "bg-accent/20 text-accent-foreground"
  return "bg-primary/10 text-primary"
}

export default function ShipmentsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Shipments</h1>
        <p className="text-muted-foreground">
          Cargo records across sea and air consignments.
        </p>
      </div>
      <Card>
        <CardContent className="p-0">
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
                      <Badge variant="secondary" className={statusVariant(c.status)}>
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
