import type { VehicleRow } from "@/lib/vehicles"

interface RequirementsCellProps {
  row: VehicleRow
}

export function RequirementsCell({ row }: RequirementsCellProps) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Package
        </p>
        <p className="mt-1 text-xs">{row.packageSummary}</p>
      </div>
      <div>
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Harness
        </p>
        <p className="mt-1 text-xs">{row.connectorSummary}</p>
      </div>
    </div>
  )
}
