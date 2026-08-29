import { initializeApp } from 'firebase/app'
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from 'firebase/app-check'
import {
  getAuth,
  signInAnonymously,
} from 'firebase/auth'
import {
  getDatabase,
  limitToLast,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  runTransaction,
  serverTimestamp,
  set,
} from 'firebase/database'

const env = import.meta.env

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

const requiredConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.databaseURL,
  firebaseConfig.projectId,
  firebaseConfig.appId,
]

export const isFirebaseConfigured =
  requiredConfig.every((value) => value && value !== 'replace-me') &&
  !firebaseConfig.projectId?.startsWith('your-')

let app = null
let auth = null
let database = null
let signInPromise = null
let approximateOriginPromise = null

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  if (env.VITE_FIREBASE_APPCHECK_SITE_KEY && typeof window !== 'undefined') {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(
        env.VITE_FIREBASE_APPCHECK_SITE_KEY,
      ),
      isTokenAutoRefreshEnabled: true,
    })
  }

  // App Check must be initialized before any Firebase service is accessed.
  auth = getAuth(app)
  database = getDatabase(app)
}

function requireFirebase() {
  if (!isFirebaseConfigured || !auth || !database) {
    throw new Error('Firebase is not configured for this deployment yet.')
  }
}

export async function ensureAnonymousUser() {
  requireFirebase()

  if (auth.currentUser) return auth.currentUser

  if (!signInPromise) {
    signInPromise = signInAnonymously(auth)
      .then(({ user }) => user)
      .finally(() => {
        signInPromise = null
      })
  }

  return signInPromise
}

export function getCurrentUserId() {
  return auth?.currentUser?.uid || null
}

export function subscribeToDownloadCount(onData, onError = console.error) {
  if (!isFirebaseConfigured) {
    onData(0)
    return () => {}
  }

  return onValue(
    ref(database, 'stats/download_count'),
    (snapshot) => {
      const value = snapshot.val()
      onData(Number.isSafeInteger(value) && value >= 0 ? value : 0)
    },
    onError,
  )
}

function incrementCounter(path) {
  return runTransaction(ref(database, path), (current) => {
    if (current === null) return 1
    if (!Number.isSafeInteger(current) || current < 0) return
    return current + 1
  })
}

export async function recordDownloadClick(platform = '') {
  await ensureAnonymousUser()

  const result = await incrementCounter('stats/download_count')

  if (!result.committed) {
    throw new Error('The download counter transaction was not committed.')
  }

  // Per-platform breakdown is deliberately best-effort and never rethrows: it
  // needs a rules deploy the aggregate counter does not, so a project still on
  // the older rules keeps working instead of failing every download click.
  if (platform === 'android' || platform === 'windows') {
    incrementCounter(`stats/platform_downloads/${platform}`).catch(() => {})
  }

  return result.snapshot.val()
}

function downloadOriginKey(lat, lng) {
  const encode = (value, positive, negative) =>
    `${value >= 0 ? positive : negative}${Math.abs(value)}`
  return `${encode(lat, 'n', 's')}_${encode(lng, 'e', 'w')}`
}

async function getApproximateDownloadOrigin() {
  if (!approximateOriginPromise) {
    approximateOriginPromise = fetch('/api/download-origin', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      // Give the small edge request a chance to finish if a mobile browser
      // briefly backgrounds this page while opening the download dialog.
      keepalive: true,
    })
      .then(async (response) => {
        if (!response.ok) return null

        const payload = await response.json()
        const lat = Number(payload.lat)
        const lng = Number(payload.lng)
        if (
          payload.available !== true ||
          !Number.isFinite(lat) ||
          !Number.isFinite(lng) ||
          lat < -90 ||
          lat > 90 ||
          lng < -180 ||
          lng > 180 ||
          lat % 5 !== 0 ||
          lng % 5 !== 0
        ) {
          return null
        }

        return { lat, lng }
      })
      .catch((error) => {
        // A failed request may be retried when the visitor confirms a
        // download; do not permanently cache a transient network failure.
        approximateOriginPromise = null
        throw error
      })
  }

  return approximateOriginPromise
}

/**
 * Start the two network prerequisites while the visitor is reading the
 * download dialog. This makes the eventual click transaction fast enough for
 * mobile browsers, which often suspend the page as soon as Drive opens.
 */
export function prepareDownloadTracking() {
  if (!isFirebaseConfigured) return Promise.resolve()
  return Promise.allSettled([
    ensureAnonymousUser(),
    getApproximateDownloadOrigin(),
  ])
}

/**
 * Cloudflare supplies approximate request coordinates to the same-origin Pages
 * Function. That function snaps them to a coarse 5° cell before returning; the
 * browser stores only an aggregate count for that cell. No IP, account id,
 * timestamp, or precise coordinate reaches Firebase.
 */
