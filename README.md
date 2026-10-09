# GenXYZ Lab website

The marketing and download site for GenXYZ Lab, an offline-first learning and
coding studio. Vue 3 + Vite + Tailwind, with light and dark themes, an HTML/CSS
product preview instead of bitmap artwork, a lazy-loaded OpenStreetMap download
map, multi-platform release downloads (Android APK and Windows), Firebase
Realtime Database community features, and Cloudflare Pages.

Everything lives under `quizy/website`; nothing here modifies the Flutter
application.

- Quick deployment checklist: [`DEPLOYMENT_QUICKSTART.md`](DEPLOYMENT_QUICKSTART.md)
- Complete release process: [`RELEASE_RUNBOOK.md`](RELEASE_RUNBOOK.md)
- First-time deployment and domain setup: [`DEPLOYMENT.md`](DEPLOYMENT.md)

## Project structure

```text
website/
├─ scripts/
│  ├─ optimize-assets.mjs         # app icon -> favicon, logo, social card
│  └─ prerender.mjs               # writes rendered pages into dist/
├─ public/
│  ├─ assets/                     # generated icons and social card only
│  ├─ theme-init.js               # applies light/dark before first paint
│  ├─ _headers                    # CSP and cache policy
│  ├─ _redirects                  # SPA fallback
│  └─ privacy.html
├─ functions/
│  ├─ _middleware.js              # www redirect, BLOCKED_IPS
│  └─ api/comments.js  api/download.js  # the only write paths (rate-limited)
├─ server/                        # shared by the functions: Firebase admin
│                                 # REST client, IP parsing, rate limits
├─ incidents/                     # incident reports and cleanup data
├─ src/
│  ├─ assets/main.css             # theme tokens and shared component classes
│  ├─ components/
│  │  ├─ SiteHeader.vue  ThemeToggle.vue  BrandLogo.vue  SiteFooter.vue
│  │  ├─ HeroSection.vue  AppPreview.vue  StatsStrip.vue
│  │  ├─ FeaturesSection.vue  WorkflowSection.vue  SetupGuide.vue
│  │  ├─ PlatformDownloads.vue  DownloadMap.vue
│  │  └─ CommunitySection.vue  CommentCard.vue
│  ├─ composables/
│  │  ├─ useTheme.js              # shared light/dark state
│  │  ├─ useReleases.js           # manifest fetch + tracked download flow
│  │  ├─ useActiveSection.js      # nav highlighting via IntersectionObserver
│  │  └─ useCommunity.js
│  ├─ config/site.js              # releases, platform detection, site origin
│  ├─ services/firebase.js
│  ├─ App.vue  DocsApp.vue  docs-content.js
│  ├─ entry-server.js             # build-time render of both pages
│  └─ main.js  docs-main.js       # hydrate the pre-rendered markup
```

## Run locally

Node 20 or newer.

```bash
cd "C:\flutter project\quizy\website"
npm install
copy .env.example .env.local
npm run dev
```

The page works without Firebase credentials. Until they are configured, the
community UI shows a preview state and its write controls stay disabled.

```bash
npm run lint      # ESLint — catches undefined references
npm run build     # production bundle into dist/
npm run check     # lint, then build (run this before deploying)
npm run preview   # serve the built bundle
npm run assets    # regenerate public/assets from the Flutter app icon
node --test 'functions/**/*.test.js' 'src/**/*.test.js' 'server/*.test.js' 'download-worker/src/*.test.js'
```

`server/emulator.test.js` runs the write endpoints against the Realtime
Database emulator. It is skipped unless the emulator is running:

```bash
firebase emulators:start --only database --project demo-genxyz
# in another terminal
FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 node --test server/emulator.test.js
```

To click through the whole site locally without touching production, start
the database and auth emulators, build with `VITE_FIREBASE_EMULATORS=true` and
the `demo-genxyz` project values, and serve it with
`npx wrangler pages dev dist --binding FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 --binding FIREBASE_DATABASE_URL=https://demo-genxyz-default-rtdb.firebaseio.com`.
Load the rules into the emulator with
`curl -X PUT -H "Authorization: Bearer owner" --data-binary @database.rules.json "http://127.0.0.1:9000/.settings/rules.json?ns=demo-genxyz-default-rtdb"`
if `firebase.json` is not picked up.

