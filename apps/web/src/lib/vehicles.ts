import vehiclesSource from "./vehicles.json"

export type FeatureFilter =
  | "all-speeds"
  | "speed-limited"
  | "stop-and-go"
  | "experimental"
  | "tight-turn-warning"
  | "video"

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

export type SupportBulletTone = "positive" | "info" | "warning"

export type SupportBullet = {
  label: string
  text: string
  tone: SupportBulletTone
}

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
  detailSentence: string
  detailPlainText: string
  supportBullets: Array<SupportBullet>
  footnotes: Array<string>
  setupNotes: Array<string>
  laneCenteringMinMph: number | null
  adaptiveCruiseMinMph: number | null
  laneCenteringAllSpeeds: boolean
  adaptiveCruiseAutoResume: boolean
  experimentalMode: boolean
  tightTurnWarning: boolean
  hasVideo: boolean
  hasSetupVideo: boolean
  hasNotes: boolean
  searchText: string
}

const vehiclesDataset = vehiclesSource as VehicleDataset

const featureFilterLabels: Record<FeatureFilter, string> = {
  "all-speeds": "Lane centering at all speeds",
  "speed-limited": "Speed-limited support",
  "stop-and-go": "Auto resume from stop",
  experimental: "Experimental mode",
  "tight-turn-warning": "Tight-turn caution",
  video: "Has video",
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

function stripHtml(value: string) {
  const withBreaks = value.replace(/<br\s*\/?\s*>/gi, " ")

  return normalizeWhitespace(
    decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, " "))
  )
}

function parseSpeedPhrase(phrase: string | undefined) {
  if (!phrase) {
    return null
  }

  const match = phrase.match(/(\d+) mph/i)

  return match ? Number(match[1]) : null
}

function describeLaneCentering(phrase: string | undefined) {
  if (!phrase) {
    return {
      text: "Automates lane centering with openpilot support.",
      allSpeeds: false,
      minMph: null,
    }
  }

  if (phrase === "at all speeds") {
    return {
      text: "Keeps the vehicle centered in-lane at all speeds.",
      allSpeeds: true,
      minMph: null,
    }
  }

  const minMph = parseSpeedPhrase(phrase)
  const normalizedPhrase = phrase.replace(/^while driving /i, "")

  return {
    text: `Keeps the vehicle centered in-lane ${normalizedPhrase}.`,
    allSpeeds: false,
    minMph,
  }
}

function describeAdaptiveCruise(phrase: string | undefined) {
  if (!phrase) {
    return {
      text: "Maintains distance to the car ahead with adaptive cruise control.",
      autoResume: false,
      minMph: null,
    }
  }

  if (phrase === "that automatically resumes from a stop") {
    return {
      text: "Maintains following distance and automatically resumes from a stop.",
      autoResume: true,
      minMph: null,
    }
  }

  return {
    text: `Maintains following distance ${phrase}.`,
    autoResume: false,
    minMph: parseSpeedPhrase(phrase),
  }
}

function normalizeDetailSentence(detailSentence: string) {
  const detailPlainText = stripHtml(detailSentence)
  const supportBullets: Array<SupportBullet> = []

  const laneMatch = detailPlainText.match(
    /automated lane centering(?: (at all speeds|above \d+ mph|while driving above \d+ mph))?/i
  )
  const accMatch = detailPlainText.match(
    /adaptive cruise control(?: (that automatically resumes from a stop|while driving above \d+ mph))?/i
  )

  const laneCentering = describeLaneCentering(laneMatch?.[1])
  const adaptiveCruise = describeAdaptiveCruise(accMatch?.[1])
  const experimentalMode =
    /Traffic light and stop sign handling is also available in Experimental mode\./i.test(
      detailPlainText
    )
  const tightTurnWarning =
    /This car may not be able to take tight turns on its own\./i.test(
      detailPlainText
    )

  if (laneMatch) {
    supportBullets.push({
      label: "Lane centering",
      text: laneCentering.text,
      tone: "positive",
    })
  }

  if (accMatch) {
    supportBullets.push({
      label: "Adaptive cruise",
      text: adaptiveCruise.text,
      tone: "positive",
    })
  }

  if (experimentalMode) {
    supportBullets.push({
      label: "Experimental mode",
      text: "Adds traffic light and stop sign handling.",
      tone: "info",
    })
  }

  if (tightTurnWarning) {
    supportBullets.push({
      label: "Steering note",
      text: "May struggle with tighter turns without driver input.",
      tone: "warning",
    })
  }

  if (supportBullets.length === 0) {
    supportBullets.push({
      label: "Support",
      text: detailPlainText,
      tone: "info",
    })
  }

  return {
    detailPlainText,
    supportBullets,
    laneCenteringMinMph: laneCentering.minMph,
    adaptiveCruiseMinMph: adaptiveCruise.minMph,
    laneCenteringAllSpeeds: laneCentering.allSpeeds,
    adaptiveCruiseAutoResume: adaptiveCruise.autoResume,
    experimentalMode,
    tightTurnWarning,
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
  return [
    row.make,
    row.name,
    row.model,
    row.years,
    row.yearList,
    row.packageSummary,
    row.harnessConnector,
    row.connectorSummary,
    row.detailPlainText,
    ...row.supportBullets.map((bullet) => `${bullet.label} ${bullet.text}`),
    ...row.footnotes,
    ...row.setupNotes,
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
        detailSentence: vehicle.detail_sentence,
        detailPlainText: detail.detailPlainText,
        supportBullets: detail.supportBullets,
        footnotes,
        setupNotes,
        laneCenteringMinMph: detail.laneCenteringMinMph,
        adaptiveCruiseMinMph: detail.adaptiveCruiseMinMph,
        laneCenteringAllSpeeds: detail.laneCenteringAllSpeeds,
        adaptiveCruiseAutoResume: detail.adaptiveCruiseAutoResume,
        experimentalMode: detail.experimentalMode,
        tightTurnWarning: detail.tightTurnWarning,
        hasVideo: Boolean(vehicle.video),
        hasSetupVideo: Boolean(vehicle.setup_video),
        hasNotes: footnotes.length > 0 || setupNotes.length > 0,
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

export const VEHICLE_CONNECTORS = [
  ...new Set(
    VEHICLE_ROWS.map((row) => row.harnessConnector).filter(
      (connector) => connector.length > 0
    )
  ),
].sort((left, right) => left.localeCompare(right))

export const FEATURE_FILTER_OPTIONS = Object.keys(
  featureFilterLabels
) as Array<FeatureFilter>

export const FEATURE_FILTER_LABELS = featureFilterLabels

export const FEATURE_FILTER_COUNTS: Record<FeatureFilter, number> = {
  "all-speeds": VEHICLE_ROWS.filter((row) => row.laneCenteringAllSpeeds).length,
  "speed-limited": VEHICLE_ROWS.filter(
    (row) =>
      row.laneCenteringMinMph !== null || row.adaptiveCruiseMinMph !== null
  ).length,
  "stop-and-go": VEHICLE_ROWS.filter((row) => row.adaptiveCruiseAutoResume)
    .length,
  experimental: VEHICLE_ROWS.filter((row) => row.experimentalMode).length,
  "tight-turn-warning": VEHICLE_ROWS.filter((row) => row.tightTurnWarning)
    .length,
  video: VEHICLE_ROWS.filter((row) => row.hasVideo).length,
}

export const SORT_OPTIONS = Object.keys(sortLabels) as Array<SortKey>

export const SORT_LABELS = sortLabels
