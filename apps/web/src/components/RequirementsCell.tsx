import type { VehicleRow } from "@/lib/vehicles"

function getShopHref(row: VehicleRow) {
  return row.harnessConnector
    ? `https://comma.ai/shop/comma-four?harness=${encodeURIComponent(row.name)}`
    : "https://comma.ai/shop/comma-four"
}

interface RequirementsCellProps {
  row: VehicleRow
}

export function RequirementsCell({ row }: RequirementsCellProps) {
  const shopHref = getShopHref(row)

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
          Package
        </p>
        <p className="mt-1 text-sm">{row.packageSummary}</p>
      </div>
      <div>
        <p className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
          Harness
        </p>
        <p className="mt-1 text-sm">{row.connectorSummary}</p>
      </div>
      <a href={shopHref} target="_blank" rel="noreferrer" className="highlight">
        {row.harnessConnector ? "Buy comma four + harness" : "Buy comma four"}
      </a>
    </div>
  )
}