**Run `npm run lint` before deploying.** A clean `vite build` does not mean the
page works: a bundler resolves imports, it does not check that every identifier
exists. A stale reference once built perfectly and then threw a
`ReferenceError` at runtime, which blanked every section below the hero.
ESLint's `no-undef` flags that in about a second; that is the entire reason the
config exists.

Content is never hidden waiting for JavaScript any more: there are no
scroll-triggered entrance animations, so a script failure can at worst lose an
interactive widget, never the page.

## Releases and platform downloads

`src/config/site.js` builds a `releases` array from the tracked
`release-manifest.json`. The two URLs are permanent first-party routes; a
Cloudflare Worker resolves them to the newest stable GitHub Release.

```json
{
  "android": {
    "version": "1.0.0",
    "url": "https://downloads.genxyzlab.org/latest.apk",
    "size": "100 MB",
    "releaseDate": "2026-08-07",
    "notes": "Release summary"
  }
}
```

A missing URL, malformed URL, or URL outside the exact
`downloads.genxyzlab.org` platform route is treated as **not published yet**.
This prevents an old Cloudflare variable from restoring Google Drive or R2.

The Pages Function at `/version.json` proxies the Worker's live GitHub release
metadata. The installed app and the download cards therefore receive the new
version, date, notes, and asset sizes after a release is published, without a
website commit. The Vite-generated file remains a local/static-build fallback.

`detectPlatform()` reads the user agent to highlight a build and badge it
"Your device". It returns `''` for anything that is not confidently Android or
Windows (iPhone, iPad, Mac, Linux), so those visitors see the neutral download
section instead of a badge on a build they cannot install. User-agent detection
is a hint, never a fact, so every platform stays one click away.

When a platform is detected, the hero button downloads that build directly
(`useReleases.js`); otherwise it scrolls to the download cards. The hero and the
cards share one manifest request and one tracked-download flow.

Release binaries are never committed to the website. Every stable GitHub
Release must upload assets named exactly `GenXYZ-Lab.apk` and
`GenXYZ-Lab-Windows.zip`; the Git tag carries the version.

## Pre-rendering and SEO

`npm run build` runs three steps: the normal browser build, a Node build of
`src/entry-server.js`, and `scripts/prerender.mjs`, which renders both pages
and writes the markup into `dist/index.html` and `dist/docs/index.html` in
place of their `<!--app-html-->` mount points. The browser then hydrates that
markup (`createSSRApp` in `main.js` / `docs-main.js`) instead of building the
page from scratch.

That gives two things at once. The first paint is the real page, so there is
no fallback screen flashing before the app loads, and search engines, link
previews, and AI crawlers read the complete content without running
JavaScript. A render failure fails the build on purpose.

Code that depends on the visitor (theme, platform, live Firebase data) must
not change the first render, or hydration will not match the pre-rendered
HTML. Read such state in `onMounted`, or drive it from CSS: the theme toggle
picks its icon from the `dark` class that `theme-init.js` sets before paint.

SEO placeholders in the HTML entries are filled at build time by the
`htmlMetadata` plugin in `vite.config.js`: `%SITE_URL%` from `VITE_SITE_URL`
(defaulting to the production origin) and `%RELEASE_VERSION%`,
`%RELEASE_DATE%`, `%RELEASE_NOTES_URL%` from `release-manifest.json`, so the
structured data always names the shipped release.

## Themes

Light and dark themes are a single set of CSS variables in
`src/assets/main.css`; `tailwind.config.js` maps them to semantic colour names
(`bg-surface`, `text-fg-muted`, `border-line`, `bg-brand`), so components never
hard-code a shade. Every text/background pairing meets WCAG AA contrast.

`public/theme-init.js` runs synchronously in `<head>` and adds `light` or
`dark` to `<html>` before first paint, so there is no flash of the wrong theme.
It is a separate file rather than an inline script because the CSP forbids
inline JavaScript. The page follows the operating-system setting until the
visitor uses the toggle; the choice is then stored in `localStorage` under
`genxyz-theme` (shared by the site, the docs, and the privacy page).

