import type { RefObject } from "react"
import {
  RiArrowDownSLine,
  RiCheckLine,
  RiCloseLine,
  RiFilterLine,
} from "@remixicon/react"
import { Input } from "@workspace/ui/components/input"
import { Slider } from "@workspace/ui/components/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import type {
  FeatureFilter,
  FeatureFilterEntry,
  FeatureFilterMode,
  SortKey,
} from "@/lib/vehicles"
import {
  FEATURE_FILTER_COUNTS,
  FEATURE_FILTER_LABELS,
  FEATURE_FILTER_OPTIONS,
  SORT_OPTIONS,
  SORT_LABELS,
  MIN_VEHICLE_YEAR,
  MAX_VEHICLE_YEAR,
} from "@/lib/vehicles"

function getFeatureMode(
  entries: Array<FeatureFilterEntry>,
  feature: FeatureFilter
): FeatureFilterMode | null {
  return entries.find((e) => e.feature === feature)?.mode ?? null
}

function upsertFeatureEntry(
  entries: Array<FeatureFilterEntry>,
  feature: FeatureFilter,
  mode: FeatureFilterMode | null
): Array<FeatureFilterEntry> {
  const map = new Map(entries.map((e) => [e.feature, e] as const))
  if (mode === null) {
    map.delete(feature)
  } else {
    map.set(feature, { feature, mode })
  }
  return FEATURE_FILTER_OPTIONS.filter((f) => map.has(f)).map(
    (f) => map.get(f)!
  )
}

function sortFeatureEntries(
  entries: Array<FeatureFilterEntry>
): Array<FeatureFilterEntry> {
  const order = new Map(
    FEATURE_FILTER_OPTIONS.map((f, index) => [f, index] as const)
  )
  return [...entries].sort(
    (a, b) => (order.get(a.feature) ?? 0) - (order.get(b.feature) ?? 0)
  )
}

interface SearchFiltersProps {
  query: string
  makes: Array<string>
  minYear?: number
  maxYear?: number
  featureEntries: Array<FeatureFilterEntry>
  sort: SortKey
  hasActiveFilters: boolean
  searchInputRef?: RefObject<HTMLInputElement | null>
  onQueryChange: (value: string) => void
  onRemoveMake: (make: string) => void
  onYearChange: (
    minYear: number | undefined,
    maxYear: number | undefined
  ) => void
  onFeatureEntriesChange: (value: Array<FeatureFilterEntry>) => void
  onSortChange: (value: SortKey) => void
  onReset: () => void
}

