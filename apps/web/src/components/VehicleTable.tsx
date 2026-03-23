import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Card, CardContent } from "@workspace/ui/components/card"
import type { VehicleRow } from "@/lib/vehicles"
import { VehicleCell } from "./VehicleCell"
import { SupportList } from "./SupportList"
import { RequirementsCell } from "./RequirementsCell"
import { NotesCell } from "./NotesCell"

interface VehicleTableProps {
  rows: Array<VehicleRow>
}

export function VehicleTable({ rows }: VehicleTableProps) {
  return (
    <>
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-80">Vehicle</TableHead>
              <TableHead className="w-72">Support</TableHead>
              <TableHead className="w-64">Requirements</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="align-top">
                  <VehicleCell row={row} />
                </TableCell>
                <TableCell className="align-top">
                  <SupportList bullets={row.supportBullets} />
                </TableCell>
                <TableCell className="align-top">
                  <RequirementsCell row={row} />
                </TableCell>
                <TableCell className="align-top whitespace-normal">
                  <NotesCell row={row} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 lg:hidden">
        {rows.map((row) => (
          <Card key={row.id}>
            <CardContent className="pt-4">
              <VehicleCell row={row} />
              <div className="mt-4">
                <SupportList bullets={row.supportBullets} />
              </div>
              <div className="mt-4">
                <RequirementsCell row={row} />
              </div>
              <div className="mt-4">
                <NotesCell row={row} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
