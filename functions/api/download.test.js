import assert from 'node:assert/strict'
import test from 'node:test'

import { onRequest, onRequestPost } from './download.js'

function post(body, origin = 'https://genxyzlab.org') {
  const headers = { 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.7' }
  if (origin) headers.Origin = origin
  return new Request('https://genxyzlab.org/api/download', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

const call = (request, env = {}) => onRequestPost({ request, env, waitUntil: () => {} })

test('refuses cross-origin requests', async () => {
  assert.equal((await call(post({ platform: 'android' }, 'https://evil.example'))).status, 403)
  assert.equal((await call(post({ platform: 'android' }, null))).status, 403)
})

test('accepts only the known platforms', async () => {
  for (const platform of ['ios', '', '__proto__', 'toString', null, 7]) {
    assert.equal((await call(post({ platform }))).status, 400, String(platform))
  }
})

test('answers 503 when the service account is not configured', async () => {
  const response = await call(post({ platform: 'windows' }), {
    VITE_FIREBASE_DATABASE_URL: 'https://demo-default-rtdb.firebaseio.com',
  })
  assert.equal(response.status, 503)
})

test('only POST is accepted', () => {
  assert.equal(onRequest().status, 405)
})
