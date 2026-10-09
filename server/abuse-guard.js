// Rate limits, IP blocking, and the offender log shared by the write endpoints.
//
// Database layout (admin-only; the rules deny every client read and write):
//   security/rateLimits/{action}/{yyyymmdd}/{ipKey}  { count, last, strikes }
//   security/globalLimits/{action}/{yyyymmddhh}      number
//   security/blocked/{ipKey}                         { ip, reason, blockedAt, until }
//   security/offenders/{ipKey}                       { ip, country, asn, network,
//                                                      userAgent, firstSeen, lastSeen,
//                                                      rejected, lastReason, lastAction }
// Rate-limit records hold only a keyed hash of the address and are deleted
// after two days. The offender log keeps the raw address, so the site owner
// can block it at Cloudflare, but only for addresses that broke a rule, and
// only for 30 days.

import { ConflictError } from './firebase-admin.js'
import { isBlocked, ipKey, parseBlocklist } from './ip.js'

export const LIMITS = Object.freeze({
  comment: Object.freeze({ minIntervalMs: 120_000, perDay: 10, globalPerHour: 60 }),
  download: Object.freeze({ minIntervalMs: 15_000, perDay: 20, globalPerHour: 400 }),
})

// Rejected requests from one address in one UTC day before it is blocked.
export const STRIKES_TO_BLOCK = 20
export const BLOCK_MS = 24 * 60 * 60 * 1000
const OFFENDER_RETENTION_MS = 30 * 24 * 60 * 60 * 1000
const RATE_LIMIT_RETENTION_DAYS = 2
const CLEANUP_PROBABILITY = 0.05

const MESSAGES = {
  blocked: 'Requests from your network are blocked because of abuse. Please try again later.',
  'too-soon': 'Please wait a little before trying again.',
  'daily-limit': 'You have reached today’s limit. Please try again tomorrow.',
  busy: 'The site is receiving too many requests right now. Please try again later.',
}

export const dayKey = (time) => new Date(time).toISOString().slice(0, 10).replace(/-/g, '')
export const hourKey = (time) => new Date(time).toISOString().slice(0, 13).replace(/[-T]/g, '')

export function jsonResponse(status, payload, headers = {}) {
  return Response.json(payload, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers },
  })
}

function limitResponse(reason, retryAfterMs) {
  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000))
  return jsonResponse(
    reason === 'blocked' ? 403 : 429,
    { error: reason, message: MESSAGES[reason], retryAfter: seconds },
    { 'Retry-After': String(seconds) },
  )
}