## Download map

`DownloadMap.vue` lazy-loads Leaflet (open source, BSD-2) only when its section
nears the viewport and draws OpenStreetMap's standard tiles. OSM's tile usage
policy requires the visible attribution (kept in the corner) and a normal
browser Referer (the default here); if the site ever outgrows that free
service, swap `TILE_URL` for a keyed provider such as MapTiler or Stadia.
OpenStreetMap has no dark style, so dark mode applies a CSS filter to the tile
layer only.

Every location is drawn as the same-size dot at its exact stored coordinate;
totals and the Android/Windows split appear in the tooltip and in the "Most
active locations" list, which also zooms the map to a location when clicked.
The wheel never hijacks page scrolling: it zooms only after the map is clicked
or focused, and on phones one finger scrolls the page while pinch zooms.

A download click posts `{ platform }` to `/api/download`. The function reads
Cloudflare's approximate request coordinates (never the browser's), snaps them
to a **0.25° cell** (about 25 km), and adds one to that cell's aggregate count
under `stats/download_locations`, together with the download counter and the
platform total. The map stores no IP address, precise coordinate, user id,
timestamp or device identifier. Keys encode the decimal point as `p`
(`n14p25_e121`), because Firebase keys cannot contain `.`.

Downloads recorded before October 2026 were rounded to 5° and stay under
`stats/download_origins`, a separate data set so the two precisions are never
merged. The map draws them as faint, true-size ~550 km areas instead of points,
and leaves them out of the "Most active locations" list.

Browsers can read the map but not write to it. The rules deny every client
write under `stats`, so a script cannot place points (see
`incidents/2026-10-08`).

## Connect Firebase

1. Create a Firebase project and register a Web app.
2. Create a Realtime Database in a region near the primary audience.
3. In **Authentication → Sign-in method**, enable **Anonymous**. Visitors get an
   invisible anonymous UID; no login screen is shown.
4. Copy `.env.example` to `.env.local` and fill in every `VITE_FIREBASE_*`
   value. Firebase Web API keys are intentionally public; never put a
   service-account key in a `VITE_*` variable (those ship to every browser).
   The service account belongs only in the Cloudflare secret described under
   "Abuse protection".
5. Deploy the included default-deny rules:

   ```bash
   npm install --global firebase-tools
   firebase login
   firebase use --add
   firebase deploy --only database
   ```

6. Add the production domain to **Authentication → Settings → Authorized
   domains**.
7. Recommended: register a reCAPTCHA Enterprise app in Firebase App Check, put
   its site key in `VITE_FIREBASE_APPCHECK_SITE_KEY`, watch valid traffic, then
   enforce App Check for Realtime Database.

Data layout:

```text
stats/download_count
stats/platform_downloads/{android|windows}
stats/download_locations/{cell} # 0.25° cells: { lat, lng, count, android, windows }
stats/download_origins/{cell}   # legacy 5° regions (before Oct 2026), same shape
comments/{commentId}
commentReactions/{commentId}/{upvote|like|heart}/{anonymousUid}
bugReports/{reportId}
security/rateLimits/{action}/{yyyymmdd}/{ipHash}  # admin-only, kept 2 days
security/globalLimits/{action}/{yyyymmddhh}       # admin-only, kept 2 days
security/blocked/{ipHash}                         # admin-only, 24 h blocks
security/offenders/{ipHash}                       # admin-only, kept 30 days
```

Comments and reaction totals are public and update through live listeners.
Public comment records deliberately omit Firebase author UIDs. Reaction
listeners are scoped to the 50 visible comments rather than the whole tree. Bug
reports are not public: the rules let only the submitting anonymous user or an
account with an `admin: true` custom claim read a report. Public visitors
cannot edit or delete comments after submission; moderate through the Firebase
console or Admin SDK.

### What the counters mean

