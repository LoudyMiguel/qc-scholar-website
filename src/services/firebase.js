import { initializeApp } from 'firebase/app'
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from 'firebase/app-check'
import {
  browserLocalPersistence,
  browserSessionPersistence,
  connectAuthEmulator,
  indexedDBLocalPersistence,
  initializeAuth,
  signInAnonymously,
} from 'firebase/auth'
import {
  connectDatabaseEmulator,
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
import { parseCells } from './download-cells'
import { normalizeText } from './text'

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

const COMMENT_COOLDOWN_MS = 2 * 60 * 1000
const COMMENT_POSTED_AT_KEY = 'genxyz-lab-comment-posted-at'
const COMMENT_BODY_KEY = 'genxyz-lab-comment-body'

// Browser only: the build-time prerender imports this module in Node, where
// it must not open Firebase connections that would keep the build alive.
// Rendering only depends on `isFirebaseConfigured`, which is the same in both.
if (isFirebaseConfigured && typeof window !== 'undefined') {
  app = initializeApp(firebaseConfig)
  if (env.VITE_FIREBASE_APPCHECK_SITE_KEY) {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(
        env.VITE_FIREBASE_APPCHECK_SITE_KEY,
      ),
      isTokenAutoRefreshEnabled: true,
    })
  }

  // App Check must be initialized before any Firebase service is accessed.
  // initializeAuth is getAuth() without the popup/redirect resolver: the site
  // only signs in anonymously, and that resolver makes mobile browsers and
  // Safari load https://apis.google.com/js/api.js and a hidden auth iframe on
  // every page load, both of which the CSP blocks.
  auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
  })
  database = getDatabase(app)

  // Local development against `firebase emulators:start --only database,auth`
  // (see README). Never set in production builds.
  if (import.meta.env.VITE_FIREBASE_EMULATORS === 'true') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    connectDatabaseEmulator(database, '127.0.0.1', 9000)
  }
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

/**
 * Counts a download click through the same-origin Pages Function, which
 * applies the rate limits and records the approximate location itself. The
 * database rules deny direct client writes to the counters and the map.
 * `keepalive` lets the request finish while the browser opens the download.
 */
export async function recordDownload(platform) {
  const response = await fetch('/api/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ platform }),
    keepalive: true,
  })
  return response.ok
}

// Precise 0.25° cells (about 25 km). stats/download_origins holds the coarse
// 5° regions recorded before October 2026 and stays a separate data set, so
// the two precisions are never merged into one record.
const LOCATIONS_PATH = 'stats/download_locations'
const LEGACY_REGIONS_PATH = 'stats/download_origins'

/**
 * Streams both map data sets: precise `locations` and the coarse legacy
 * `regions`. Either listener updating re-emits the latest pair.
 */
export function subscribeToDownloadMap(onData, onError = console.error) {
  const state = { locations: [], regions: [] }
  if (!isFirebaseConfigured || !database) {
    onData(state)
    return () => {}
  }

  const listen = (path, field, limit) =>
    onValue(
      ref(database, path),
      (snapshot) => {
        const entries = []
        snapshot.forEach((child) => {
          entries.push([child.key, child.val()])
        })
        state[field] = parseCells(entries).slice(0, limit)
        onData({ ...state })
      },
      onError,
    )

  const stops = [
    listen(LOCATIONS_PATH, 'locations', 500),
    listen(LEGACY_REGIONS_PATH, 'regions', 200),
  ]
  return () => stops.forEach((stop) => stop())
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
  const name = normalizeText(authorName, 40) || 'Anonymous builder'
  const message = normalizeText(body, 500)

  if (message.length < 3) {
    throw new Error('Please write at least 3 characters.')
  }

  // The same checks run on the server; doing them here first gives instant
  // feedback without spending the visitor's rate limit.
  assertCommunityCommentAllowed(name)
  assertCommunityCommentAllowed(message)
  enforceLocalCommentCooldown(message)

  let response
  try {
    response = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ authorName: name, body: message }),
    })
  } catch {
    throw new Error('The comment could not be sent. Check your connection and try again.')
  }

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (result.error === 'too-soon' && Number.isSafeInteger(result.retryAfter)) {
      throw new Error(`Please wait ${result.retryAfter} seconds before posting again.`)
    }
    throw new Error(result.message || 'The comment could not be posted. Please try again later.')
  }

  rememberLocalComment(message)
  return result.id
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
    // Storage can be unavailable in privacy modes. The server still limits posts.
  }
}

function rememberLocalComment(message) {
  try {
    localStorage.setItem(COMMENT_POSTED_AT_KEY, String(Date.now()))
    localStorage.setItem(COMMENT_BODY_KEY, normalizeCommentForComparison(message))
  } catch {
    // Optional fast feedback only; the server enforces the real cooldown.
  }
}
