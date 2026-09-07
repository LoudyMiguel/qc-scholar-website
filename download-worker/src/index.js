const ASSETS = Object.freeze({
  '/latest.apk': Object.freeze({
    platform: 'android',
    name: 'GenXYZ-Lab.apk',
    contentType: 'application/vnd.android.package-archive',
  }),
  '/latest-windows.zip': Object.freeze({
    platform: 'windows',
    name: 'GenXYZ-Lab-Windows.zip',
    contentType: 'application/zip',
  }),
})

const SECURITY_HEADERS = Object.freeze({
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
})

class ReleaseLookupError extends Error {
  constructor(message, status = 503) {
    super(message)
    this.status = status
  }
}

function cacheSeconds(env) {
  const configured = Number.parseInt(env.RELEASE_CACHE_SECONDS || '60', 10)
  return Number.isFinite(configured) ? Math.min(300, Math.max(15, configured)) : 60
}

function githubHeaders(env) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'GenXYZ-Lab-download-worker',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`
  return headers
}

function latestAssetUrl(env, assetName) {
  const owner = env.GITHUB_OWNER || 'LoudyMiguel'
  const repository = env.GITHUB_REPOSITORY || 'GenXYZ-Lab-Releases'
  return `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/releases/latest/download/${encodeURIComponent(assetName)}`
}

async function fetchLatestRelease(env, context) {
  const owner = env.GITHUB_OWNER || 'LoudyMiguel'
  const repository = env.GITHUB_REPOSITORY || 'GenXYZ-Lab-Releases'
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/releases/latest`
  const cacheKey = new Request(
    `https://release-cache.genxyzlab.invalid/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`,
  )
  const edgeCache = typeof caches === 'undefined' ? null : caches.default
  const cached = edgeCache ? await edgeCache.match(cacheKey) : null
  if (cached) return cached.json()

  const response = await fetch(apiUrl, { headers: githubHeaders(env) })
  if (!response.ok) {
    const rateLimited = response.status === 403 || response.status === 429
    throw new ReleaseLookupError(
      rateLimited
        ? 'GitHub temporarily rate-limited the release lookup.'
        : `GitHub release lookup returned HTTP ${response.status}.`,
    )
  }

  const release = await response.json()
  if (!release || release.draft || release.prerelease || !Array.isArray(release.assets)) {
    throw new ReleaseLookupError('No published stable GitHub release is available.')
  }

  if (edgeCache) {
    const cacheResponse = Response.json(release, {
      headers: { 'Cache-Control': `public, max-age=${cacheSeconds(env)}` },
    })
    context.waitUntil(edgeCache.put(cacheKey, cacheResponse))
  }

  return release
}

function verifiedAsset(release, expectedName) {
  const asset = release.assets.find(
    (candidate) => candidate.name === expectedName && candidate.state === 'uploaded',
  )
  if (!asset?.browser_download_url || !(asset.size > 0)) {
    throw new ReleaseLookupError(`The latest release is missing ${expectedName}.`)
  }

  const downloadUrl = new URL(asset.browser_download_url)
  if (
    downloadUrl.protocol !== 'https:' ||
    downloadUrl.hostname !== 'github.com' ||
    !downloadUrl.pathname.includes('/releases/download/')
  ) {
    throw new ReleaseLookupError(`GitHub returned an invalid URL for ${expectedName}.`)
  }

  return asset
}

function publicVersion(tagName) {
  const version = String(tagName || '').replace(/^v/i, '')
  return /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version) ? version : '0.0.0'
}

function fileSize(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function noStoreHeaders(extra = {}) {
  return {
    ...SECURITY_HEADERS,
    'Cache-Control': 'private, no-store, max-age=0',
    ...extra,
  }
}

function headResponse(response) {
  return new Response(null, {
    status: response.status,
    headers: response.headers,
  })
}

function jsonResponse(value, status = 200) {
  return Response.json(value, {
    status,
    headers: noStoreHeaders({ 'Access-Control-Allow-Origin': '*' }),
  })
}

function errorResponse(message, status = 503, headOnly = false) {
  const body = `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Download temporarily unavailable · GenXYZ Lab</title>
<body style="margin:0;background:#020617;color:#e2e8f0;font:16px/1.6 system-ui,sans-serif">
<main style="max-width:42rem;margin:12vh auto;padding:2rem">
<p style="color:#a5b4fc;font-weight:700">GENXYZ LAB</p>
<h1>Download temporarily unavailable</h1>
<p>${message}</p><p>Please wait a minute and try again.</p>
</main></body></html>`

  return new Response(headOnly ? null : body, {
    status,
    headers: noStoreHeaders({
      'Content-Type': 'text/html; charset=utf-8',
      'Retry-After': '60',
    }),
  })
}

async function handleVersion(request, env, context) {
  const release = await fetchLatestRelease(env, context)
  const android = verifiedAsset(release, ASSETS['/latest.apk'].name)
  const windows = verifiedAsset(release, ASSETS['/latest-windows.zip'].name)
  const origin = new URL(request.url).origin
  const version = publicVersion(release.tag_name)
  const releaseDate = String(release.published_at || '').slice(0, 10)
  const notes = String(release.body || release.name || '').trim()

  return jsonResponse({
    android: {
      version,
      url: `${origin}/latest.apk`,
      size: fileSize(android.size),
      releaseDate,
      notes,
    },
    windows: {
      version,
      url: `${origin}/latest-windows.zip`,
      size: fileSize(windows.size),
      releaseDate,
      notes,
    },
  })
}

async function handleRequest(request, env, context) {
  const url = new URL(request.url)
  const headOnly = request.method === 'HEAD'

  if (request.method !== 'GET' && !headOnly) {
    return new Response('Method not allowed', {
      status: 405,
      headers: noStoreHeaders({ Allow: 'GET, HEAD' }),
    })
  }

  try {
    if (url.pathname === '/version.json') {
      const response = await handleVersion(request, env, context)
      return headOnly ? headResponse(response) : response
    }

    if (url.pathname === '/health') {
      const release = await fetchLatestRelease(env, context)
      const assets = Object.values(ASSETS).map(({ platform, name }) => ({
        platform,
        name,
        available: Boolean(release.assets.find((asset) => asset.name === name && asset.size > 0)),
      }))
      const healthy = assets.every((asset) => asset.available)
      const response = jsonResponse(
        { ok: healthy, release: release.tag_name, assets },
        healthy ? 200 : 503,
      )
      return headOnly ? headResponse(response) : response
    }

    const route = ASSETS[url.pathname]
    if (!route) {
      return new Response(headOnly ? null : 'Not found', {
        status: 404,
        headers: noStoreHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }),
      })
    }

    return new Response(null, {
      status: 307,
      headers: noStoreHeaders({
        // The download path deliberately does not call GitHub's REST API.
        // GitHub resolves this official stable URL itself, so a shared
        // unauthenticated API rate limit can never block a real download.
        Location: latestAssetUrl(env, route.name),
        'X-GenXYZ-Release': 'latest',
      }),
    })
  } catch (error) {
    console.error(JSON.stringify({
      event: 'release_lookup_failed',
      path: url.pathname,
      message: error instanceof Error ? error.message : String(error),
    }))
    return errorResponse(
      error instanceof Error ? error.message : 'The release service could not be reached.',
      error instanceof ReleaseLookupError ? error.status : 503,
      headOnly,
    )
  }
}

export default {
  fetch: handleRequest,
}

export { handleRequest }
