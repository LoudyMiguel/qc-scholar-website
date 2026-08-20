# GenXYZ Lab website

The marketing and download site for GenXYZ Lab, an offline-first learning and
coding studio. Vue 3 + Vite + Tailwind, with a lazy procedural Three.js hero,
multi-platform release downloads (Android APK and Windows), Firebase Realtime
Database community features, and Cloudflare Pages deployment headers.

Everything lives under `quizy/website`; nothing here modifies the Flutter
application.

- Quick deployment checklist: [`DEPLOYMENT_QUICKSTART.md`](DEPLOYMENT_QUICKSTART.md)
- Complete release process: [`RELEASE_RUNBOOK.md`](RELEASE_RUNBOOK.md)
- First-time deployment and domain setup: [`DEPLOYMENT.md`](DEPLOYMENT.md)

## Project structure

```text
website/
├─ assets-source/            # full-resolution originals, never shipped
├─ scripts/optimize-assets.mjs
├─ public/
│  ├─ assets/                # generated, web-sized images only
│  ├─ _headers               # CSP and cache policy
│  ├─ _redirects             # SPA fallback
│  └─ privacy.html
├─ src/
│  ├─ assets/main.css
│  ├─ components/
│  │  ├─ BrandLogo.vue          CommentCard.vue
│  │  ├─ CommunitySection.vue   DownloadModal.vue
│  │  ├─ FeatureBento.vue       HeroSection.vue
│  │  ├─ ImpactStrip.vue        LabScene.vue
│  │  ├─ PlatformDownloads.vue  ProductShowcase.vue
│  │  ├─ SetupGuide.vue         SiteFooter.vue
│  │  └─ SiteHeader.vue
│  ├─ composables/{useCommunity,useScrollExperience}.js
│  ├─ config/site.js         # releases, platform detection, site origin
│  ├─ services/firebase.js
│  ├─ three/labScene.js      # WebGL scene, dynamically imported
│  ├─ App.vue
│  └─ main.js
├─ .env.example
├─ database.rules.json
├─ firebase.json
├─ index.html
├─ package.json
├─ tailwind.config.js
└─ vite.config.js
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
npm run assets    # regenerate public/assets from assets-source/
```

**Run `npm run lint` before deploying.** A clean `vite build` does not mean the
page works: a bundler resolves imports, it does not check that every identifier
exists. A stale `terminalCards.forEach(...)` once built perfectly and then threw
a `ReferenceError` inside a GSAP setup callback at runtime, which aborted the
reveal-animation setup and left every section below the hero stuck at
`visibility: hidden`. The page shipped as a hero and a footer with nothing in
between. ESLint's `no-undef` flags that in about a second; that is the entire
reason the config exists.

Two defences were added alongside it, in `useScrollExperience.js` and
`main.js`: each motion setup step is isolated so one failure cannot cascade,
and the `js-motion` class that performs the initial hide is dropped once setup
finishes (plus a 4-second timeout in `main.js` for the case where the app never
mounts at all). The worst case is now a site without entrance animations rather
than a site with no visible content.

## Releases and platform downloads

`src/config/site.js` builds a `releases` array from environment variables. Each
entry carries its own URL, size, requirement line, and install note.

```env
VITE_APK_GOOGLE_DRIVE_URL=https://drive.google.com/file/d/APK_FILE_ID/view?usp=sharing
VITE_APK_SIZE=~100 MB
VITE_WINDOWS_GOOGLE_DRIVE_URL=https://drive.google.com/file/d/WINDOWS_FILE_ID/view?usp=sharing
VITE_WINDOWS_SIZE=~120 MB
VITE_APP_VERSION=1.0.0
VITE_RELEASE_DATE=2026-08-07
```

A missing URL, malformed URL, or URL outside Google Drive is treated as **not
published yet**: that platform renders as *Coming soon* with a disabled button
rather than opening a stale download host. The Drive files must be shared as
**Anyone with the link** and tested in a signed-out browser window.

The same Drive variables generate the deployed `version.json`, so both the
website and the installed app use one download source. Changing either URL
requires a new Pages build because Vite embeds the values at build time.

`detectPlatform()` reads the user agent to preselect a build and badge it
"Your device". It only reorders and preselects — user-agent detection is a
hint, never a fact, so every platform stays one click away.

Release binaries are never committed. Upload the APK and Windows ZIP to Google
Drive with versioned filenames, share each as **Anyone with the link**, and
put the two public share URLs in the Pages variables above.

