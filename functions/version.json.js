const RELEASE_MANIFEST_URL = 'https://downloads.genxyzlab.org/version.json'

export async function onRequest({ request }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { Allow: 'GET, HEAD' },
    })
  }

  try {
    const upstream = await fetch(RELEASE_MANIFEST_URL, {
      headers: { Accept: 'application/json' },
      cf: { cacheEverything: true, cacheTtl: 60 },
    })

    if (!upstream.ok) throw new Error(`Release service returned HTTP ${upstream.status}`)

    return new Response(request.method === 'HEAD' ? null : upstream.body, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60, must-revalidate',
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Release manifest proxy failed.', error)
    return Response.json(
      { error: 'Release metadata is temporarily unavailable.' },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'Retry-After': '60',
          'X-Content-Type-Options': 'nosniff',
        },
      },
    )
  }
}
