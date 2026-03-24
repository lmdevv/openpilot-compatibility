import { RiCheckLine } from "@remixicon/react"
import { cn } from "@workspace/ui/lib/utils"
import {
  VEHICLE_MAKES,
  VEHICLE_MAKE_COUNTS,
  getBrandLogo,
} from "@/lib/vehicles"

interface MakePickerProps {
  selectedMakes: Array<string>
  onToggleMake: (make: string) => void
}

export function MakePicker({ selectedMakes, onToggleMake }: MakePickerProps) {
  const selectedSet = new Set(selectedMakes)
  const hasSelection = selectedSet.size > 0

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11">
      {VEHICLE_MAKES.map((make) => {
        const logo = getBrandLogo(make)
        const count = VEHICLE_MAKE_COUNTS[make]
        const isSelected = selectedSet.has(make)
        const isDimmed = hasSelection && !isSelected

        return (
          <button
            key={make}
            type="button"
            onClick={() => onToggleMake(make)}
            className={cn(
              "group relative flex flex-col items-center gap-2 rounded-lg border px-2 pt-4 pb-2.5 transition-all",
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary/50"
                : "border-border hover:border-foreground/20 hover:bg-muted/50",
              isDimmed && "opacity-40 hover:opacity-70"
            )}
          >
            {isSelected && (
              <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <RiCheckLine className="size-3" />
              </span>
            )}
            <div className="flex h-12 w-full items-center justify-center sm:h-14">
              {logo ? (
                <img
                  src={logo}
                  alt={make}
                  className="max-h-full w-auto max-w-[80%] object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="text-sm font-semibold">{make}</span>
              )}
            </div>
            <span className="max-w-full truncate text-xs text-muted-foreground">
              {make}
            </span>
            <span className="text-[0.65rem] leading-none text-muted-foreground/50 tabular-nums">
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
