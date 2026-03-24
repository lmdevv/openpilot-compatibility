import vehiclesSource from "./vehicles.json"

export type SupportBadge = {
  id: string
  label: string
  variant: "default" | "secondary" | "destructive" | "outline"
}

export type DetailNode =
  | { type: "text"; content: string }
  | { type: "strong"; content: string }
  | { type: "link"; content: string; href: string }

export type FeatureFilter =
  | "all-speeds"
  | "alc-min-speed"
  | "acc-auto-resume"
  | "experimental-mode"
  | "tight-turns"
  | "has-video"

export type FeatureFilterMode = "include" | "exclude"

export type FeatureFilterEntry = {
  feature: FeatureFilter
  mode: FeatureFilterMode
}

export type SortKey = "best-match" | "make-a-z" | "newest" | "oldest"

type RawVehicle = {
  name: string
  model: string
  years: string
  year_list: string
  package: string
  video: string
  setup_video: string
  harness_connector: string
  detail_sentence: string
  footnotes: Array<string>
  setup_notes: Array<string>
}

type VehicleDataset = Record<string, Array<RawVehicle>>

export type VehicleRow = {
  id: string
  make: string
  name: string
  model: string
  years: string
  yearList: string
  yearsNumeric: Array<number>
  earliestYear: number | null
  latestYear: number | null
  packageText: string
  packageSummary: string
  harnessConnector: string
  connectorSummary: string
  video: string
  setupVideo: string
  detailSentence: Array<DetailNode>
  footnotes: Array<string>
  setupNotes: Array<string>
  // Filterable properties
  alcMinMph: number | null
  alcAllSpeeds: boolean
  accMinMph: number | null
  accAutoResume: boolean
  experimentalMode: boolean
  tightTurnWarning: boolean
  hasVideo: boolean
  hasSetupVideo: boolean
  hasNotes: boolean
  // Badges for display
  supportBadges: Array<SupportBadge>
  searchText: string
}

const vehiclesDataset = vehiclesSource as VehicleDataset

const featureFilterLabels: Record<FeatureFilter, string> = {
  "all-speeds": "ALC at all speeds",
  "alc-min-speed": "ALC above specific speed",
  "acc-auto-resume": "ACC auto resume from stop",
  "experimental-mode": "Experimental mode features",
  "tight-turns": "May struggle in tight turns",
  "has-video": "Has install video",
}

const sortLabels: Record<SortKey, string> = {
  "best-match": "Best match",
  "make-a-z": "Make A-Z",
  newest: "Newest years first",
  oldest: "Oldest years first",
}

function decodeHtmlEntities(value: string) {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function parseDetailSentence(html: string): Array<DetailNode> {
  const nodes: Array<DetailNode> = []
  let position = 0

  while (position < html.length) {
    const openTagMatch = html
      .slice(position)
      .match(/^<([a-zA-Z][a-zA-Z0-9]*)\s*([^>]*)>/)

    if (openTagMatch) {
      const [fullMatch, tagName, attributesStr] = openTagMatch
      const props: Record<string, string> = {}

      // Parse attributes
      const attrMatches = attributesStr.matchAll(
        /([a-zA-Z-]+)=["']([^"']*)["']/g
      )
      for (const match of attrMatches) {
        props[match[1]] = match[2]
      }

      // Find closing tag
      const closeTagRegex = new RegExp(`</${tagName}>`, "i")
      const closeTagMatch = html
        .slice(position + fullMatch.length)
        .match(closeTagRegex)

      if (closeTagMatch && closeTagMatch.index !== undefined) {
        const content = html.slice(
          position + fullMatch.length,
          position + fullMatch.length + closeTagMatch.index
        )

        const decodedContent = decodeHtmlEntities(content)

        if (tagName.toLowerCase() === "strong") {
          nodes.push({ type: "strong", content: decodedContent })
        } else if (tagName.toLowerCase() === "a") {
          nodes.push({
            type: "link",
            content: decodedContent,
            href: props.href || "#",
          })
        }

        position +=
          fullMatch.length + closeTagMatch.index + closeTagMatch[0].length
        continue
      }
    }

    // Find next opening tag or end of string
    const nextTagIndex = html.slice(position).indexOf("<")
    if (nextTagIndex === -1) {
      if (position < html.length) {
        const text = decodeHtmlEntities(html.slice(position))
        if (text) {
          nodes.push({ type: "text", content: text })
        }
      }
      break
    }

    if (nextTagIndex > 0) {
      const text = decodeHtmlEntities(
        html.slice(position, position + nextTagIndex)
      )
      if (text) {
        nodes.push({ type: "text", content: text })
      }
    }

    position += nextTagIndex
  }

  return nodes
}

function stripHtml(value: string) {
  const withBreaks = value.replace(/<br\s*\/?\s*>/gi, " ")
  return normalizeWhitespace(
    decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, " "))
  )
}

