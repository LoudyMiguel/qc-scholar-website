const env = import.meta.env

function readEnv(key, fallback = '') {
  const value = env[key]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export const siteConfig = Object.freeze({
  name: 'GenXYZ Lab',
  tagline: 'Learn. Practice. Build. Get certified.',
  version: readEnv('VITE_APP_VERSION', '1.0.0'),
  releaseDate: readEnv('VITE_RELEASE_DATE'),
  // Absolute origin. Canonical links, Open Graph images, and the sitemap all
  // need one; a relative og:image is ignored by most crawlers and scrapers.
  siteUrl: readEnv('VITE_SITE_URL', 'https://genxyzlab.com').replace(/\/+$/, ''),
  termuxUrl: 'https://f-droid.org/en/packages/com.termux/',
  termuxDocsUrl: 'https://github.com/termux/termux-app#installation',
})

// A release that has not been uploaded yet keeps this hostname. Every surface
// checks `isPlaceholder` instead of testing the URL again, so an unfinished
// platform is announced honestly rather than handing out a dead link.
const PLACEHOLDER_HOST = 'downloads.example.com'

function buildRelease({ id, name, shortName, fileKind, urlKey, sizeKey, fallbackUrl, fallbackSize, requirement, note }) {
  const url = readEnv(urlKey, fallbackUrl)
  return Object.freeze({
    id,
    name,
    shortName,
    fileKind,
    url,
    size: readEnv(sizeKey, fallbackSize),
    requirement,
    note,
    isPlaceholder: url.includes(PLACEHOLDER_HOST),
  })
}

export const releases = Object.freeze([
  buildRelease({
    id: 'android',
    name: 'Android',
    shortName: 'Android',
    fileKind: 'APK',
    urlKey: 'VITE_APK_DOWNLOAD_URL',
    sizeKey: 'VITE_APK_SIZE',
    fallbackUrl: `https://${PLACEHOLDER_HOST}/genxyz-lab-latest.apk`,
    fallbackSize: '~100 MB',
    requirement: 'Android 8.0 or newer · arm64',
    note: 'Install Termux first if you want on-device compilers.',
  }),
  buildRelease({
    id: 'windows',
    name: 'Windows',
    shortName: 'Windows',
    fileKind: 'ZIP',
    urlKey: 'VITE_WINDOWS_DOWNLOAD_URL',
    sizeKey: 'VITE_WINDOWS_SIZE',
    fallbackUrl: `https://${PLACEHOLDER_HOST}/genxyz-lab-latest-windows.zip`,
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
