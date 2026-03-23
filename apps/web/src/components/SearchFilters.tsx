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
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import type { FeatureFilter, SortKey } from "@/lib/vehicles"
import {
  FEATURE_FILTER_COUNTS,
  FEATURE_FILTER_LABELS,
  FEATURE_FILTER_OPTIONS,
  SORT_OPTIONS,
  SORT_LABELS,
  VEHICLE_MAKES,
  VEHICLE_CONNECTORS,
  MIN_VEHICLE_YEAR,
  MAX_VEHICLE_YEAR,
} from "@/lib/vehicles"

interface SearchFiltersProps {
  query: string
  make: string
  connector: string
  minYear?: number
  maxYear?: number
  features: Array<FeatureFilter>
  sort: SortKey
  hasActiveFilters: boolean
  onQueryChange: (value: string) => void
  onMakeChange: (value: string | null) => void
  onConnectorChange: (value: string | null) => void
  onYearChange: (
    minYear: number | undefined,
    maxYear: number | undefined
  ) => void
  onFeaturesChange: (value: Array<FeatureFilter>) => void
  onSortChange: (value: SortKey) => void
  onReset: () => void
}

export function SearchFilters({
  query,
  make,
  connector,
  minYear,
  maxYear,
  features,
  sort,
  hasActiveFilters,
  onQueryChange,
  onMakeChange,
  onConnectorChange,
  onYearChange,
  onFeaturesChange,
  onSortChange,
  onReset,
}: SearchFiltersProps) {
  return (
    <section className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <Input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search vehicles..."
            className="md:max-w-sm"
          />

          <div className="flex flex-wrap gap-2 md:ml-auto">
            <Select value={make} onValueChange={onMakeChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Make" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Makes</SelectItem>
                {VEHICLE_MAKES.map((makeOption) => (
                  <SelectItem key={makeOption} value={makeOption}>
                    {makeOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={connector} onValueChange={onConnectorChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Harness" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Harnesses</SelectItem>
                {VEHICLE_CONNECTORS.map((connectorOption) => (
                  <SelectItem key={connectorOption} value={connectorOption}>
                    {connectorOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex w-full flex-col gap-2 md:w-64">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{minYear ?? MIN_VEHICLE_YEAR}</span>
              <span>Years</span>
              <span>{maxYear ?? MAX_VEHICLE_YEAR}</span>
            </div>
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
          </div>

          <div className="flex flex-wrap gap-2 md:ml-auto">
            <ToggleGroup
              value={features}
              onValueChange={(value) =>
                onFeaturesChange(value as Array<FeatureFilter>)
              }
            >
              {FEATURE_FILTER_OPTIONS.map((feature) => (
                <ToggleGroupItem
                  key={feature}
                  value={feature}
                  variant="outline"
                  size="sm"
                >
                  {FEATURE_FILTER_LABELS[feature]}
                  <Badge variant="secondary" className="ml-1.5">
                    {FEATURE_FILTER_COUNTS[feature]}
                  </Badge>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onReset}>
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