They count download-button clicks, not completed installations. The server
counts at most 20 clicks per network address per day and 400 site-wide per
hour. Direct GitHub asset links bypass the page entirely. Use GitHub release
asset statistics and site analytics as supporting evidence rather than
treating the counter as an installation total.

## Abuse protection

Browsers never write comments, counters or map points to Firebase. They post
to two Pages Functions, which write with a Google service account after these
checks:

| | Per address | Site-wide |
| --- | --- | --- |
| `POST /api/comments` | 1 per 2 minutes, 10 per day | 60 per hour |
| `POST /api/download` | 1 per 15 seconds, 20 per day | 400 per hour |

- **Blocklist first.** `BLOCKED_IPS` and the automatic blocks are checked
  before anything else.
- **Same-origin only.** Requests must carry this site's `Origin` header.
- **Comment checks.** Comments pass the form's moderation checks again and must
  not repeat any of the last 50 comments.
- **Strikes and blocks.** A request that breaks a limit, or a comment refused
  as spam or as a duplicate, counts as a strike against its address. After
  **20 strikes in a UTC day** the address is blocked for 24 hours on both
  endpoints.
- **Site-wide cap.** It is checked last, so refused junk never uses up real
  visitors' allowance, and it never strikes anyone.
- **What is stored.** Rate-limit records hold only an HMAC of the address.

Limits live in `server/abuse-guard.js` (`LIMITS`, `STRIKES_TO_BLOCK`).

### Setup (required, or comments and download counting stop)

1. **Firebase console → Project settings → Service accounts → Generate new
   private key.** This downloads a JSON file.
2. **Cloudflare → Workers & Pages → the Pages project → Settings → Variables
   and Secrets → Add.** Choose type **Secret**, name it
   `FIREBASE_SERVICE_ACCOUNT`, and paste the whole JSON file as the value.
   Add it for Production (and Preview, if previews should accept writes).
3. Delete the downloaded JSON file. Anyone with it has full database access.
4. Redeploy the site, then deploy the rules: `firebase deploy --only database`.

The functions read the database URL from `VITE_FIREBASE_DATABASE_URL`, which
is already set. You can optionally set `FIREBASE_DATABASE_URL` to override it,
and `IP_HASH_SECRET` (any long random string) to key the address hashes
independently of the service account. Without `FIREBASE_SERVICE_ACCOUNT`,
both endpoints answer 503: the form shows "Comments are temporarily unavailable", and
downloads still start but are not counted.

### Tracking and blocking addresses

- **Offenders.** In **Firebase console → Realtime Database → Data →
  `security/offenders`**, every address that broke a rule appears with its IP,
  country, network (ASN and name), user agent, first and last time seen,
  rejection count and last reason. `security/blocked` lists the current
  automatic 24-hour blocks.
- **Live events.** **Cloudflare → the Pages project → Functions → Real-time
  logs** shows each refusal as it happens (`"event":"abuse"`).
- **Permanent blocks.** Add the address or range under **Cloudflare → the
  domain → Security → WAF → Tools → IP Access Rules → Block**. This takes
  effect immediately and covers every request, including static files.
  Alternatively, list addresses or CIDR ranges in the `BLOCKED_IPS` Pages
  variable (comma or space separated). The middleware and both endpoints
  refuse them, but a variable change needs a redeploy.
- **Unblock early.** Delete the entry under `security/blocked`.

For a second layer, add a Cloudflare WAF rate-limiting rule for
`/api/comments` and `/api/download`. You can also lower **Authentication →
Settings → Sign-up quota** in Firebase, because anonymous accounts are still
used for reactions and bug reports, or enforce App Check (step 7 above).

## Images

The only shipped bitmaps are the brand icons and the social card. The hero's
product preview (`AppPreview.vue`) is HTML and CSS, so it stays sharp at any
size, follows the theme, and costs no image download.

**The app icon is read directly from the Flutter project**
(`../assets/images/app_ic.png`), not from a copy. A duplicated copy previously
went stale through an entire rebrand: the app moved to the GenXYZ "G" mark
while the site kept generating its favicon, logo, and social card from the old
"Q". If this repository is checked out on its own, put a copy at
`assets-source/app_ic.png` and the script falls back to it. The script also
measures the icon's own corner radius and cuts the painted-black corners to
real transparency, since the source PNG has no alpha.