## The Three.js hero

`src/three/labScene.js` builds a faceted core inside three tilted orbits
carrying toolchain nodes, each tethered to the centre. It uses only core
Three.js primitives with unlit materials — no loaders, no post-processing, no
lights — so it tree-shakes small and costs no lighting passes.

It is gated hard, because the library is ~180 kB gzipped and this product is
Android-first:

| Condition | Result |
|---|---|
| Viewport under 768 px | CSS fallback, Three.js never fetched |
| `navigator.connection.saveData` | CSS fallback, Three.js never fetched |
| WebGL unavailable or blocked | CSS fallback, canvas stays hidden |
| `prefers-reduced-motion: reduce` | One static composed frame, no RAF loop |
| Scrolled offscreen, or tab hidden | Loop paused |

The CSS fallback in `LabScene.vue` is a finished visual in its own right, not a
blank state. On teardown every geometry, material, and the renderer are
disposed and the WebGL context is explicitly released — browsers cap live
contexts per page.

## Connect Firebase

1. Create a Firebase project and register a Web app.
2. Create a Realtime Database in a region near the primary audience.
3. In **Authentication → Sign-in method**, enable **Anonymous**. Visitors get an
   invisible anonymous UID; no login screen is shown.
4. Copy `.env.example` to `.env.local` and fill in every `VITE_FIREBASE_*`
   value. Firebase Web API keys are intentionally public; never put a
   service-account key in this site.
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
comments/{commentId}
commentReactions/{commentId}/{upvote|like|heart}/{anonymousUid}
bugReports/{reportId}
```

Comments and reaction totals are public and update through live listeners.
Public comment records deliberately omit Firebase author UIDs. Reaction
listeners are scoped to the 50 visible comments rather than the whole tree. Bug
reports are not public: the rules let only the submitting anonymous user or an
account with an `admin: true` custom claim read a report. Public visitors
cannot edit or delete comments after submission; moderate through the Firebase
console or Admin SDK.

`stats/platform_downloads` needs the updated rules deployed. Its client
increment is deliberately best-effort and never rethrows, so a project still on
the older rules keeps working instead of failing every download click.

### What the counters mean

They count confirmation-link clicks, not completed installations. A public
client counter can never be authoritative: scripted anonymous accounts can
click repeatedly, navigation can interrupt an in-flight request, and direct
Drive links bypass the page entirely. Use Google Drive activity and site
analytics as supporting evidence rather than treating the counter as an
installation total. For stronger abuse controls, move
comment and download writes behind a rate-limited Cloudflare Worker or a
Firebase callable function.

## Images

`assets-source/` holds the full-resolution artwork originals and is never
copied into the bundle — see [`assets-source/README.md`](assets-source/README.md).

**The app icon is read directly from the Flutter project**
(`../assets/images/app_ic.png`), not from a copy. A duplicated copy previously
went stale through an entire rebrand: the app moved to the GenXYZ "G" mark
while the site kept generating its favicon, logo, and social card from the old
"Q". The script also measures the icon's own corner radius and cuts the
painted-black corners to real transparency, since the source PNG has no alpha.

`npm run assets` regenerates everything in `public/assets`:

| Output | Purpose |
|---|---|
| `logo.png` (256²) | Header and footer mark |
| `apple-touch-icon.png` (180²) | iOS home screen |
| `favicon.png` (48²) | Browser tab |
| `og-cover.png` (1200×630) | Social link previews |
| `feature-lab.webp`, `community-constellation.webp` | Section artwork |

This pass took shipped image weight from about 5.1 MB to 422 kB. The previous
`app_ic.png` was a 1.45 MB, 1254² file used as both the favicon and a 40 px
header logo.

Regeneration prompts for the artwork are in
[`assets-source/IMAGE_PROMPTS.md`](assets-source/IMAGE_PROMPTS.md).

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
`frame-src`, or the navigation policy in `_headers` and check the deployed
browser console.

## Accessibility and performance decisions

- The download modal traps focus, closes on Escape/backdrop/secondary action,
  and restores focus to the trigger.
- Visitor text renders as plain Vue interpolation; the site never uses `v-html`
  for Firebase content.
- All important information stays readable without WebGL or generated artwork.
- `prefers-reduced-motion` disables scroll smoothing, entrance motion, and
  continuous scene movement.
- Controls use visible focus rings and 44–48 px minimum targets.
- Platform detection changes presentation only; it never hides a download.
