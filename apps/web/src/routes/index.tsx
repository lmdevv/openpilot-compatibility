import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useDeferredValue, useMemo } from "react"
import {
  FEATURE_FILTER_OPTIONS,
  SORT_OPTIONS,
  VEHICLE_ROWS,
  VEHICLE_STATS,
} from "@/lib/vehicles"
import type { FeatureFilter, SortKey, VehicleRow } from "@/lib/vehicles"
import { VehicleTable, SearchFilters, EmptyState } from "@/components"

type IndexSearch = {
  q?: string
  make?: string
  connector?: string
  minYear?: number
  maxYear?: number
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
    minYear: parseOptionalNumber(search.minYear),
    maxYear: parseOptionalNumber(search.maxYear),
    features: parseFeatureFilters(search.features),
    sort: parseSort(search.sort),
  }),
  head: () => ({
    meta: [
      {
        title: "openpilot vehicle compatibility",
      },
      {
        name: "description",
        content: "Vehicle compatibility table for openpilot.",
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

function parseOptionalNumber(value: unknown) {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) return parsed
  }
  return undefined
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
        return row.alcAllSpeeds
      case "alc-min-speed":
        return row.alcMinMph !== null
      case "acc-auto-resume":
        return row.accAutoResume
      case "experimental-mode":
        return row.experimentalMode
      case "tight-turns":
        return row.tightTurnWarning
      case "has-video":
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

    if (row.searchText.includes(token)) {
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
  const minYear = search.minYear
  const maxYear = search.maxYear
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

      if (
        (minYear !== undefined && (row.latestYear ?? 0) < minYear) ||
        (maxYear !== undefined && (row.earliestYear ?? Infinity) > maxYear)
      ) {
        return false
      }

      if (!matchesFeatures(row, features)) {
        return false
      }

      return matchesQuery(row, deferredQuery)
    })

    return sortRows(rows, deferredQuery, sort)
  }, [connector, deferredQuery, features, make, sort, minYear, maxYear])

  const activeFilterCount =
    Number(query.length > 0) +
    Number(make.length > 0) +
    Number(connector.length > 0) +
    features.length +
    Number(minYear !== undefined) +
    Number(maxYear !== undefined)

  const hasActiveFilters = activeFilterCount > 0 || sort !== DEFAULT_SORT

  function replaceSearch(patch: Partial<IndexSearch>) {
    void navigate({
      replace: true,
      resetScroll: false,
      search: (previous) => {
        const next = { ...previous }

        if ("q" in patch) next.q = normalizeSearchString(patch.q)
        if ("make" in patch) next.make = normalizeSearchString(patch.make)
        if ("connector" in patch)
          next.connector = normalizeSearchString(patch.connector)
        if ("minYear" in patch) next.minYear = patch.minYear
        if ("maxYear" in patch) next.maxYear = patch.maxYear
        if ("features" in patch)
          next.features = normalizeFeatureSearch(patch.features)
        if ("sort" in patch) next.sort = normalizeSortSearch(patch.sort)

        return next
      },
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
          <h1>
            <a
              href="https://comma.ai/openpilot"
              target="_blank"
              rel="noreferrer"
              className="highlight"
            >
              Openpilot
            </a>{" "}
            Vehicle Compatibility
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            If you have a modern car and some programming skills, you can likely
            add support for your car. Watch{" "}
            <a
              href="https://youtu.be/XxPS5TpTUnI"
              target="_blank"
              rel="noreferrer"
              className="highlight"
            >
              this talk
            </a>{" "}
            and check out the{" "}
            <a
              href="https://docs.comma.ai"
              target="_blank"
              rel="noreferrer"
              className="highlight"
            >
              docs
            </a>{" "}
            to learn more.
          </p>
        </div>
      </section>

      <SearchFilters
        query={query}
        make={make}
        connector={connector}
        minYear={minYear}
        maxYear={maxYear}
        features={features}
        sort={sort}
        hasActiveFilters={hasActiveFilters}
        onQueryChange={(value) => replaceSearch({ q: value })}
        onMakeChange={(value) => replaceSearch({ make: value ?? undefined })}
        onConnectorChange={(value) =>
          replaceSearch({ connector: value ?? undefined })
        }
        onYearChange={(min, max) =>
          replaceSearch({ minYear: min, maxYear: max })
        }
        onFeaturesChange={(value) =>
          replaceSearch({ features: value ?? undefined })
        }
        onSortChange={(value) => replaceSearch({ sort: value })}
        onReset={resetFilters}
      />

      <section className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-base text-muted-foreground">
            Showing {filteredRows.length} of {VEHICLE_STATS.rows} vehicles
          </p>
        </div>

        <VehicleTable rows={filteredRows} />

        {filteredRows.length === 0 && <EmptyState onReset={resetFilters} />}
      </section>
    </div>
  )
}
