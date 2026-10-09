// POST /api/comments — the only way to publish a community comment.
// The database rules deny direct client writes to `comments`, so every comment
// passes the IP blocklist, the per-address and site-wide limits, the same
// moderation the form applies, and a duplicate check before it is stored.

import {
  assertCommunityCommentAllowed,
  normalizeCommentForComparison,
} from '../../src/services/comment-moderation.js'
import { normalizeText } from '../../src/services/text.js'
import { createAbuseGuard, jsonResponse } from '../../server/abuse-guard.js'
import { ConfigurationError, createDatabase } from '../../server/firebase-admin.js'
import { isSameOrigin, methodNotAllowed, readJsonBody } from '../../server/http.js'

const RECENT_COMMENTS_CHECKED = 50

export async function onRequestPost({ request, env, waitUntil }) {
  if (!isSameOrigin(request)) {
    return jsonResponse(403, { error: 'forbidden', message: 'Comments can only be posted from this site.' })
  }

  const payload = await readJsonBody(request, 4096)
  if (!payload) {
    return jsonResponse(400, { error: 'invalid', message: 'The comment could not be read.' })
  }

  const authorName = normalizeText(payload.authorName, 40) || 'Anonymous builder'
  const body = normalizeText(payload.body, 500)
  if (body.length < 3) {
    return jsonResponse(400, { error: 'invalid', message: 'Please write at least 3 characters.' })
  }

  let db
  try {
    db = createDatabase(env)
  } catch (error) {
    if (!(error instanceof ConfigurationError)) throw error
    console.error(error.message)
    return jsonResponse(503, { error: 'unavailable', message: 'Comments are temporarily unavailable.' })
  }

  try {
    const guard = await createAbuseGuard({ request, env, db, action: 'comment', waitUntil })
    const verdict = await guard.check()
    if (!verdict.ok) return verdict.response

    // The form runs the same checks, so text that fails them here did not come
    // from the form: count it against the address.
    try {
      assertCommunityCommentAllowed(authorName)
      assertCommunityCommentAllowed(body)
    } catch (moderationError) {
      return guard.strike('moderation', 400, moderationError.message)
    }

    const recent = await db.get('comments', {
      orderBy: '"createdAt"',
      limitToLast: String(RECENT_COMMENTS_CHECKED),
    })
    const comparable = normalizeCommentForComparison(body)
    const duplicate = Object.values(recent || {}).some(
      (comment) => normalizeCommentForComparison(comment?.body) === comparable,
    )
    if (duplicate) {
      return guard.strike('duplicate', 409, 'That comment was already posted.')
    }

    const admitted = await guard.admit()
    if (!admitted.ok) return admitted.response

    const created = await db.post('comments', {
      authorName,
      body,
      createdAt: { '.sv': 'timestamp' },
    })
    return jsonResponse(201, { id: created?.name })
  } catch (error) {
    console.error('Comment could not be stored.', error)
    return jsonResponse(503, { error: 'unavailable', message: 'Comments are temporarily unavailable.' })
  }
}

export const onRequest = methodNotAllowed
