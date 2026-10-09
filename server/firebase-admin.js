// Server-side Realtime Database access for Pages Functions.
//
// Writes made here use a Google service account, so they bypass the database
// rules; the rules deny every client write to the paths these functions own.
// That is the point: a visitor's browser can no longer write counters, map
// cells, or comments directly, so every write passes the rate limits and IP
// checks in abuse-guard.js first.

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const TOKEN_SCOPES = [
  'https://www.googleapis.com/auth/firebase.database',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')
const DATABASE_HOST = /^[a-z0-9-]+\.(?:firebaseio\.com|[a-z0-9-]+\.firebasedatabase\.app)$/

export class ConfigurationError extends Error {}

let cachedToken = null

function base64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const encodeJson = (value) => base64Url(new TextEncoder().encode(JSON.stringify(value)))

function pemToPkcs8(pem) {
  const body = String(pem)
    .replace(/\\n/g, '\n')
    .replace(/-----(?:BEGIN|END) PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '')
  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes.buffer
}

export function readServiceAccount(env) {
  const raw = env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new ConfigurationError('FIREBASE_SERVICE_ACCOUNT is not set.')
  let account
  try {
    account = JSON.parse(raw)
  } catch {
    throw new ConfigurationError('FIREBASE_SERVICE_ACCOUNT is not valid JSON.')
  }
  if (!account?.client_email || !account?.private_key) {
    throw new ConfigurationError('FIREBASE_SERVICE_ACCOUNT is missing client_email or private_key.')
  }
  return account
}

export function databaseUrl(env) {
  const raw = env.FIREBASE_DATABASE_URL || env.VITE_FIREBASE_DATABASE_URL
  let url
  try {
    url = new URL(raw)
  } catch {
    throw new ConfigurationError('FIREBASE_DATABASE_URL is not set.')
  }
  if (url.protocol !== 'https:' || !DATABASE_HOST.test(url.hostname)) {
    throw new ConfigurationError('FIREBASE_DATABASE_URL must be a Realtime Database URL.')
  }
  return url.origin
}

/** Signs a service-account JWT and exchanges it for an OAuth access token. */
export async function getAccessToken(account, { fetchImpl = fetch, now = Date.now() } = {}) {
  if (
    cachedToken &&
    cachedToken.email === account.client_email &&
    cachedToken.expiresAt - 60_000 > now
  ) {
    return cachedToken.token
  }

  const issuedAt = Math.floor(now / 1000)
  const unsigned = `${encodeJson({ alg: 'RS256', typ: 'JWT' })}.${encodeJson({
    iss: account.client_email,
    scope: TOKEN_SCOPES,
    aud: TOKEN_URL,
    iat: issuedAt,
    exp: issuedAt + 3600,
  })}`
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8(account.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned),
  )

  const response = await fetchImpl(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${base64Url(new Uint8Array(signature))}`,
    }),
  })
  if (!response.ok) throw new Error(`Google token exchange failed with HTTP ${response.status}`)
  const payload = await response.json()
  if (!payload.access_token) throw new Error('Google token exchange returned no access token.')

  cachedToken = {
    email: account.client_email,
    token: payload.access_token,
    expiresAt: now + Number(payload.expires_in || 3600) * 1000,
  }
  return cachedToken.token
}

export class ConflictError extends Error {}

/**
 * A minimal Realtime Database REST client. `FIREBASE_DATABASE_EMULATOR_HOST`
 * (host:port) points it at the local emulator, which accepts "owner" as an
 * admin token, the same switch the Firebase Admin SDK uses.
 */
export function createDatabase(env, { fetchImpl = fetch } = {}) {
  const emulatorHost = env.FIREBASE_DATABASE_EMULATOR_HOST
  let origin
  let namespace = ''
  let token

  if (emulatorHost) {
    const host = new URL(databaseUrl(env)).hostname
    origin = `http://${emulatorHost}`
    namespace = host.split('.')[0]
    token = async () => 'owner'
  } else {
    origin = databaseUrl(env)
    const account = readServiceAccount(env)
    token = () => getAccessToken(account, { fetchImpl })
  }

  async function request(method, path, { body, query = {}, etag, ifMatch } = {}) {
    const url = new URL(`${origin}/${path.replace(/^\/+/, '')}.json`)
    if (namespace) url.searchParams.set('ns', namespace)
    for (const [name, value] of Object.entries(query)) url.searchParams.set(name, value)

    const headers = { Authorization: `Bearer ${await token()}` }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (etag) headers['X-Firebase-ETag'] = 'true'
    if (ifMatch) headers['if-match'] = ifMatch

    const response = await fetchImpl(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (response.status === 412) throw new ConflictError('The record changed during the update.')
    if (!response.ok) {
      throw new Error(`Realtime Database ${method} ${path} failed with HTTP ${response.status}`)
    }
    return { value: await response.json(), etag: response.headers.get('ETag') }
  }

  return {
    async get(path, query) {
      return (await request('GET', path, { query })).value
    },
    patch: (path, body) => request('PATCH', path, { body }),
    post: async (path, body) => (await request('POST', path, { body })).value,
    remove: (path) => request('DELETE', path),

    /** Atomically adds one and returns the new value; never conflicts. */
    async increment(path) {
      const { value } = await request('PUT', path, { body: { '.sv': { increment: 1 } } })
      return typeof value === 'number' ? value : Number(await this.get(path))
    },

    /**
     * Optimistic read-modify-write using ETags. `update` receives the current
     * value and returns the new value, or `undefined` to leave it unchanged.
     */
    async transaction(path, update, attempts = 4) {
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        const current = await request('GET', path, { etag: true })
        const next = update(current.value)
        if (next === undefined) return { committed: false, value: current.value }
        try {
          await request('PUT', path, { body: next, ifMatch: current.etag })
          return { committed: true, value: next }
        } catch (error) {
          if (!(error instanceof ConflictError)) throw error
        }
      }
      throw new ConflictError(`Gave up on ${path} after ${attempts} conflicting updates.`)
    },
  }
}

export function resetTokenCacheForTests() {
  cachedToken = null
}
