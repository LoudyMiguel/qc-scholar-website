import assert from 'node:assert/strict'
import test from 'node:test'

import { onRequest, onRequestPost } from './comments.js'

function post(body, { origin = 'https://genxyzlab.org', contentType = 'application/json' } = {}) {
  const headers = { 'CF-Connecting-IP': '203.0.113.7' }
  if (origin) headers.Origin = origin
  if (contentType) headers['Content-Type'] = contentType
  return new Request('https://genxyzlab.org/api/comments', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

const call = (request, env = {}) => onRequestPost({ request, env, waitUntil: () => {} })

test('refuses posts from other origins or without an Origin header', async () => {
  for (const origin of ['https://evil.example', null]) {
    const response = await call(post({ authorName: 'A', body: 'Hello there' }, { origin }))
    assert.equal(response.status, 403)
  }
})

test('rejects bodies that are not small JSON objects', async () => {
  for (const request of [
    post('not json'),
    post('[1,2]'),
    post({ body: 'x'.repeat(5000) }),
    post({ authorName: 'A', body: 'Hello there' }, { contentType: 'text/plain' }),
  ]) {
    assert.equal((await call(request)).status, 400)
  }
})

test('rejects comments shorter than three characters before any database work', async () => {
  const response = await call(post({ authorName: 'A', body: '  hi ' }))
  assert.equal(response.status, 400)
  assert.equal((await response.json()).message, 'Please write at least 3 characters.')
})

test('answers 503 when the service account is not configured', async () => {
  const response = await call(post({ authorName: 'A', body: 'Hello there' }), {
    VITE_FIREBASE_DATABASE_URL: 'https://demo-default-rtdb.firebaseio.com',
  })
  assert.equal(response.status, 503)
  assert.equal((await response.json()).error, 'unavailable')
})

test('only POST is accepted', () => {
  assert.equal(onRequest().status, 405)
})
