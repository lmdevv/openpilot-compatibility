import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useDeferredValue, useMemo } from "react"
import {
  FEATURE_FILTER_COUNTS,
  FEATURE_FILTER_LABELS,
  FEATURE_FILTER_OPTIONS,
  SORT_LABELS,
  SORT_OPTIONS,
  VEHICLE_CONNECTORS,
  VEHICLE_MAKES,
  VEHICLE_ROWS,
  VEHICLE_STATS,
} from "@/lib/vehicles"
import type {
  FeatureFilter,
  SortKey,
  SupportBulletTone,
  VehicleRow,
} from "@/lib/vehicles"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { Card, CardContent } from "@workspace/ui/components/card"

type IndexSearch = {
  q?: string
  make?: string
  connector?: string
  features?: Array<FeatureFilter>
  sort?: SortKey
}

const DEFAULT_SORT: SortKey = "best-match"

const FEATURE_FILTER_SET = new Set<FeatureFilter>(FEATURE_FILTER_OPTIONS)
const SORT_OPTION_SET = new Set<SortKey>(SORT_OPTIONS)

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): IndexSearch => ({
    q: parseOptionalString(search.q),
    make: parseOptionalString(search.make),
    connector: parseOptionalString(search.connector),
    features: parseFeatureFilters(search.features),
    sort: parseSort(search.sort),
  }),
  head: () => ({
    meta: [
      {
        title: "Openpilot Vehicle Compatibility",
      },
      {
        name: "description",
        content:
          "Vehicle compatibility table for openpilot with search and filters.",
      },
    ],
  }),
  component: IndexRoute,
})

function parseOptionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined
}

function parseFeatureFilters(value: unknown) {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? [value]
      : []

  const featureFilters = values.filter(
    (entry): entry is FeatureFilter =>
      typeof entry === "string" &&
      FEATURE_FILTER_SET.has(entry as FeatureFilter)
  )

  return featureFilters.length > 0 ? [...new Set(featureFilters)] : undefined
}

function parseSort(value: unknown) {
  return typeof value === "string" && SORT_OPTION_SET.has(value as SortKey)
    ? (value as SortKey)
    : undefined
}

function matchesQuery(row: VehicleRow, query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  return normalizedQuery
    .split(/\s+/)
    .every((token) => row.searchText.includes(token))
}

function matchesFeatures(row: VehicleRow, features: Array<FeatureFilter>) {
  return features.every((feature) => {
    switch (feature) {
      case "all-speeds":
        return row.laneCenteringAllSpeeds
      case "speed-limited":
        return (
          row.laneCenteringMinMph !== null || row.adaptiveCruiseMinMph !== null
        )
      case "stop-and-go":
        return row.adaptiveCruiseAutoResume
      case "experimental":
        return row.experimentalMode
      case "tight-turn-warning":
        return row.tightTurnWarning
      case "video":
        return row.hasVideo
    }
  })
}

function getMatchScore(row: VehicleRow, query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return 0
  }

  const tokens = normalizedQuery.split(/\s+/)
  let score = 0

  if (row.name.toLowerCase() === normalizedQuery) {
    score += 120
  }

  if (row.name.toLowerCase().includes(normalizedQuery)) {
    score += 80
  }

  if (row.model.toLowerCase().includes(normalizedQuery)) {
    score += 40
  }

  if (row.make.toLowerCase() === normalizedQuery) {
    score += 24
  }

  for (const token of tokens) {
    if (row.name.toLowerCase().includes(token)) {
      score += 18
    }

    if (row.model.toLowerCase().includes(token)) {
      score += 14
    }

    if (row.make.toLowerCase().includes(token)) {
      score += 10
    }

    if (row.packageSummary.toLowerCase().includes(token)) {
      score += 6
    }

    if (row.connectorSummary.toLowerCase().includes(token)) {
      score += 6
    }

    if (row.detailPlainText.toLowerCase().includes(token)) {
      score += 4
    }
  }

  return score
}

function sortRows(rows: Array<VehicleRow>, query: string, sort: SortKey) {
  return [...rows].sort((left, right) => {
    if (sort === "oldest") {
      return (left.earliestYear ?? 0) - (right.earliestYear ?? 0)
    }

    if (sort === "newest") {
      return (right.latestYear ?? 0) - (left.latestYear ?? 0)
    }

    if (sort === "make-a-z") {
      if (left.make !== right.make) {
        return left.make.localeCompare(right.make)
      }

      return left.name.localeCompare(right.name)
    }

    const scoreDelta = getMatchScore(right, query) - getMatchScore(left, query)

    if (scoreDelta !== 0) {
      return scoreDelta
    }

    if (left.make !== right.make) {
      return left.make.localeCompare(right.make)
    }

    return left.name.localeCompare(right.name)
  })
}