async function hashSecret(env) {
  if (env.IP_HASH_SECRET) return env.IP_HASH_SECRET
  // Without a dedicated secret, derive one from the service-account key so the
  // hash cannot be reversed by anyone who can only read the database.
  const material = new TextEncoder().encode(String(env.FIREBASE_SERVICE_ACCOUNT || 'local'))
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', material))
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function clientAddress(request) {
  return request.headers.get('CF-Connecting-IP') || 'unknown'
}

const msUntilNextHour = (now) => 3_600_000 - (now % 3_600_000)
const msUntilNextDay = (now) => 86_400_000 - (now % 86_400_000)

/**
 * Guards one write, in this order:
 *   check()  — the blocklists and this address's limits for `action`;
 *   strike() — for an endpoint that finds the content abusive (spam text, a
 *              duplicate) after check() passed; counts toward a block;
 *   admit()  — the site-wide hourly cap, taken last so rejected junk never
 *              uses up the allowance meant for real visitors.
 * check() and admit() return `{ ok: true }` or `{ ok: false, response }`.
 */
export async function createAbuseGuard({
  request,
  env,
  db,
  action,
  waitUntil = (promise) => promise,
  now = Date.now(),
  random = Math.random,
}) {
  const limits = LIMITS[action]
  if (!limits) throw new Error(`Unknown action ${action}`)

  const ip = clientAddress(request)
  const key = await ipKey(ip, await hashSecret(env))
  const cf = request.cf || {}
  const details = {
    ip,
    country: String(cf.country || ''),
    asn: Number.isSafeInteger(Number(cf.asn)) ? Number(cf.asn) : 0,
    network: String(cf.asOrganization || '').slice(0, 120),
    userAgent: String(request.headers.get('User-Agent') || '').slice(0, 200),
  }
  const ratePath = `security/rateLimits/${action}/${dayKey(now)}/${key}`

  // Logged to the Pages Functions real-time log as well as the offender list.
  function track(reason, strikes) {
    console.warn(JSON.stringify({ event: 'abuse', action, reason, strikes, ...details }))
    const offender = `security/offenders/${key}`
    const work = [
      // Atomic, so a flood of parallel requests from one address is counted
      // exactly instead of colliding.
      db.patch(offender, {
        ...details,
        lastSeen: now,
        lastReason: reason,
        lastAction: action,
        rejected: { '.sv': { increment: 1 } },
      }),
      db.transaction(`${offender}/firstSeen`, (current) => (current ? undefined : now)),
    ]
    if (strikes >= STRIKES_TO_BLOCK) {
      work.push(
        db.patch(`security/blocked/${key}`, {
          ip,
          reason: `${strikes} rejected ${action} requests in one day`,
          blockedAt: now,
          until: now + BLOCK_MS,
        }),
      )
    }
    waitUntil(
      Promise.all(work).catch((error) => console.error('Could not record the offender.', error)),
    )
  }

  async function check() {
    if (isBlocked(ip, parseBlocklist(env.BLOCKED_IPS))) {
      track('blocked', 0)
      return { ok: false, response: limitResponse('blocked', BLOCK_MS) }
    }

    const blocked = await db.get(`security/blocked/${key}`)
    if (blocked && Number(blocked.until) > now) {
      track('blocked', 0)
      return { ok: false, response: limitResponse('blocked', Number(blocked.until) - now) }
    }

    let decision
    try {
      await db.transaction(ratePath, (current) => {
        const record = {
          count: Number(current?.count) || 0,
          last: Number(current?.last) || 0,
          strikes: Number(current?.strikes) || 0,
        }
        if (now - record.last < limits.minIntervalMs) {
          decision = { reason: 'too-soon', retryAfter: limits.minIntervalMs - (now - record.last) }
        } else if (record.count >= limits.perDay) {
          decision = { reason: 'daily-limit', retryAfter: msUntilNextDay(now) }
        } else {
          decision = null
          return { ...record, count: record.count + 1, last: now }
        }
        decision.strikes = record.strikes + 1
        return { ...record, strikes: decision.strikes }
      })
    } catch (error) {
      if (!(error instanceof ConflictError)) throw error
      // Several requests from one address raced for its record: they arrived
      // together, so they are too soon by definition. Nothing was written.
      decision = { reason: 'too-soon', retryAfter: limits.minIntervalMs, strikes: 0 }
    }
    if (decision) {
      track(decision.reason, decision.strikes)
      return { ok: false, response: limitResponse(decision.reason, decision.retryAfter) }
    }

    return { ok: true }
  }

  async function admit() {
    // The site-wide cap protects the data during a distributed attack. It says
    // nothing about this visitor, so it never counts against their address.
    const used = await db.increment(`security/globalLimits/${action}/${hourKey(now)}`)
    if (used > limits.globalPerHour) {
      return { ok: false, response: limitResponse('busy', msUntilNextHour(now)) }
    }
    if (random() < CLEANUP_PROBABILITY) {
      waitUntil(cleanup().catch((error) => console.error('Security cleanup failed.', error)))
    }
    return { ok: true }
  }

  async function strike(reason, status, message) {
    let strikes = 0
    try {
      await db.transaction(ratePath, (current) => {
        strikes = (Number(current?.strikes) || 0) + 1
        return { count: Number(current?.count) || 0, last: Number(current?.last) || 0, strikes }
      })
    } catch (error) {
      if (!(error instanceof ConflictError)) throw error
      strikes = 0
    }
    track(reason, strikes)
    return jsonResponse(status, { error: reason, message })
  }

  async function cleanup() {
    const oldestKept = dayKey(now - RATE_LIMIT_RETENTION_DAYS * 86_400_000)
    const updates = {}
    for (const name of Object.keys(LIMITS)) {
      const days = (await db.get(`security/rateLimits/${name}`, { shallow: 'true' })) || {}
      for (const day of Object.keys(days)) {
        if (day < oldestKept) updates[`rateLimits/${name}/${day}`] = null
      }
      const hours = (await db.get(`security/globalLimits/${name}`, { shallow: 'true' })) || {}
      for (const hour of Object.keys(hours)) {
        if (hour < `${oldestKept}00`) updates[`globalLimits/${name}/${hour}`] = null
      }
    }
    const blockedEntries = (await db.get('security/blocked')) || {}
    for (const [entryKey, entry] of Object.entries(blockedEntries)) {
      if (!(Number(entry?.until) > now)) updates[`blocked/${entryKey}`] = null
    }
    const stale = await db.get('security/offenders', {
      orderBy: '"lastSeen"',
      endAt: String(now - OFFENDER_RETENTION_MS),
      limitToFirst: '100',
    })
    for (const offenderKey of Object.keys(stale || {})) updates[`offenders/${offenderKey}`] = null
    if (Object.keys(updates).length) await db.patch('security', updates)
  }

  return { ip, key, check, strike, admit, cleanup }
}