function parseSpeedMph(text: string): number | null {
  const match = text.match(/(\d+)\s*mph/i)
  return match ? Number(match[1]) : null
}

function extractAlcInfo(detailText: string): {
  minMph: number | null
  allSpeeds: boolean
  badgeText: string | null
} {
  // Match patterns like:
  // "automated lane centering at all speeds"
  // "automated lane centering above 3 mph"
  // "automated lane centering while driving above 26 mph"
  const allSpeedsMatch = detailText.match(
    /automated lane centering\s*<strong>\s*at all speeds\s*<\/strong>/i
  )
  if (allSpeedsMatch) {
    return { minMph: null, allSpeeds: true, badgeText: "ALC at all speeds" }
  }

  const aboveSpeedMatch = detailText.match(
    /automated lane centering\s*<strong>\s*(above\s+\d+\s*mph)\s*<\/strong>/i
  )
  if (aboveSpeedMatch) {
    const mph = parseSpeedMph(aboveSpeedMatch[1])
    return {
      minMph: mph,
      allSpeeds: false,
      badgeText: mph ? `ALC above ${mph} mph` : "ALC speed limited",
    }
  }

  const whileDrivingMatch = detailText.match(
    /automated lane centering\s*<strong>\s*(while driving above\s+\d+\s*mph)\s*<\/strong>/i
  )
  if (whileDrivingMatch) {
    const mph = parseSpeedMph(whileDrivingMatch[1])
    return {
      minMph: mph,
      allSpeeds: false,
      badgeText: mph ? `ALC above ${mph} mph` : "ALC speed limited",
    }
  }

  // Check for plain text patterns (no HTML)
  const plainAllSpeeds = /automated lane centering\s+at all speeds/i.test(
    detailText
  )
  if (plainAllSpeeds) {
    return { minMph: null, allSpeeds: true, badgeText: "ALC at all speeds" }
  }

  const plainAboveMatch = detailText.match(
    /automated lane centering\s+(?:above\s+|while driving above\s+)(\d+)\s*mph/i
  )
  if (plainAboveMatch) {
    const mph = Number(plainAboveMatch[1])
    return { minMph: mph, allSpeeds: false, badgeText: `ALC above ${mph} mph` }
  }

  return { minMph: null, allSpeeds: false, badgeText: null }
}

