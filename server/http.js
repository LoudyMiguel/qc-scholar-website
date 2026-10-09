// Request checks shared by the write endpoints.

/**
 * Browsers send Origin on every cross-origin and same-origin POST from fetch.
 * Requiring it to match keeps other sites from posting through a visitor's
 * browser. A script can forge it, which is why the limits still apply.
 */
export function isSameOrigin(request) {
  const origin = request.headers.get('Origin')
  return Boolean(origin) && origin === new URL(request.url).origin
}

/** Parses a small JSON object body; returns null for anything else. */
export async function readJsonBody(request, maxBytes) {
  if (!/^application\/json\b/i.test(request.headers.get('Content-Type') || '')) return null
  const declared = Number(request.headers.get('Content-Length'))
  if (Number.isFinite(declared) && declared > maxBytes) return null
  const text = await request.text()
  if (new TextEncoder().encode(text).length > maxBytes) return null
  try {
    const value = JSON.parse(text)
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null
  } catch {
    return null
  }
}

export function methodNotAllowed() {
  return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } })
}
