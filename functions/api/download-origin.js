// 0.25° is roughly 25-28 km: enough to put a dot on the right city, and about
// as fine as Cloudflare's IP-based location really is. It is a power-of-two
// fraction, so every snapped value is exact in binary floating point and the
// database rules can verify it with `(value * 4) % 1 === 0`.
// Records written before this change used a 5° grid; those values remain valid.
const GRID_DEGREES = 0.25

function snapCoordinate(value, minimum, maximum) {
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  const snapped = Math.round(number / GRID_DEGREES) * GRID_DEGREES
  return Math.min(maximum, Math.max(minimum, Object.is(snapped, -0) ? 0 : snapped))
}

export function onRequestPost({ request }) {
  const lat = snapCoordinate(request.cf?.latitude, -90, 90)
  const lng = snapCoordinate(request.cf?.longitude, -180, 180)
  const available = lat !== null && lng !== null

  return Response.json(
    available ? { available, lat, lng, gridDegrees: GRID_DEGREES } : { available },
    {
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  )
}

export function onRequest() {
  return new Response('Method not allowed', {
    status: 405,
    headers: { Allow: 'POST' },
  })
}
