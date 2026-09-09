import assert from 'node:assert/strict'
import test from 'node:test'

import { handleRequest } from './index.js'

const env = {
  GITHUB_OWNER: 'LoudyMiguel',
  GITHUB_REPOSITORY: 'GenXYZ-Lab-Releases',
  RELEASE_CACHE_SECONDS: '60',
  FALLBACK_RELEASE_VERSION: '3.0.0',
  FALLBACK_RELEASE_DATE: '2026-09-09',
  FALLBACK_ANDROID_SIZE_BYTES: '80359296',
  FALLBACK_WINDOWS_SIZE_BYTES: '34722789',
  FALLBACK_RELEASE_NOTES: 'Fallback release notes',
}

const release = {
  tag_name: 'v2.2.0',
  name: 'GenXYZ Lab 2.2.0',
  body: 'Release notes',
  draft: false,
  prerelease: false,
  published_at: '2026-09-08T10:00:00Z',
  assets: [
    {
      name: 'GenXYZ-Lab.apk',
      state: 'uploaded',
      size: 80 * 1024 * 1024,
      browser_download_url:
        'https://github.com/LoudyMiguel/GenXYZ-Lab-Releases/releases/download/v2.2.0/GenXYZ-Lab.apk',
    },
    {
      name: 'GenXYZ-Lab-Windows.zip',
      state: 'uploaded',
      size: 120 * 1024 * 1024,
      browser_download_url:
        'https://github.com/LoudyMiguel/GenXYZ-Lab-Releases/releases/download/v2.2.0/GenXYZ-Lab-Windows.zip',
    },
  ],
}

function context() {
  return { waitUntil: () => {} }
}

function useRelease(value) {
  globalThis.caches = {
    default: {
      match: async () => null,
      put: async () => {},
    },
  }
  globalThis.fetch = async () => Response.json(value)
}

test('redirects Android to the exact latest release asset with 307', async () => {
  useRelease(release)
  globalThis.fetch = async () => {
    throw new Error('The download route must not call GitHub API.')
  }
  const response = await handleRequest(
    new Request('https://downloads.genxyzlab.org/latest.apk'),
    env,
    context(),
  )

  assert.equal(response.status, 307)
  assert.equal(
    response.headers.get('location'),
    'https://github.com/LoudyMiguel/GenXYZ-Lab-Releases/releases/latest/download/GenXYZ-Lab.apk',
  )
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0')
})

test('builds the application update manifest from live release metadata', async () => {
  useRelease(release)
  const response = await handleRequest(
    new Request('https://downloads.genxyzlab.org/version.json'),
    env,
    context(),
  )
  const manifest = await response.json()

  assert.equal(response.status, 200)
  assert.equal(manifest.android.version, '2.2.0')
  assert.equal(manifest.android.url, 'https://downloads.genxyzlab.org/latest.apk')
  assert.equal(manifest.windows.url, 'https://downloads.genxyzlab.org/latest-windows.zip')
  assert.equal(manifest.android.size, '80.0 MB')
})

test('returns a branded metadata error when an asset is missing', async () => {
  useRelease({ ...release, assets: [release.assets[0]] })
  const response = await handleRequest(
    new Request('https://downloads.genxyzlab.org/version.json'),
    env,
    context(),
  )

  assert.equal(response.status, 503)
  assert.match(await response.text(), /missing GenXYZ-Lab-Windows\.zip/)
})

test('serves configured metadata when GitHub rate-limits the lookup', async () => {
  globalThis.caches = {
    default: {
      match: async () => null,
      put: async () => {},
    },
  }
  globalThis.fetch = async () => new Response('rate limited', { status: 429 })
  const response = await handleRequest(
    new Request('https://downloads.genxyzlab.org/version.json'),
    env,
    context(),
  )
  const manifest = await response.json()

  assert.equal(response.status, 200)
  assert.equal(manifest.android.version, '3.0.0')
  assert.equal(manifest.android.size, '76.6 MB')
  assert.equal(manifest.windows.size, '33.1 MB')
})

test('rejects unknown paths and write methods', async () => {
  useRelease(release)
  const notFound = await handleRequest(
    new Request('https://downloads.genxyzlab.org/nope'),
    env,
    context(),
  )
  const methodNotAllowed = await handleRequest(
    new Request('https://downloads.genxyzlab.org/latest.apk', { method: 'POST' }),
    env,
    context(),
  )

  assert.equal(notFound.status, 404)
  assert.equal(methodNotAllowed.status, 405)
})
