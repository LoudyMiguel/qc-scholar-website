import releaseManifest from '../../release-manifest.json'

const env = import.meta.env

function readEnv(key, fallback = '') {
  const value = env[key]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export const siteConfig = Object.freeze({
  name: 'GenXYZ Lab',
  tagline: 'Learn. Practice. Build. Get certified.',
  version: releaseManifest.android?.version || readEnv('VITE_APP_VERSION', '1.0.0'),
  releaseDate: releaseManifest.android?.releaseDate || readEnv('VITE_RELEASE_DATE'),
  // Absolute origin. Canonical links, Open Graph images, and the sitemap all
  // need one; a relative og:image is ignored by most crawlers and scrapers.
  siteUrl: readEnv('VITE_SITE_URL', 'https://genxyzlab.org').replace(/\/+$/, ''),
  termuxUrl: 'https://f-droid.org/en/packages/com.termux/',
  termuxDocsUrl: 'https://github.com/termux/termux-app#installation',
})

function isGoogleDriveUrl(value) {
  if (!value) return false

  try {
    const parsedUrl = new URL(value)
    const hostname = parsedUrl.hostname.toLowerCase()
    return (
      parsedUrl.protocol === 'https:' &&
      (hostname === 'drive.google.com' || hostname === 'drive.usercontent.google.com')
    )
  } catch {
    return false
  }
}

function buildRelease({
  id,
  name,
  shortName,
  fileKind,
  urlKey,
  sizeKey,
  fallbackSize,
  requirement,
  note,
}) {
  const manifestEntry = releaseManifest[id] || {}
  const url = manifestEntry.url || readEnv(urlKey)
  return Object.freeze({
    id,
    name,
    shortName,
    fileKind,
    url,
    size: manifestEntry.size || readEnv(sizeKey, fallbackSize),
    requirement,
    note,
    // Only Google Drive is accepted as a release source. A missing, malformed,
    // or stale non-Drive value disables the button instead of leaking users
    // back to an obsolete host.
    isPlaceholder: !isGoogleDriveUrl(url),
  })
}

export const releases = Object.freeze([
  buildRelease({
    id: 'android',
    name: 'Android',
    shortName: 'Android',
    fileKind: 'APK',
    urlKey: 'VITE_APK_GOOGLE_DRIVE_URL',
    sizeKey: 'VITE_APK_SIZE',
    fallbackSize: '~100 MB',
    requirement: 'Android 8.0 or newer · arm64',
    note: 'Install Termux first if you want on-device compilers.',
  }),
  buildRelease({
    id: 'windows',
    name: 'Windows',
    shortName: 'Windows',
    fileKind: 'ZIP',
    urlKey: 'VITE_WINDOWS_GOOGLE_DRIVE_URL',
    sizeKey: 'VITE_WINDOWS_SIZE',
    fallbackSize: '~120 MB',
    requirement: 'Windows 10 or 11 · 64-bit',
    note: 'Uses the compilers already installed on your PC.',
  }),
])

export const releasesById = Object.freeze(
  Object.fromEntries(releases.map((release) => [release.id, release])),
)

export const hasPlaceholderRelease = releases.some((release) => release.isPlaceholder)

/**
 * Best-effort guess at the visitor's platform so the download control can lead
 * with the build they most likely want. This only reorders and preselects —
 * every platform stays one click away, because UA sniffing is a hint and not a
 * fact (desktop-mode browsers on tablets report a desktop UA and vice versa).
 */
export function detectPlatform() {
  if (typeof navigator === 'undefined') return 'android'

  const ua = `${navigator.userAgent || ''} ${navigator.platform || ''}`.toLowerCase()
  if (/android/.test(ua)) return 'android'
  if (/windows|win32|win64/.test(ua)) return 'windows'

  // An iPad in desktop mode reports as macOS but still has touch points, so
  // treat any remaining touch device as the mobile build.
  if (navigator.maxTouchPoints > 1 && /mac/.test(ua)) return 'android'
  return 'windows'
}
