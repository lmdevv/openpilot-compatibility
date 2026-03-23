import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useDeferredValue, useMemo } from "react"
import compatibilityMeta from "@/lib/compatibility-meta.json"
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
        title: "openpilot compatibility atlas",
      },
      {
        name: "description",
        content:
          "Fast static openpilot vehicle compatibility table with URL-driven search and filters.",
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

  function toggleFeature(feature: FeatureFilter) {
    const nextFeatures = features.includes(feature)
      ? features.filter((value) => value !== feature)
      : [...features, feature]

    replaceSearch({ features: nextFeatures })
  }

  function resetFilters() {
    void navigate({
      replace: true,
      resetScroll: false,
      search: () => ({}),
    })
  }

  return (
    <div className="min-h-svh bg-[#f4efe6] text-[#17130e]">
      <section className="relative overflow-hidden border-b border-black/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(244,239,230,0.92)_44%,_rgba(229,217,195,0.72)_100%)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(90deg,rgba(0,0,0,0.12)_1px,transparent_1px)] bg-[size:1.25rem_100%] opacity-20" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[linear-gradient(rgba(0,0,0,0.08)_1px,transparent_1px)] bg-[size:100%_1.25rem] opacity-20" />
        <div className="relative container-comma py-10 md:py-14">
          <div className="max-w-4xl">
            <p className="font-mono text-xs tracking-[0.28em] text-black/55 uppercase">
              Static. Client-side. Shareable.
            </p>
            <h1 className="max-w-5xl text-[clamp(2.7rem,6vw,5.5rem)] font-semibold tracking-[-0.08em] text-[#17130e]">
              openpilot compatibility, stripped into a fast searchable table.
            </h1>
            <p className="max-w-3xl text-lg leading-7 text-black/70 md:text-xl">
              Every row is normalized from the upstream vehicle data so the key
              support details stay visible in plain language, with the full
              filters reflected in the URL.
            </p>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <StatCard label="Rows" value={String(VEHICLE_STATS.rows)} />
            <StatCard label="Brands" value={String(VEHICLE_STATS.makes)} />
            <StatCard
              label="Harnesses"
              value={String(VEHICLE_STATS.connectors)}
            />
            <StatCard
              label="Last updated"
              value={compatibilityMeta.last_updated}
            />
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-20 border-b border-black/10 bg-[#f4efe6]/90 backdrop-blur-xl">
        <div className="container-comma py-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(10rem,0.75fr)_minmax(12rem,0.95fr)_minmax(10rem,0.8fr)]">
            <label className="flex min-h-14 items-center gap-3 rounded-[1.4rem] border border-black/10 bg-white/80 px-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <span className="font-mono text-xs tracking-[0.2em] text-black/45 uppercase">
                Search
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => replaceSearch({ q: event.target.value })}
                placeholder="Acura, all speeds, stop sign, Honda Bosch A..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-black/35 md:text-base"
              />
            </label>

            <FilterSelect
              label="Make"
              value={make}
              options={VEHICLE_MAKES}
              onChange={(value) => replaceSearch({ make: value })}
            />
            <FilterSelect
              label="Harness"
              value={connector}
              options={VEHICLE_CONNECTORS}
              onChange={(value) => replaceSearch({ connector: value })}
            />
            <FilterSelect
              label="Sort"
              value={sort}
              options={SORT_OPTIONS}
              getOptionLabel={(value) => SORT_LABELS[value]}
              onChange={(value) => replaceSearch({ sort: value as SortKey })}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {FEATURE_FILTER_OPTIONS.map((feature) => {
              const active = features.includes(feature)

              return (
                <button
                  key={feature}
                  type="button"
                  onClick={() => toggleFeature(feature)}
                  className={`rounded-full border px-3 py-2 text-sm transition ${
                    active
                      ? "border-[#17130e] bg-[#17130e] text-[#f4efe6]"
                      : "border-black/10 bg-white/70 text-black/75 hover:border-black/30 hover:bg-white"
                  }`}
                >
                  {FEATURE_FILTER_LABELS[feature]}
                  <span className="ml-2 font-mono text-xs opacity-70">
                    {FEATURE_FILTER_COUNTS[feature]}
                  </span>
                </button>
              )
            })}

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-black/10 bg-transparent px-3 py-2 text-sm text-black/60 transition hover:border-black/30 hover:text-black"
              >
                Reset view
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="container-comma py-8 pb-16">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs tracking-[0.22em] text-black/45 uppercase">
              Compatibility matrix
            </p>
            <h2 className="mb-0 text-2xl font-semibold tracking-[-0.06em] md:text-4xl">
              Showing {filteredRows.length} of {VEHICLE_STATS.rows} rows
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-black/60 md:text-base">
            {activeFilterCount > 0
              ? `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}. Share the URL to keep this exact view.`
              : "All compatibility rows are loaded locally, then filtered and sorted on-device for instant updates."}
          </p>
        </div>

        <div className="hidden overflow-hidden rounded-[2rem] border border-black/10 bg-white/80 shadow-[0_24px_70px_rgba(0,0,0,0.08)] lg:block">
          <table className="w-full border-collapse align-top">
            <thead>
              <tr className="bg-[#ebe1d0] text-left text-xs tracking-[0.2em] text-black/55 uppercase">
                <th className="w-[20rem] px-5 py-4">Vehicle</th>
                <th className="w-[18rem] px-5 py-4">Support bullets</th>
                <th className="w-[16rem] px-5 py-4">Requirements</th>
                <th className="px-5 py-4">Notes and links</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className="border-t border-black/8 align-top">
                  <td className="px-5 py-5">
                    <VehicleCell row={row} />
                  </td>
                  <td className="px-5 py-5">
                    <SupportList bullets={row.supportBullets} />
                  </td>
                  <td className="px-5 py-5">
                    <RequirementsCell row={row} />
                  </td>
                  <td className="px-5 py-5">
                    <NotesCell row={row} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 lg:hidden">
          {filteredRows.map((row) => (
            <article
              key={row.id}
              className="rounded-[1.6rem] border border-black/10 bg-white/85 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.07)]"
            >
              <VehicleCell row={row} compact />
              <div className="mt-4">
                <SupportList bullets={row.supportBullets} />
              </div>
              <div className="mt-4">
                <RequirementsCell row={row} compact />
              </div>
              <div className="mt-4">
                <NotesCell row={row} compact />
              </div>
            </article>
          ))}
        </div>

        {filteredRows.length === 0 ? (
          <div className="mt-6 rounded-[1.8rem] border border-dashed border-black/15 bg-white/60 px-6 py-10 text-center">
            <p className="font-mono text-xs tracking-[0.22em] text-black/45 uppercase">
              No rows match this view
            </p>
            <p className="mt-3 text-base text-black/65">
              Try clearing a feature filter, broadening the query, or switching
              the harness filter back to all connectors.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.7rem] border border-black/10 bg-white/75 px-4 py-4 shadow-[0_14px_40px_rgba(0,0,0,0.05)]">
      <p className="font-mono text-[11px] tracking-[0.24em] text-black/45 uppercase">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold tracking-[-0.05em] text-[#17130e]">
        {value}
      </p>
    </div>
  )
}

function FilterSelect<TOption extends string>({
  label,
  value,
  options,
  onChange,
  getOptionLabel,
}: {
  label: string
  value: TOption | ""
  options: Array<TOption>
  onChange: (value: TOption | "") => void
  getOptionLabel?: (value: TOption) => string
}) {
  return (
    <label className="flex min-h-14 items-center justify-between gap-3 rounded-[1.4rem] border border-black/10 bg-white/80 px-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
      <span className="font-mono text-xs tracking-[0.2em] text-black/45 uppercase">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TOption | "")}
        className="w-full bg-transparent text-right text-sm outline-none md:text-base"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {getOptionLabel ? getOptionLabel(option) : option}
          </option>
        ))}
      </select>
    </label>
  )
}