export async function recordApproximateDownloadOrigin(platform = '') {
  const origin = await getApproximateDownloadOrigin()
  if (!origin) return false
  const { lat, lng } = origin

  await ensureAnonymousUser()
  const originRef = ref(database, `stats/download_origins/${downloadOriginKey(lat, lng)}`)
  const result = await runTransaction(originRef, (current) => {
    const previous = current && typeof current === 'object' ? current : {}
    const android = Number.isSafeInteger(previous.android) ? previous.android : 0
    const windows = Number.isSafeInteger(previous.windows) ? previous.windows : 0
    const count = Number.isSafeInteger(previous.count) ? previous.count : 0
    return {
      lat,
      lng,
      count: count + 1,
      android: android + (platform === 'android' ? 1 : 0),
      windows: windows + (platform === 'windows' ? 1 : 0),
    }
  })
  return result.committed
}

export function subscribeToDownloadOrigins(onData, onError = console.error) {
  if (!isFirebaseConfigured) {
    onData([])
    return () => {}
  }

  return onValue(
    ref(database, 'stats/download_origins'),
    (snapshot) => {
      const origins = []
      snapshot.forEach((child) => {
        const value = child.val() || {}
        const lat = Number(value.lat)
        const lng = Number(value.lng)
        const count = Number(value.count)
        if (
          Number.isFinite(lat) &&
          Number.isFinite(lng) &&
          Number.isSafeInteger(count) &&
          count > 0
        ) {
          origins.push({ id: child.key, ...value, lat, lng, count })
        }
      })
      origins.sort((a, b) => b.count - a.count)
      onData(origins.slice(0, 80))
    },
    onError,
  )
}

export function subscribeToPlatformDownloads(onData, onError = console.error) {
  if (!isFirebaseConfigured) {
    onData({})
    return () => {}
  }

  return onValue(
    ref(database, 'stats/platform_downloads'),
    (snapshot) => onData(snapshot.val() || {}),
    onError,
  )
}

export function subscribeToComments(onData, onError = console.error) {
  if (!isFirebaseConfigured) {
    onData([])
    return () => {}
  }

  const latestComments = query(
    ref(database, 'comments'),
    orderByChild('createdAt'),
    limitToLast(50),
  )

  return onValue(
    latestComments,
    (snapshot) => {
      const rows = []
      snapshot.forEach((child) => {
        rows.push({ id: child.key, ...child.val() })
      })
      rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      onData(rows)
    },
    onError,
  )
}

export function subscribeToCommentReactions(
  commentId,
  onData,
  onError = console.error,
) {
  if (!isFirebaseConfigured) {
    onData({})
    return () => {}
  }

  return onValue(
    ref(database, `commentReactions/${commentId}`),
    (snapshot) => onData(snapshot.val() || {}),
    onError,
  )
}

export async function createComment({ authorName, body }) {
  await ensureAnonymousUser()
  const name = normalizeText(authorName, 40) || 'Anonymous builder'
  const message = normalizeText(body, 1000)

  if (message.length < 3) {
    throw new Error('Please write at least 3 characters.')
  }

  const commentRef = push(ref(database, 'comments'))
  await set(commentRef, {
    authorName: name,
    body: message,
    createdAt: serverTimestamp(),
  })

  return commentRef.key
}

const reactionTypes = new Set(['upvote', 'like', 'heart'])

export async function toggleCommentReaction(commentId, reaction) {
  if (!commentId || !reactionTypes.has(reaction)) {
    throw new Error('That reaction is not supported.')
  }

  const user = await ensureAnonymousUser()
  const reactionRef = ref(
    database,
    `commentReactions/${commentId}/${reaction}/${user.uid}`,
  )

  const result = await runTransaction(reactionRef, (current) =>
    current === true ? null : true,
  )
  if (!result.committed) {
    throw new Error('The reaction transaction was not committed.')
  }
}

export async function createBugReport({
  name,
  contact,
  category,
  description,
  device,
  appVersion,
}) {
  const user = await ensureAnonymousUser()
  const details = normalizeText(description, 2000)

  if (details.length < 5) {
    throw new Error('Please describe the issue in a little more detail.')
  }

  const payload = {
    authorId: user.uid,
    name: normalizeText(name, 60) || 'Anonymous builder',
    category: normalizeText(category, 32) || 'Other',
    description: details,
    appVersion: normalizeText(appVersion, 40) || 'Unknown',
    status: 'new',
    createdAt: serverTimestamp(),
  }

  const safeContact = normalizeText(contact, 160)
  const safeDevice = normalizeText(device, 120)
  if (safeContact) payload.contact = safeContact
  if (safeDevice) payload.device = safeDevice

  const reportRef = push(ref(database, 'bugReports'))
  await set(reportRef, payload)
  return reportRef.key
}

function normalizeText(value, maxLength) {
  return String(value || '')
    // Control characters are the point of this expression, not an accident:
    // visitor-supplied names and comments are stripped of them before they
    // reach the database.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength)
}