export function SearchFilters({
  query,
  makes,
  minYear,
  maxYear,
  featureEntries,
  sort,
  hasActiveFilters,
  searchInputRef,
  onQueryChange,
  onRemoveMake,
  onYearChange,
  onFeatureEntriesChange,
  onSortChange,
  onReset,
}: SearchFiltersProps) {
  const activeFeatureCount = featureEntries.length

  function emit(next: Array<FeatureFilterEntry>) {
    onFeatureEntriesChange(sortFeatureEntries(next))
  }

  function setFeatureMode(
    feature: FeatureFilter,
    mode: FeatureFilterMode | null
  ) {
    emit(upsertFeatureEntry(featureEntries, feature, mode))
  }

  function handleMainRowClick(feature: FeatureFilter) {
    const mode = getFeatureMode(featureEntries, feature)
    if (mode === null) {
      setFeatureMode(feature, "include")
    } else {
      setFeatureMode(feature, null)
    }
  }

  function clearAllFeatureFilters() {
    emit([])
  }

  return (
    <section className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex flex-col gap-3 px-4 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative md:max-w-xs">
            <Input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search vehicles..."
              className="pr-10"
            />
            <Badge
              variant="outline"
              className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs"
            >
              /
            </Badge>
          </div>

          <div className="flex w-full items-center gap-2 md:w-48 md:shrink-0">
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {minYear ?? MIN_VEHICLE_YEAR}
            </span>
            <Slider
              min={MIN_VEHICLE_YEAR}
              max={MAX_VEHICLE_YEAR}
              value={[minYear ?? MIN_VEHICLE_YEAR, maxYear ?? MAX_VEHICLE_YEAR]}
              onValueChange={(values) => {
                const [min, max] = values as [number, number]
                onYearChange(
                  min === MIN_VEHICLE_YEAR ? undefined : min,
                  max === MAX_VEHICLE_YEAR ? undefined : max
                )
              }}
            />
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {maxYear ?? MAX_VEHICLE_YEAR}
            </span>
          </div>

          <Popover>
            <PopoverTrigger>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <RiFilterLine className="size-4" />
                Filters
                {activeFeatureCount > 0 ? (
                  <Badge variant="secondary" className="px-1.5 text-xs">
                    {activeFeatureCount}
                  </Badge>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[min(100vw-2rem,22rem)] gap-0 p-0"
            >
              <div className="flex items-center justify-between border-b px-2.5 py-2">
                <span className="text-sm font-medium">Feature filters</span>
                {activeFeatureCount > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="h-7 text-muted-foreground"
                    onClick={clearAllFeatureFilters}
                  >
                    Clear all
                  </Button>
                ) : null}
              </div>
              <div className="flex max-h-[min(60vh,24rem)] flex-col gap-1 overflow-y-auto p-2">
                {FEATURE_FILTER_OPTIONS.map((feature) => {
                  const mode = getFeatureMode(featureEntries, feature)
                  const count = FEATURE_FILTER_COUNTS[feature]
                  const label = FEATURE_FILTER_LABELS[feature]

                  return (
                    <div
                      key={feature}
                      className="flex min-h-8 w-full items-stretch overflow-hidden rounded-none border border-border bg-background"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-auto min-h-8 flex-1 justify-start gap-2 rounded-none border-0 px-2 py-1.5 text-left font-normal",
                          mode === "include" && "bg-primary/10",
                          mode === "exclude" && "bg-destructive/10"
                        )}
                        onClick={() => handleMainRowClick(feature)}
                      >
                        <span className="flex size-4 shrink-0 items-center justify-center">
                          {mode === "include" ? (
                            <RiCheckLine className="size-4 text-primary" />
                          ) : mode === "exclude" ? (
                            <RiCloseLine className="size-4 text-destructive" />
                          ) : (
                            <span className="size-4 rounded-sm border border-border" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs">
                          {label}
                        </span>
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-[0.65rem]"
                        >
                          {count}
                        </Badge>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={cn(
                            "inline-flex size-8 shrink-0 items-center justify-center border-0 bg-transparent text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring",
                            mode === "include" && "bg-primary/10",
                            mode === "exclude" && "bg-destructive/10"
                          )}
                        >
                          <RiArrowDownSLine className="size-4" />
                          <span className="sr-only">
                            {label} include or exclude options
                          </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => setFeatureMode(feature, "include")}
                          >
                            Include
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setFeatureMode(feature, "exclude")}
                          >
                            Exclude
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setFeatureMode(feature, null)}
                          >
                            Clear
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>

          <div className="md:ml-auto">
            <Select
              value={sort}
              onValueChange={(value) => onSortChange(value as SortKey)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((sortOption) => (
                  <SelectItem key={sortOption} value={sortOption}>
                    {SORT_LABELS[sortOption]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(featureEntries.length > 0 ||
          makes.length > 0 ||
          hasActiveFilters) && (
          <div className="flex flex-wrap items-center gap-2">
            {makes.map((m) => (
              <Badge
                key={`make-${m}`}
                variant="secondary"
                className="max-w-full gap-1 pr-1 text-xs font-normal"
              >
                <span className="truncate">{m}</span>
                <button
                  type="button"
                  className="ml-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-none hover:bg-background/80"
                  aria-label={`Remove ${m} filter`}
                  onClick={() => onRemoveMake(m)}
                >
                  <RiCloseLine className="size-3.5 opacity-70" />
                </button>
              </Badge>
            ))}
            {featureEntries.map((entry) => (
              <Badge
                key={entry.feature}
                variant={entry.mode === "exclude" ? "destructive" : "secondary"}
                className="max-w-full gap-1 pr-1 text-xs font-normal"
              >
                {entry.mode === "include" ? (
                  <RiCheckLine className="size-3.5 shrink-0" aria-hidden />
                ) : (
                  <RiCloseLine className="size-3.5 shrink-0" aria-hidden />
                )}
                <span className="truncate">
                  {FEATURE_FILTER_LABELS[entry.feature]}
                </span>
                <button
                  type="button"
                  className="ml-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-none hover:bg-background/80"
                  aria-label={`Remove ${FEATURE_FILTER_LABELS[entry.feature]} filter`}
                  onClick={() => setFeatureMode(entry.feature, null)}
                >
                  <RiCloseLine className="size-3.5 opacity-70" />
                </button>
              </Badge>
            ))}

            {hasActiveFilters ? (
              <Button variant="ghost" size="sm" onClick={onReset}>
                Reset
                <Badge variant="outline" className="ml-1.5 text-xs">
                  R
                </Badge>
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}