function VehicleCell({
  row,
  compact = false,
}: {
  row: VehicleRow
  compact?: boolean
}) {
  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.22em] text-black/45 uppercase">
        {row.make}
      </p>
      <p
        className={`mt-2 font-semibold tracking-[-0.05em] ${compact ? "text-2xl" : "text-xl"}`}
      >
        {row.model}
      </p>
      <div className="mt-2 flex flex-wrap gap-2 text-sm text-black/58">
        {row.years ? (
          <span className="rounded-full bg-[#f2ebdf] px-2.5 py-1">
            {row.years}
          </span>
        ) : null}
        {row.harnessConnector ? (
          <span className="rounded-full bg-[#f2ebdf] px-2.5 py-1">
            {row.harnessConnector}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-black/62">{row.name}</p>
    </div>
  )
}

function SupportList({ bullets }: { bullets: VehicleRow["supportBullets"] }) {
  return (
    <ul className="space-y-2.5">
      {bullets.map((bullet) => (
        <li
          key={`${bullet.label}-${bullet.text}`}
          className="flex gap-3 text-sm leading-6"
        >
          <span className={bulletToneClassName(bullet.tone)}>
            {bullet.label}
          </span>
          <span className="text-black/72">{bullet.text}</span>
        </li>
      ))}
    </ul>
  )
}