`npm run assets` regenerates everything in `public/assets`:

| Output | Purpose |
|---|---|
| `logo.png` (256²) | Header and footer mark |
| `apple-touch-icon.png` (180²) | iOS home screen |
| `favicon.png` (48²) | Browser tab |
| `og-cover-v3.png` (1200×630) | Social link preview in the site's light design: hero headline, key numbers, editor preview |

The social card's file name is versioned because link previews cache images
by URL. When its design changes, bump `OG_COVER_FILE` in the script and the
`og:image`/`twitter:image` tags in both HTML entries. The script's generators
are importable, so one output can be regenerated alone:

```bash
node -e "const m = await import('./scripts/optimize-assets.mjs'); const icon = '../assets/images/app_ic.png'; await m.ogCover(icon, await m.measureCornerRadiusRatio(icon))"
```

## Deploy to Cloudflare Pages

- **Root directory:** `website`
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node version:** `20`

Add every production `VITE_*` value under **Workers & Pages → your project →
Settings → Variables and Secrets**, then redeploy. Vite substitutes them at
build time, so a variable change always needs a fresh deployment.

`public/_headers` carries a restrictive CSP and cache policy; `public/_redirects`
provides the SPA fallback. `robots.txt` and `sitemap.xml` are generated at build
time from `VITE_SITE_URL` — do not add static copies, or the domain ends up
defined in three places.

If Firebase, reCAPTCHA, or the download hostname changes, update `connect-src`,
`script-src`, `frame-src`, or the navigation policy in `_headers` and check the
deployed browser console. A regional Realtime Database
(`*.firebasedatabase.app`) needs the same `script-src` and `frame-src` entries
as `*.firebaseio.com`.

Two allowances in the CSP are easy to mistake for leftovers:

- `https://*.firebaseio.com/.lp` in `script-src` and `frame-src` is Firebase's
  long-polling transport. The Realtime Database SDK uses it on networks that
  block WebSockets (common on school and office Wi-Fi), whenever a WebSocket
  has previously failed in that browser, and when site storage is blocked. It
  loads data as script tags from `/.lp` and opens a hidden disconnect frame
  there; without these the download counter and map stay empty for those
  visitors. Keep the `/.lp` path: the Realtime Database REST API on every
  `*.firebaseio.com` host echoes its `?callback=` parameter back as
  JavaScript, so allowing the bare host would let injected HTML run any
  script.
- `https://static.cloudflareinsights.com` in `script-src` and
  `https://cloudflareinsights.com` in `connect-src` let Cloudflare Web
  Analytics, which the Pages project injects into every page, load and report.
  Remove both if Web Analytics is switched off, and keep the Site analytics
  section of `public/privacy.html` in step with that setting.

The download redirector is a separate Worker under `download-worker/`. Deploy
it with `npx wrangler deploy`, then attach the Worker Custom Domain
`downloads.genxyzlab.org`. Do not attach that hostname to the Pages project.

## Accessibility and performance decisions

- No scroll-jacking, parallax, or scroll-triggered animation: native scrolling
  only, and smooth anchor scrolling is switched off for
  `prefers-reduced-motion`. The site previously ran GSAP + Lenis on every frame;
  both libraries are gone.
- Nothing animates continuously. The only motion is short colour transitions
  on hover and loading spinners while something is actually loading.
- No `backdrop-filter`, large `blur()` layers, full-screen noise overlays, or
  pointer-tracked masks — the effects that made low-end phones stutter.
- Leaflet and its CSS (~44 kB gzipped) load only when the map section nears the
  viewport. One font family (Inter) replaces three.
- Visitor text renders as plain Vue interpolation; the site never uses `v-html`
  for Firebase content. Map tooltips are built only from validated numbers.
- All important information stays readable without the map, which also has a
  plain list of the most active locations.
- Controls use visible focus rings and 40–48 px minimum targets; a skip link
  moves focus to the main content.
- Platform detection changes presentation only; it never hides a download.
