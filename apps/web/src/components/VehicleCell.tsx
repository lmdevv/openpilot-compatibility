import { Badge } from "@workspace/ui/components/badge"
import type { VehicleRow } from "@/lib/vehicles"
import { getBrandLogo } from "@/lib/vehicles"

interface VehicleCellProps {
  row: VehicleRow
}

export function VehicleCell({ row }: VehicleCellProps) {
  const logoUrl = getBrandLogo(row.make)

  return (
    <div>
      <div className="flex items-center gap-3">
        {logoUrl && (
          <img
            src={logoUrl}
            alt={`${row.make} logo`}
            className="h-8 w-auto object-contain"
            loading="lazy"
          />
        )}
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {row.make}
        </p>
      </div>
      <p className="mt-2 text-base font-semibold">{row.model}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {row.years && <Badge variant="outline">{row.years}</Badge>}
        {row.harnessConnector && (
          <Badge variant="outline">{row.harnessConnector}</Badge>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{row.name}</p>
    </div>
  )
}
