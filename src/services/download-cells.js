// Pure helpers for the download map's location cells. Kept free of Firebase
// imports so they can be unit-tested with `node --test`.

// Precise cells: must match GRID_DEGREES in functions/api/download-origin.js
// and the `* 4) % 1` checks under stats/download_locations in
// database.rules.json.
export const LOCATION_CELLS_PER_DEGREE = 4

// Downloads recorded before October 2026 were rounded to 5° regions and live
// under stats/download_origins. New downloads fall back to that grid only
// while the deployed database rules predate stats/download_locations.
export const LEGACY_REGION_DEGREES = 5

export function isLocationGridValue(value) {
  return Number.isFinite(value) && Number.isInteger(value * LOCATION_CELLS_PER_DEGREE)
}

export function toLegacyRegion(value) {
  const snapped = Math.round(value / LEGACY_REGION_DEGREES) * LEGACY_REGION_DEGREES
  return Object.is(snapped, -0) ? 0 : snapped
}

// Firebase keys cannot contain '.', so 14.25 is written as 14p25.
export function cellKey(lat, lng) {
  const encode = (value, positive, negative) =>
    `${value >= 0 ? positive : negative}${String(Math.abs(value)).replace('.', 'p')}`
  return `${encode(lat, 'n', 's')}_${encode(lng, 'e', 'w')}`
}

// Turns raw database children ([key, value] pairs) into validated cells,
// busiest first. Malformed records are skipped rather than drawn.
export function parseCells(entries) {
  const cells = []
  for (const [id, raw] of entries) {
    const value = raw && typeof raw === 'object' ? raw : {}
    const lat = Number(value.lat)
    const lng = Number(value.lng)
    const count = Number(value.count)
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180 ||
      !Number.isSafeInteger(count) ||
      count <= 0
    ) {
      continue
    }
    cells.push({
      id,
      lat,
      lng,
      count,
      android: Number.isSafeInteger(value.android) ? value.android : 0,
      windows: Number.isSafeInteger(value.windows) ? value.windows : 0,
    })
  }
  return cells.sort((a, b) => b.count - a.count)
}