function extractAccInfo(detailText: string): {
  minMph: number | null
  autoResume: boolean
  badgeText: string | null
} {
  // Match "that automatically resumes from a stop"
  const autoResumeMatch = detailText.match(
    /adaptive cruise control\s*<strong>\s*that automatically resumes from a stop\s*<\/strong>/i
  )
  if (autoResumeMatch) {
    return { minMph: null, autoResume: true, badgeText: "ACC auto resume" }
  }

  // Match "while driving above X mph"
  const whileDrivingMatch = detailText.match(
    /adaptive cruise control\s*<strong>\s*(while driving above\s+\d+\s*mph)\s*<\/strong>/i
  )
  if (whileDrivingMatch) {
    const mph = parseSpeedMph(whileDrivingMatch[1])
    return {
      minMph: mph,
      autoResume: false,
      badgeText: mph ? `ACC above ${mph} mph` : "ACC speed limited",
    }
  }

  // Check for plain text patterns
  const plainAutoResume =
    /adaptive cruise control\s+that automatically resumes from a stop/i.test(
      detailText
    )
  if (plainAutoResume) {
    return { minMph: null, autoResume: true, badgeText: "ACC auto resume" }
  }

  const plainAboveMatch = detailText.match(
    /adaptive cruise control\s+(?:while driving above\s+)?(\d+)\s*mph/i
  )
  if (plainAboveMatch) {
    const mph = Number(plainAboveMatch[1])
    return { minMph: mph, autoResume: false, badgeText: `ACC above ${mph} mph` }
  }

  return { minMph: null, autoResume: false, badgeText: null }
}

function normalizeDetailSentence(detailSentence: string): {
  badges: Array<SupportBadge>
  alcMinMph: number | null
  alcAllSpeeds: boolean
  accMinMph: number | null
  accAutoResume: boolean
  experimentalMode: boolean
  tightTurnWarning: boolean
  nodes: Array<DetailNode>
} {
  const detailText = detailSentence.toLowerCase()
  const badges: Array<SupportBadge> = []

  // Extract ALC info
  const alcInfo = extractAlcInfo(detailSentence)
  if (alcInfo.badgeText) {
    badges.push({
      id: "alc",
      label: alcInfo.badgeText,
      variant: "default",
    })
  }

  // Extract ACC info
  const accInfo = extractAccInfo(detailSentence)
  if (accInfo.badgeText) {
    badges.push({
      id: "acc",
      label: accInfo.badgeText,
      variant: "default",
    })
  }

  // Check for experimental mode
  const experimentalMode = /experimental mode/i.test(detailText)
  if (experimentalMode) {
    badges.push({
      id: "experimental",
      label: "Experimental mode",
      variant: "secondary",
    })
  }

  // Check for tight turn warning
  const tightTurnWarning =
    /may not be able to take tight turns on its own/i.test(detailText)
  if (tightTurnWarning) {
    badges.push({
      id: "tight-turns",
      label: "May struggle in tight turns",
      variant: "destructive",
    })
  }

  // Check for traffic light handling
  const trafficLightHandling = /traffic light and stop sign handling/i.test(
    detailText
  )
  if (trafficLightHandling && !experimentalMode) {
    badges.push({
      id: "traffic-lights",
      label: "Traffic light & stop sign handling",
      variant: "secondary",
    })
  }

  // Parse HTML into structured nodes
  const nodes = parseDetailSentence(detailSentence)

  return {
    badges,
    alcMinMph: alcInfo.minMph,
    alcAllSpeeds: alcInfo.allSpeeds,
    accMinMph: accInfo.minMph,
    accAutoResume: accInfo.autoResume,
    experimentalMode,
    tightTurnWarning,
    nodes,
  }
}

function normalizePackage(packageText: string) {
  if (packageText === "All") {
    return "All trims and packages"
  }
  return packageText
}

function normalizeConnector(harnessConnector: string) {
  if (!harnessConnector) {
    return "No harness listed"
  }
  return harnessConnector
}

function normalizeNotes(notes: Array<string>) {
  return notes.map(stripHtml)
}

function parseYears(yearList: string) {
  return (yearList.match(/\d{4}/g) ?? []).map(Number)
}

function buildSearchText(row: Omit<VehicleRow, "searchText">) {
  const detailText = row.detailSentence.map((node) => node.content).join(" ")

  return [
    row.make,
    row.name,
    row.model,
    row.years,
    row.yearList,
    row.packageSummary,
    row.harnessConnector,
    row.connectorSummary,
    ...row.supportBadges.map((badge) => badge.label),
    ...row.footnotes,
    ...row.setupNotes,
    detailText,
  ]
    .join(" ")
    .toLowerCase()
}

