import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ConfigurationError,
  createDatabase,
  databaseUrl,
  getAccessToken,
  readServiceAccount,
  resetTokenCacheForTests,
} from './firebase-admin.js'

async function testAccount() {
  const { privateKey, publicKey } = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  )
  const pkcs8 = Buffer.from(await crypto.subtle.exportKey('pkcs8', privateKey)).toString('base64')
  const pem = `-----BEGIN PRIVATE KEY-----\n${pkcs8.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----\n`
  return { account: { client_email: 'site@demo.iam.gserviceaccount.com', private_key: pem }, publicKey }
}

const decode = (part) => JSON.parse(Buffer.from(part, 'base64url').toString())

test('signs a valid service-account JWT and caches the access token', async () => {
  resetTokenCacheForTests()
  const { account, publicKey } = await testAccount()
  const calls = []
  const fetchImpl = async (url, init) => {
    calls.push({ url, body: new URLSearchParams(init.body) })
    return Response.json({ access_token: 'token-1', expires_in: 3600 })
  }

  const now = Date.UTC(2026, 9, 9)
  assert.equal(await getAccessToken(account, { fetchImpl, now }), 'token-1')
  assert.equal(await getAccessToken(account, { fetchImpl, now: now + 30 * 60_000 }), 'token-1')
  assert.equal(calls.length, 1, 'a fresh token is reused')

  const { url, body } = calls[0]
  assert.equal(url, 'https://oauth2.googleapis.com/token')
  assert.equal(body.get('grant_type'), 'urn:ietf:params:oauth:grant-type:jwt-bearer')
  const [header, claims, signature] = body.get('assertion').split('.')
  assert.deepEqual(decode(header), { alg: 'RS256', typ: 'JWT' })
  const payload = decode(claims)
  assert.equal(payload.iss, account.client_email)
  assert.equal(payload.aud, 'https://oauth2.googleapis.com/token')
  assert.match(payload.scope, /firebase\.database/)
  assert.match(payload.scope, /userinfo\.email/)
  assert.equal(payload.exp - payload.iat, 3600)
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    publicKey,
    Buffer.from(signature, 'base64url'),
    new TextEncoder().encode(`${header}.${claims}`),
  )
  assert.ok(valid, 'the signature verifies with the public key')

  await getAccessToken(account, { fetchImpl, now: now + 59 * 60_000 + 30_000 })
  assert.equal(calls.length, 2, 'a token about to expire is refreshed')
})

test('accepts a private key whose newlines were pasted as \\n', async () => {
  resetTokenCacheForTests()
  const { account } = await testAccount()
  const escaped = { ...account, private_key: account.private_key.replace(/\n/g, '\\n') }
  const token = await getAccessToken(escaped, {
    fetchImpl: async () => Response.json({ access_token: 'token-2', expires_in: 3600 }),
  })
  assert.equal(token, 'token-2')
})

test('reports missing or malformed configuration clearly', () => {
  assert.throws(() => readServiceAccount({}), ConfigurationError)
  assert.throws(() => readServiceAccount({ FIREBASE_SERVICE_ACCOUNT: '{' }), ConfigurationError)
  assert.throws(() => readServiceAccount({ FIREBASE_SERVICE_ACCOUNT: '{"client_email":"x"}' }), ConfigurationError)
  assert.throws(() => databaseUrl({}), ConfigurationError)
  assert.throws(() => databaseUrl({ FIREBASE_DATABASE_URL: 'https://evil.example.com' }), ConfigurationError)
  assert.throws(() => databaseUrl({ FIREBASE_DATABASE_URL: 'http://x.firebaseio.com' }), ConfigurationError)
  assert.equal(
    databaseUrl({ VITE_FIREBASE_DATABASE_URL: 'https://qc-scholar-689f8-default-rtdb.firebaseio.com/' }),
    'https://qc-scholar-689f8-default-rtdb.firebaseio.com',
  )
  assert.equal(
    databaseUrl({ FIREBASE_DATABASE_URL: 'https://demo-default-rtdb.asia-southeast1.firebasedatabase.app' }),
    'https://demo-default-rtdb.asia-southeast1.firebasedatabase.app',
  )
  assert.throws(() => createDatabase({ VITE_FIREBASE_DATABASE_URL: 'https://a.firebaseio.com' }), ConfigurationError)
})

test('retries a transaction when another writer wins the ETag race', async () => {
  resetTokenCacheForTests()
  const { account } = await testAccount()
  let stored = 5
  let etag = 'v1'
  let raced = false
  const fetchImpl = async (url, init = {}) => {
    if (String(url).startsWith('https://oauth2')) return Response.json({ access_token: 't', expires_in: 3600 })
    assert.equal(init.headers.Authorization, 'Bearer t')
    if (init.method === 'GET') return Response.json(stored, { headers: { ETag: etag } })
    if (init.headers['if-match'] !== etag) return new Response('stale', { status: 412 })
    if (!raced) {
      raced = true
      stored = 7
      etag = 'v2'
      return new Response('stale', { status: 412 })
    }
    stored = JSON.parse(init.body)
    etag = 'v3'
    return Response.json(stored)
  }
  const db = createDatabase(
    {
      FIREBASE_SERVICE_ACCOUNT: JSON.stringify(account),
      FIREBASE_DATABASE_URL: 'https://demo-default-rtdb.firebaseio.com',
    },
    { fetchImpl },
  )
  const result = await db.transaction('counter', (value) => value + 1)
  assert.deepEqual(result, { committed: true, value: 8 })
  assert.equal(stored, 8)
})
