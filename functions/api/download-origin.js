const GRID_DEGREES = 5

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