function normalizeVehicles(dataset: VehicleDataset) {
  const rows: Array<VehicleRow> = []

  for (const [make, vehicles] of Object.entries(dataset)) {
    for (const vehicle of vehicles) {
      const yearsNumeric = parseYears(vehicle.year_list)
      const earliestYear =
        yearsNumeric.length > 0 ? Math.min(...yearsNumeric) : null
      const latestYear =
        yearsNumeric.length > 0 ? Math.max(...yearsNumeric) : null
      const detail = normalizeDetailSentence(vehicle.detail_sentence)
      const packageSummary = normalizePackage(vehicle.package)
      const connectorSummary = normalizeConnector(vehicle.harness_connector)
      const footnotes = normalizeNotes(vehicle.footnotes)
      const setupNotes = normalizeNotes(vehicle.setup_notes)

      const partialRow = {
        id: `${make}::${vehicle.name}`,
        make,
        name: vehicle.name,
        model: vehicle.model,
        years: vehicle.years,
        yearList: vehicle.year_list,
        yearsNumeric,
        earliestYear,
        latestYear,
        packageText: vehicle.package,
        packageSummary,
        harnessConnector: vehicle.harness_connector,
        connectorSummary,
        video: vehicle.video,
        setupVideo: vehicle.setup_video,
        detailSentence: detail.nodes,
        footnotes,
        setupNotes,
        alcMinMph: detail.alcMinMph,
        alcAllSpeeds: detail.alcAllSpeeds,
        accMinMph: detail.accMinMph,
        accAutoResume: detail.accAutoResume,
        experimentalMode: detail.experimentalMode,
        tightTurnWarning: detail.tightTurnWarning,
        hasVideo: Boolean(vehicle.video),
        hasSetupVideo: Boolean(vehicle.setup_video),
        hasNotes: footnotes.length > 0 || setupNotes.length > 0,
        supportBadges: detail.badges,
      }

      rows.push({
        ...partialRow,
        searchText: buildSearchText(partialRow),
      })
    }
  }

  return rows
}

export const VEHICLE_ROWS = normalizeVehicles(vehiclesDataset)

export const VEHICLE_STATS = {
  rows: VEHICLE_ROWS.length,
  makes: new Set(VEHICLE_ROWS.map((row) => row.make)).size,
  connectors: new Set(
    VEHICLE_ROWS.map((row) => row.harnessConnector).filter(
      (connector) => connector.length > 0
    )
  ).size,
  videos: VEHICLE_ROWS.filter((row) => row.hasVideo).length,
}

export const VEHICLE_MAKES = [
  ...new Set(VEHICLE_ROWS.map((row) => row.make)),
].sort((left, right) => left.localeCompare(right))

export const VEHICLE_MAKE_COUNTS: Record<string, number> = Object.fromEntries(
  VEHICLE_MAKES.map((make) => [
    make,
    VEHICLE_ROWS.filter((row) => row.make === make).length,
  ])
)

const allYears = VEHICLE_ROWS.flatMap((row) => row.yearsNumeric)
export const MIN_VEHICLE_YEAR = Math.min(...allYears)
export const MAX_VEHICLE_YEAR = Math.max(...allYears)

