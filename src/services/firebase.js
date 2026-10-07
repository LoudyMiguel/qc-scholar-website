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
import {
  assertCommunityCommentAllowed,
  normalizeCommentForComparison,
} from './comment-moderation'

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

const COMMENT_COOLDOWN_MS = 2 * 60 * 1000
const COMMENT_POSTED_AT_KEY = 'genxyz-lab-comment-posted-at'
const COMMENT_BODY_KEY = 'genxyz-lab-comment-body'

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
  const platformGroup = platform === 'android32' ? 'android' : platform
  if (platformGroup === 'android' || platformGroup === 'windows') {
    incrementCounter(`stats/platform_downloads/${platformGroup}`).catch(() => {})
  }

  return result.snapshot.val()
}

// Must match GRID_DEGREES in functions/api/download-origin.js and the
// `* 4) % 1` checks in database.rules.json.
const ORIGIN_CELLS_PER_DEGREE = 4

function isOriginGridValue(value) {
  return Number.isInteger(value * ORIGIN_CELLS_PER_DEGREE)
}

function downloadOriginKey(lat, lng) {
  // Firebase keys cannot contain '.', so 14.25 is written as 14p25. Whole
  // degrees keep their original form (n15_e120), so 5° records written before
  // the finer grid still resolve to the same keys.
  const encode = (value, positive, negative) =>
    `${value >= 0 ? positive : negative}${String(Math.abs(value)).replace('.', 'p')}`
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
          !isOriginGridValue(lat) ||
          !isOriginGridValue(lng)
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
 * Function. That function snaps them to a 0.25° (~25 km) cell before returning; the
 * browser stores only an aggregate count for that cell. No IP, account id,
 * timestamp, or precise coordinate reaches Firebase.
 */
export async function recordApproximateDownloadOrigin(platform = '') {
  const origin = await getApproximateDownloadOrigin()
  if (!origin) return false
  const { lat, lng } = origin

  await ensureAnonymousUser()
  const platformGroup = platform === 'android32' ? 'android' : platform
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
      android: android + (platformGroup === 'android' ? 1 : 0),
      windows: windows + (platformGroup === 'windows' ? 1 : 0),
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
      onData(origins.slice(0, 500))
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
  const user = await ensureAnonymousUser()
  const name = normalizeText(authorName, 40) || 'Anonymous builder'
  const message = normalizeText(body, 500)

  if (message.length < 3) {
    throw new Error('Please write at least 3 characters.')
  }

  assertCommunityCommentAllowed(message)
  enforceLocalCommentCooldown(message)

  const commentRef = push(ref(database, 'comments'))
  const rateLimitRef = ref(database, `commentRateLimits/${user.uid}`)
  try {
    await set(rateLimitRef, {
      commentId: commentRef.key,
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    if (error?.code === 'PERMISSION_DENIED') {
      throw new Error('Please wait two minutes before posting another comment.')
    }
    throw error
  }

  await set(commentRef, {
    authorName: name,
    body: message,
    createdAt: serverTimestamp(),
  })

  rememberLocalComment(message)

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

function enforceLocalCommentCooldown(message) {
  try {
    const lastPostedAt = Number(localStorage.getItem(COMMENT_POSTED_AT_KEY))
    const lastBody = localStorage.getItem(COMMENT_BODY_KEY)
    const elapsed = Date.now() - lastPostedAt
    if (Number.isFinite(lastPostedAt) && elapsed < COMMENT_COOLDOWN_MS) {
      const seconds = Math.ceil((COMMENT_COOLDOWN_MS - elapsed) / 1000)
      throw new Error(`Please wait ${seconds} seconds before posting again.`)
    }
    if (lastBody === normalizeCommentForComparison(message)) {
      throw new Error('That comment was already posted.')
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Please')) throw error
    // Storage can be unavailable in privacy modes. Firebase rules still apply.
  }
}

function rememberLocalComment(message) {
  try {
    localStorage.setItem(COMMENT_POSTED_AT_KEY, String(Date.now()))
    localStorage.setItem(COMMENT_BODY_KEY, normalizeCommentForComparison(message))
  } catch {
    // Optional fast feedback only; Firebase rules enforce the real cooldown.
  }
}
