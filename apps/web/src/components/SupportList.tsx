import { Badge } from "@workspace/ui/components/badge"
import type { VehicleRow, SupportBulletTone } from "@/lib/vehicles"

interface SupportListProps {
  bullets: VehicleRow["supportBullets"]
}

export function SupportList({ bullets }: SupportListProps) {
  return (
    <ul className="space-y-2">
      {bullets.map((bullet) => (
        <li key={`${bullet.label}-${bullet.text}`} className="flex gap-2">
          <Badge
            variant={getBadgeVariant(bullet.tone)}
            className="shrink-0 text-[10px] uppercase"
          >
            {bullet.label}
          </Badge>
          <span className="text-xs">{bullet.text}</span>
        </li>
      ))}
    </ul>
  )
}

function getBadgeVariant(tone: SupportBulletTone) {
  if (tone === "warning") return "destructive"
  if (tone === "info") return "secondary"
  return "default"
}
