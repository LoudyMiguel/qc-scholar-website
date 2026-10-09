// Pure helpers for the download map's location cells. Kept free of Firebase
// imports so they can be unit-tested with `node --test`.

// 0.25° is roughly 25-28 km: enough to put a dot on the right city, and about
// as fine as Cloudflare's IP-based location really is. It is a power-of-two
// fraction, so every snapped value is exact in binary floating point.
export const LOCATION_CELLS_PER_DEGREE = 4

export function isLocationGridValue(value) {
  return Number.isFinite(value) && Number.isInteger(value * LOCATION_CELLS_PER_DEGREE)
}

/** Snaps a coordinate to the 0.25° grid, clamped to its range; null if unusable. */
export function snapToLocationGrid(value, minimum, maximum) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  const snapped = Math.round(number * LOCATION_CELLS_PER_DEGREE) / LOCATION_CELLS_PER_DEGREE
  const clamped = Math.min(maximum, Math.max(minimum, snapped))
  return Object.is(clamped, -0) ? 0 : clamped
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
