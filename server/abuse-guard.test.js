import assert from 'node:assert/strict'
import test from 'node:test'

import {
  BLOCK_MS,
  LIMITS,
  STRIKES_TO_BLOCK,
  createAbuseGuard,
  dayKey,
  hourKey,
} from './abuse-guard.js'
import { createMemoryDatabase } from './testing/memory-database.js'

const NOW = Date.UTC(2026, 9, 9, 8, 30)
const env = { IP_HASH_SECRET: 'test-secret' }

function requestFrom(ip, extra = {}) {
  const request = new Request('https://genxyzlab.org/api/comments', {
    method: 'POST',
    headers: { 'CF-Connecting-IP': ip, 'User-Agent': 'test-agent' },
  })
  Object.defineProperty(request, 'cf', {
    value: { country: 'PH', asn: 9299, asOrganization: 'Example Telecom', ...extra },
  })
  return request
}

async function guardFor(db, { ip = '203.0.113.7', action = 'comment', now = NOW, environment = env } = {}) {
  const pending = []
  const guard = await createAbuseGuard({
    request: requestFrom(ip),
    env: environment,
    db,
    action,
    now,
    random: () => 1,
    waitUntil: (promise) => pending.push(promise),
  })
  return { guard, settle: () => Promise.all(pending) }
}

test('allows a first request and counts it under a hashed key', async () => {
  const db = createMemoryDatabase()
  const { guard } = await guardFor(db)
  assert.deepEqual(await guard.check(), { ok: true })
  assert.deepEqual(await guard.admit(), { ok: true })
  const day = db.root.value.security.rateLimits.comment[dayKey(NOW)]
  assert.deepEqual(Object.values(day), [{ count: 1, last: NOW, strikes: 0 }])
  assert.ok(!JSON.stringify(day).includes('203.0.113.7'), 'rate-limit records never hold the address')
  assert.equal(db.root.value.security.globalLimits.comment[hourKey(NOW)], 1)
})

test('rejects a second comment inside the interval and logs the offender', async () => {
  const db = createMemoryDatabase()
  await (await guardFor(db)).guard.check()
  const { guard, settle } = await guardFor(db, { now: NOW + 30_000 })
  const verdict = await guard.check()
  assert.equal(verdict.ok, false)
  assert.equal(verdict.response.status, 429)
  assert.equal(verdict.response.headers.get('Retry-After'), '90')
  assert.equal((await verdict.response.json()).error, 'too-soon')
  await settle()
  const [offender] = Object.values(db.root.value.security.offenders)
  assert.equal(offender.ip, '203.0.113.7')
  assert.equal(offender.country, 'PH')
  assert.equal(offender.asn, 9299)
  assert.equal(offender.network, 'Example Telecom')
  assert.equal(offender.rejected, 1)
  assert.equal(offender.lastReason, 'too-soon')
})

test('enforces the daily limit per address but not across addresses', async () => {
  const db = createMemoryDatabase()
  const step = LIMITS.comment.minIntervalMs
  for (let index = 0; index < LIMITS.comment.perDay; index += 1) {
    assert.ok((await (await guardFor(db, { now: NOW + index * step })).guard.check()).ok)
  }
  const over = await (await guardFor(db, { now: NOW + LIMITS.comment.perDay * step })).guard.check()
  assert.equal((await over.response.json()).error, 'daily-limit')
  const other = await (await guardFor(db, { ip: '198.51.100.9', now: NOW + LIMITS.comment.perDay * step })).guard.check()
  assert.ok(other.ok)
})

test(`blocks an address after ${STRIKES_TO_BLOCK} rejections, then refuses it for a day`, async () => {
  const db = createMemoryDatabase()
  await (await guardFor(db)).guard.check()
  for (let index = 1; index <= STRIKES_TO_BLOCK; index += 1) {
    const { guard, settle } = await guardFor(db, { now: NOW + index })
    assert.equal((await guard.check()).ok, false)
    await settle()
  }
  const [blocked] = Object.values(db.root.value.security.blocked)
  assert.equal(blocked.ip, '203.0.113.7')
  assert.equal(blocked.until, NOW + STRIKES_TO_BLOCK + BLOCK_MS)

  // Long after the interval, the block still holds; other actions are blocked too.
  for (const action of ['comment', 'download']) {
    const verdict = await (await guardFor(db, { action, now: NOW + 3_600_000 })).guard.check()
    assert.equal(verdict.response.status, 403)
    assert.equal((await verdict.response.json()).error, 'blocked')
  }
  const expired = await (await guardFor(db, { now: NOW + STRIKES_TO_BLOCK + BLOCK_MS + 1 })).guard.check()
  assert.ok(expired.ok, 'the block lifts after a day')
})

test('refuses addresses in BLOCKED_IPS without touching the limits', async () => {
  const db = createMemoryDatabase()
  const environment = { ...env, BLOCKED_IPS: '203.0.113.0/24' }
  const { guard, settle } = await guardFor(db, { environment })
  const verdict = await guard.check()
  assert.equal(verdict.response.status, 403)
  await settle()
  assert.equal(db.root.value.security.rateLimits, undefined)
  assert.equal(Object.values(db.root.value.security.offenders)[0].lastReason, 'blocked')
})

test('the site-wide cap returns busy without striking the visitor', async () => {
  const db = createMemoryDatabase({
    security: { globalLimits: { comment: { [hourKey(NOW)]: LIMITS.comment.globalPerHour } } },
  })
  const { guard, settle } = await guardFor(db)
  assert.ok((await guard.check()).ok)
  const verdict = await guard.admit()
  assert.equal(verdict.response.status, 429)
  assert.equal((await verdict.response.json()).error, 'busy')
  await settle()
  assert.equal(db.root.value.security.offenders, undefined)
})

test('strike counts abusive content toward the block threshold', async () => {
  const db = createMemoryDatabase()
  const { guard, settle } = await guardFor(db)
  assert.ok((await guard.check()).ok)
  const response = await guard.strike('moderation', 400, 'Please keep it respectful.')
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: 'moderation', message: 'Please keep it respectful.' })
  await settle()
  const [record] = Object.values(db.root.value.security.rateLimits.comment[dayKey(NOW)])
  assert.deepEqual(record, { count: 1, last: NOW, strikes: 1 })
})

test('cleanup removes expired rate limits, blocks, and old offenders', async () => {
  const old = NOW - 3 * 86_400_000
  const db = createMemoryDatabase({
    security: {
      rateLimits: { comment: { [dayKey(old)]: { a: {} }, [dayKey(NOW)]: { b: {} } } },
      globalLimits: { download: { [hourKey(old)]: 4, [hourKey(NOW)]: 2 } },
      blocked: { gone: { until: NOW - 1 }, kept: { until: NOW + 1 } },
      offenders: { stale: { lastSeen: NOW - 31 * 86_400_000 }, fresh: { lastSeen: NOW } },
    },
  })
  const { guard } = await guardFor(db)
  await guard.cleanup()
  const security = db.root.value.security
  assert.deepEqual(Object.keys(security.rateLimits.comment), [dayKey(NOW)])
  assert.deepEqual(Object.keys(security.globalLimits.download), [hourKey(NOW)])
  assert.deepEqual(Object.keys(security.blocked), ['kept'])
  assert.deepEqual(Object.keys(security.offenders), ['fresh'])
})
