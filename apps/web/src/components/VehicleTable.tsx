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
      {/* Desktop table - only visible on xl screens */}
      <div className="hidden xl:block">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Vehicle</TableHead>
              <TableHead className="w-[45%]">Support</TableHead>
              <TableHead className="w-[160px]">Requirements</TableHead>
              <TableHead className="w-[25%]">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="align-top">
                  <VehicleCell row={row} />
                </TableCell>
                <TableCell className="align-top">
                  <SupportList
                    nodes={row.detailSentence}
                    badges={row.supportBadges}
                  />
                </TableCell>
                <TableCell className="align-top">
                  <RequirementsCell row={row} />
                </TableCell>
                <TableCell className="align-top">
                  <NotesCell row={row} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Tablet view - visible on lg and xl screens */}
      <div className="hidden lg:block xl:hidden">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Vehicle</TableHead>
              <TableHead className="w-[55%]">Support</TableHead>
              <TableHead>Requirements</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="align-top">
                  <VehicleCell row={row} />
                </TableCell>
                <TableCell className="align-top">
                  <SupportList
                    nodes={row.detailSentence}
                    badges={row.supportBadges}
                  />
                </TableCell>
                <TableCell className="align-top">
                  <RequirementsCell row={row} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards - visible on smaller screens */}
      <div className="grid gap-4 lg:hidden">
        {rows.map((row) => (
          <Card key={row.id}>
            <CardContent className="pt-4">
              <VehicleCell row={row} />
              <div className="mt-4">
                <SupportList
                  nodes={row.detailSentence}
                  badges={row.supportBadges}
                />
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