function bulletToneClassName(tone: SupportBulletTone) {
  if (tone === "warning") {
    return "mt-0.5 inline-flex h-fit rounded-full bg-[#fff1d6] px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#8b5a00]"
  }

  if (tone === "info") {
    return "mt-0.5 inline-flex h-fit rounded-full bg-[#ddefff] px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#0c5c95]"
  }

  return "mt-0.5 inline-flex h-fit rounded-full bg-[#e5f5d7] px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#236a1e]"
}

function RequirementsCell({
  row,
  compact = false,
}: {
  row: VehicleRow
  compact?: boolean
}) {
  return (
    <div className={`grid gap-3 ${compact ? "md:grid-cols-2" : ""}`}>
      <div className="rounded-[1.2rem] bg-[#f7f2ea] p-3">
        <p className="font-mono text-[11px] tracking-[0.18em] text-black/45 uppercase">
          Package
        </p>
        <p className="mt-2 text-sm leading-6 text-black/72">
          {row.packageSummary}
        </p>
      </div>
      <div className="rounded-[1.2rem] bg-[#f7f2ea] p-3">
        <p className="font-mono text-[11px] tracking-[0.18em] text-black/45 uppercase">
          Harness
        </p>
        <p className="mt-2 text-sm leading-6 text-black/72">
          {row.connectorSummary}
        </p>
      </div>
    </div>
  )
}

function NotesCell({
  row,
  compact = false,
}: {
  row: VehicleRow
  compact?: boolean
}) {
  const notes = [...row.footnotes, ...row.setupNotes]

  return (
    <div>
      <div className="flex flex-wrap gap-2 text-sm">
        {row.video ? <LinkChip href={row.video}>Drive video</LinkChip> : null}
        {row.setupVideo ? (
          <LinkChip href={row.setupVideo}>Setup video</LinkChip>
        ) : null}
      </div>

      {notes.length > 0 ? (
        <ul
          className={`mt-3 space-y-2 text-sm leading-6 text-black/68 ${compact ? "" : "max-w-2xl"}`}
        >
          {notes.map((note) => (
            <li key={note} className="flex gap-2">
              <span className="mt-[0.6rem] h-1.5 w-1.5 shrink-0 rounded-full bg-black/35" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-black/45">No extra notes.</p>
      )}
    </div>
  )
}

function LinkChip({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-full border border-black/10 bg-[#f7f2ea] px-3 py-1.5 text-black/70 transition hover:border-black/25 hover:text-black"
    >
      {children}
    </a>
  )
}
