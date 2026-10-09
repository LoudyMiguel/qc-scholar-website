// POST /api/download — counts one download click and maps it.
// The location comes from Cloudflare's approximate request coordinates, never
// from the browser, snapped to a 0.25° cell (about 25 km). Only aggregate
// counts are stored. The database rules deny direct client writes to `stats`,
// so every count passes the IP blocklist and the limits first.

import { cellKey, snapToLocationGrid } from '../../src/services/download-cells.js'
import { createAbuseGuard, jsonResponse } from '../../server/abuse-guard.js'
import { ConfigurationError, createDatabase } from '../../server/firebase-admin.js'
import { isSameOrigin, methodNotAllowed, readJsonBody } from '../../server/http.js'

const PLATFORM_GROUPS = Object.freeze({ android: 'android', android32: 'android', windows: 'windows' })
const increment = () => ({ '.sv': { increment: 1 } })

export async function onRequestPost({ request, env, waitUntil }) {
  if (!isSameOrigin(request)) return jsonResponse(403, { error: 'forbidden' })

  const payload = await readJsonBody(request, 512)
  const group = Object.hasOwn(PLATFORM_GROUPS, payload?.platform)
    ? PLATFORM_GROUPS[payload.platform]
    : null
  if (!group) return jsonResponse(400, { error: 'invalid' })

  let db
  try {
    db = createDatabase(env)
  } catch (error) {
    if (!(error instanceof ConfigurationError)) throw error
    console.error(error.message)
    return jsonResponse(503, { error: 'unavailable' })
  }

  try {
    const guard = await createAbuseGuard({ request, env, db, action: 'download', waitUntil })
    const verdict = await guard.check()
    if (!verdict.ok) return verdict.response
    const admitted = await guard.admit()
    if (!admitted.ok) return admitted.response

    const updates = {
      download_count: increment(),
      [`platform_downloads/${group}`]: increment(),
    }
    const lat = snapToLocationGrid(request.cf?.latitude, -90, 90)
    const lng = snapToLocationGrid(request.cf?.longitude, -180, 180)
    if (lat !== null && lng !== null) {
      const cell = `download_locations/${cellKey(lat, lng)}`
      updates[`${cell}/lat`] = lat
      updates[`${cell}/lng`] = lng
      updates[`${cell}/count`] = increment()
      updates[`${cell}/${group}`] = increment()
    }
    await db.patch('stats', updates)
    return jsonResponse(202, { counted: true, mapped: lat !== null && lng !== null })
  } catch (error) {
    console.error('Download could not be counted.', error)
    return jsonResponse(503, { error: 'unavailable' })
  }
}

export const onRequest = methodNotAllowed
