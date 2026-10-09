// End-to-end tests of the write endpoints against the Realtime Database
// emulator. Skipped unless FIREBASE_DATABASE_EMULATOR_HOST is set:
//
//   firebase emulators:start --only database --project demo-genxyz
//   FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 node --test server/emulator.test.js

import assert from 'node:assert/strict'
import test from 'node:test'

import { onRequestPost as postComment } from '../functions/api/comments.js'
import { onRequestPost as postDownload } from '../functions/api/download.js'
import { LIMITS, STRIKES_TO_BLOCK } from './abuse-guard.js'
import { createDatabase } from './firebase-admin.js'

const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST
const env = {
  FIREBASE_DATABASE_EMULATOR_HOST: host,
  FIREBASE_DATABASE_URL: 'https://demo-genxyz-default-rtdb.firebaseio.com',
  IP_HASH_SECRET: 'emulator-secret',
}
const options = { skip: !host && 'FIREBASE_DATABASE_EMULATOR_HOST is not set' }

function request(path, body, ip, cf = {}) {
  const value = new Request(`https://genxyzlab.org${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://genxyzlab.org',
      'CF-Connecting-IP': ip,
    },
    body: JSON.stringify(body),
  })
  Object.defineProperty(value, 'cf', { value: cf })
  return value
}

async function run(handler, req) {
  const pending = []
  const response = await handler({ request: req, env, waitUntil: (promise) => pending.push(promise) })
  await Promise.all(pending)
  return response
}

const db = host ? createDatabase(env) : null

async function reset() {
  await db.patch('', { comments: null, stats: null, security: null })
}

test('counts downloads, maps them from Cloudflare coordinates, and stays exact under concurrency', options, async () => {
  await reset()
  const manila = { latitude: '14.5995', longitude: '120.9842', country: 'PH' }
  const responses = await Promise.all(
    Array.from({ length: 25 }, (_, index) =>
      run(postDownload, request('/api/download', { platform: index % 5 ? 'android' : 'windows' }, `198.51.100.${index}`, manila)),
    ),
  )
  assert.deepEqual([...new Set(responses.map((response) => response.status))], [202])

  const stats = await db.get('stats')
  assert.equal(stats.download_count, 25)
  assert.deepEqual(stats.platform_downloads, { android: 20, windows: 5 })
  assert.deepEqual(stats.download_locations, {
    n14p5_e121: { lat: 14.5, lng: 121, count: 25, android: 20, windows: 5 },
  })

  // A browser cannot choose the map position: the body's coordinates are ignored.
  await run(
    postDownload,
    request('/api/download', { platform: 'android', lat: -80, lng: 10 }, '198.51.100.200', {}),
  )
  const after = await db.get('stats')
  assert.equal(after.download_count, 26)
  assert.deepEqual(Object.keys(after.download_locations), ['n14p5_e121'])
})

test('limits one address but not its neighbours', options, async () => {
  await reset()
  const ip = '203.0.113.50'
  assert.equal((await run(postDownload, request('/api/download', { platform: 'android' }, ip))).status, 202)
  const second = await run(postDownload, request('/api/download', { platform: 'android' }, ip))
  assert.equal(second.status, 429)
  assert.ok(Number(second.headers.get('Retry-After')) > 0)
  assert.equal((await run(postDownload, request('/api/download', { platform: 'android' }, '203.0.113.51'))).status, 202)
  assert.equal(await db.get('stats/download_count'), 2)

  const offenders = Object.values((await db.get('security/offenders')) || {})
  assert.deepEqual(offenders.map((offender) => offender.ip), [ip])
})

test('replays the October 2026 comment flood and stops it', options, async () => {
  await reset()
  const spam = { authorName: 'Binary S Mylanguage', body: 'Touch some grass. Spread peace and love 😊 ❤️' }

  // One address firing as fast as it can: one comment gets through.
  const burst = []
  for (let index = 0; index < 30; index += 1) {
    burst.push(await run(postComment, request('/api/comments', spam, '192.0.2.10')))
  }
  assert.equal(burst.filter((response) => response.status === 201).length, 1)
  assert.equal(burst.filter((response) => response.status === 429).length, STRIKES_TO_BLOCK)
  assert.equal(
    burst.filter((response) => response.status === 403).length,
    30 - 1 - STRIKES_TO_BLOCK,
    'blocked once the strikes reach the threshold',
  )
  const blocked = Object.values((await db.get('security/blocked')) || {})
  assert.deepEqual(blocked.map((entry) => entry.ip), ['192.0.2.10'])

  // Many addresses repeating the same text: duplicates are refused.
  const rotating = []
  for (let index = 0; index < 5; index += 1) {
    rotating.push(await run(postComment, request('/api/comments', spam, `192.0.2.${100 + index}`)))
  }
  assert.deepEqual(rotating.map((response) => response.status), [409, 409, 409, 409, 409])

  // Spam text that bypassed the form is refused and counted.
  const crypto = await run(
    postComment,
    request('/api/comments', { authorName: 'Amogus', body: 'free money crypto giveaway click here https://a.example https://b.example' }, '192.0.2.200'),
  )
  assert.equal(crypto.status, 400)

  const comments = Object.values((await db.get('comments')) || {})
  assert.equal(comments.length, 1)
  assert.equal(comments[0].authorName, spam.authorName)
  assert.ok(Number.isSafeInteger(comments[0].createdAt))
})

test('the site-wide hourly cap holds against many addresses', options, async () => {
  await reset()
  const results = []
  for (let index = 0; index < LIMITS.comment.globalPerHour + 3; index += 1) {
    results.push(
      await run(
        postComment,
        request('/api/comments', { authorName: 'Visitor', body: `Distinct helpful comment number ${index}` }, `10.1.${index >> 8}.${index & 255}`),
      ),
    )
  }
  assert.equal(results.filter((response) => response.status === 201).length, LIMITS.comment.globalPerHour)
  const busy = results.filter((response) => response.status === 429)
  assert.equal(busy.length, 3)
  assert.equal((await busy[0].json()).error, 'busy')
  assert.equal(await db.get('security/offenders'), null, 'the cap does not mark visitors as offenders')
})

test('a parallel burst from one address is refused cleanly, never with a server error', options, async () => {
  await reset()
  const responses = await Promise.all(
    Array.from({ length: 30 }, (_, index) =>
      run(
        postComment,
        request('/api/comments', { authorName: 'Burst', body: `Parallel burst message ${index}` }, '192.0.2.77'),
      ),
    ),
  )
  const statuses = responses.map((response) => response.status)
  assert.ok(statuses.every((status) => status === 201 || status === 429), statuses.join(','))
  assert.equal(statuses.filter((status) => status === 201).length, 1)
  assert.equal(Object.keys((await db.get('comments')) || {}).length, 1)
})