const brandLogoMapping: Record<string, string> = {
  Acura: "Logo-Acura.png",
  Audi: "Logo-Audi.png",
  BMW: "Logo-BMW.png",
  Buick: "Logo-Buick.png",
  Cadillac: "Logo-Cadillac.png",
  Chevrolet: "Logo-Chevrolet.png",
  Chrysler: "Logo-Chrysler.png",
  CUPRA: "Logo-CUPRA.png",
  Dodge: "Logo-Dodge.png",
  Ford: "Logo-Ford.png",
  GMC: "Logo-GMC.png",
  Genesis: "Logo-Genesis.png",
  Honda: "Logo-Honda.png",
  Hyundai: "Logo-Hyundai.png",
  Infiniti: "Logo-Infiniti.png",
  Jeep: "Logo-Jeep.png",
  Kia: "Logo-Kia.png",
  "Land Rover": "Logo-Land-Rover.png",
  Lexus: "Logo-Lexus.png",
  Lincoln: "Logo-Lincoln.png",
  MAN: "Logo-MAN.png",
  Mazda: "Logo-Mazda.png",
  "Mercedes-Benz": "Logo-Mercedes-Benz.png",
  Nissan: "Logo-Nissan.png",
  Ram: "Logo-Ram.png",
  Rivian: "Logo-Rivian.png",
  SEAT: "Logo-SEAT.png",
  Škoda: "Logo-Škoda.png",
  Subaru: "Logo-Subaru.png",
  Tesla: "Logo-Tesla.png",
  Toyota: "Logo-Toyota.png",
  Volkswagen: "Logo-Volkswagen.png",
  Volvo: "Logo-Volvo.png",
}

export function getBrandLogo(make: string): string | null {
  const logoFile = brandLogoMapping[make]
  return logoFile ? `/brand-icons/${logoFile}` : null
}

export const FEATURE_FILTER_OPTIONS = Object.keys(
  featureFilterLabels
) as Array<FeatureFilter>

const FEATURE_FILTER_ID_SET = new Set<FeatureFilter>(FEATURE_FILTER_OPTIONS)

export const FEATURE_FILTER_LABELS = featureFilterLabels

/** Parse a single URL token: `all-speeds` (include) or `!tight-turns` (exclude). */
export function parseFeatureFilterUrlToken(
  token: string
): FeatureFilterEntry | null {
  const isExclude = token.startsWith("!")
  const raw = (isExclude ? token.slice(1) : token) as FeatureFilter
  if (!FEATURE_FILTER_ID_SET.has(raw)) return null
  return { feature: raw, mode: isExclude ? "exclude" : "include" }
}

/**
 * Normalize raw search `features` into validated URL tokens (last repeated key wins).
 */
export function parseFeatureFilterUrlStrings(
  value: unknown
): Array<string> | undefined {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? [value]
      : []
  const byFeature = new Map<FeatureFilter, string>()
  for (const entry of values) {
    if (typeof entry !== "string") continue
    const parsed = parseFeatureFilterUrlToken(entry)
    if (!parsed) continue
    byFeature.set(
      parsed.feature,
      parsed.mode === "exclude" ? `!${parsed.feature}` : parsed.feature
    )
  }
  const arr = [...byFeature.values()]
  return arr.length > 0 ? arr : undefined
}

export function urlStringsToFeatureEntries(
  strings: Array<string>
): Array<FeatureFilterEntry> {
  const byFeature = new Map<FeatureFilter, FeatureFilterEntry>()
  for (const entry of strings) {
    const parsed = parseFeatureFilterUrlToken(entry)
    if (!parsed) continue
    byFeature.set(parsed.feature, parsed)
  }
  return [...byFeature.values()]
}

export function featureEntriesToUrlStrings(
  entries: Array<FeatureFilterEntry>
): Array<string> {
  return entries.map((e) =>
    e.mode === "exclude" ? `!${e.feature}` : e.feature
  )
}

export const FEATURE_FILTER_COUNTS: Record<FeatureFilter, number> = {
  "all-speeds": VEHICLE_ROWS.filter((row) => row.alcAllSpeeds).length,
  "alc-min-speed": VEHICLE_ROWS.filter((row) => row.alcMinMph !== null).length,
  "acc-auto-resume": VEHICLE_ROWS.filter((row) => row.accAutoResume).length,
  "experimental-mode": VEHICLE_ROWS.filter((row) => row.experimentalMode)
    .length,
  "tight-turns": VEHICLE_ROWS.filter((row) => row.tightTurnWarning).length,
  "has-video": VEHICLE_ROWS.filter((row) => row.hasVideo).length,
}

export const SORT_OPTIONS = Object.keys(sortLabels) as Array<SortKey>

export const SORT_LABELS = sortLabels