function normalizeSearchString(value: string | undefined) {
  if (!value) {
    return undefined
  }

  const trimmedValue = value.trim()

  return trimmedValue.length > 0 ? trimmedValue : undefined
}

function normalizeFeatureSearch(value: Array<FeatureFilter> | undefined) {
  return value && value.length > 0 ? value : undefined
}

function normalizeSortSearch(value: SortKey | undefined) {
  return value && value !== DEFAULT_SORT ? value : undefined
}

function IndexRoute() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const query = search.q ?? ""
  const make = search.make ?? ""
  const connector = search.connector ?? ""
  const features = search.features ?? []
  const sort = search.sort ?? DEFAULT_SORT
  const deferredQuery = useDeferredValue(query)

  const filteredRows = useMemo(() => {
    const rows = VEHICLE_ROWS.filter((row) => {
      if (make && row.make !== make) {
        return false
      }

      if (connector && row.harnessConnector !== connector) {
        return false
      }

      if (!matchesFeatures(row, features)) {
        return false
      }

      return matchesQuery(row, deferredQuery)
    })

    return sortRows(rows, deferredQuery, sort)
  }, [connector, deferredQuery, features, make, sort])

  const activeFilterCount =
    Number(query.length > 0) +
    Number(make.length > 0) +
    Number(connector.length > 0) +
    features.length

  const hasActiveFilters = activeFilterCount > 0 || sort !== DEFAULT_SORT

  function replaceSearch(patch: Partial<IndexSearch>) {
    void navigate({
      replace: true,
      resetScroll: false,
      search: (previous) => ({
        q: patch.q !== undefined ? normalizeSearchString(patch.q) : previous.q,
        make:
          patch.make !== undefined
            ? normalizeSearchString(patch.make)
            : previous.make,
        connector:
          patch.connector !== undefined
            ? normalizeSearchString(patch.connector)
            : previous.connector,
        features:
          patch.features !== undefined
            ? normalizeFeatureSearch(patch.features)
            : previous.features,
        sort:
          patch.sort !== undefined
            ? normalizeSortSearch(patch.sort)
            : previous.sort,
      }),
    })
  }

  function resetFilters() {
    void navigate({
      replace: true,
      resetScroll: false,
      search: () => ({}),
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Openpilot Vehicle Compatibility
          </h1>
        </div>
      </section>

      <section className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <Input
              type="search"
              value={query}
              onChange={(event) => replaceSearch({ q: event.target.value })}
              placeholder="Search vehicles..."
              className="md:max-w-sm"
            />

            <div className="flex flex-wrap gap-2 md:ml-auto">
              <Select
                value={make}
                onValueChange={(value) =>
                  replaceSearch({ make: value ?? undefined })
                }
              >
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

              <Select
                value={connector}
                onValueChange={(value) =>
                  replaceSearch({ connector: value ?? undefined })
                }
              >
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
                onValueChange={(value) =>
                  replaceSearch({ sort: (value as SortKey) ?? undefined })
                }
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

          <div className="mt-4 flex flex-wrap gap-2">
            <ToggleGroup
              value={features}
              onValueChange={(value) =>
                replaceSearch({
                  features: (value as Array<FeatureFilter>) ?? undefined,
                })
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
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Reset
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredRows.length} of {VEHICLE_STATS.rows} vehicles
          </p>
        </div>

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
              {filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <VehicleCell row={row} />
                  </TableCell>
                  <TableCell>
                    <SupportList bullets={row.supportBullets} />
                  </TableCell>
                  <TableCell>
                    <RequirementsCell row={row} />
                  </TableCell>
                  <TableCell>
                    <NotesCell row={row} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-4 lg:hidden">
          {filteredRows.map((row) => (
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

        {filteredRows.length === 0 && (
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
            <p className="text-sm text-muted-foreground">No vehicles found</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={resetFilters}
            >
              Clear filters
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}

function VehicleCell({ row }: { row: VehicleRow }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {row.make}
      </p>
      <p className="mt-1 text-base font-semibold">{row.model}</p>
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

function SupportList({ bullets }: { bullets: VehicleRow["supportBullets"] }) {
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

function RequirementsCell({ row }: { row: VehicleRow }) {
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

function NotesCell({ row }: { row: VehicleRow }) {
  const notes = [...row.footnotes, ...row.setupNotes]

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {row.video && (
          <a
            href={row.video}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary hover:underline"
          >
            Drive video
          </a>
        )}
        {row.setupVideo && (
          <a
            href={row.setupVideo}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary hover:underline"
          >
            Setup video
          </a>
        )}
      </div>

      {notes.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {notes.map((note) => (
            <li key={note} className="flex gap-2 text-xs text-muted-foreground">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          No additional notes
        </p>
      )}
    </div>
  )
}
