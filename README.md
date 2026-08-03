# QC Scholar website

A production-ready Vue 3/Vite landing page for QC Scholar. It includes a lazy-loaded procedural Three.js hero, an accessible download-intercept modal, Firebase Realtime Database interactions, anonymous reactions, private bug reports, and Cloudflare Pages deployment headers.

Everything in this project lives under `quizy/website`; it does not modify the Flutter application.

## Project structure

```text
website/
├─ public/
│  ├─ assets/IMAGE_PROMPTS.md
│  ├─ _headers
│  ├─ _redirects
│  └─ favicon.svg
├─ src/
│  ├─ assets/main.css
│  ├─ components/
│  │  ├─ BrandLogo.vue
│  │  ├─ CommentCard.vue
│  │  ├─ CommunitySection.vue
│  │  ├─ DownloadModal.vue
│  │  ├─ FeatureBento.vue
│  │  ├─ HeroSection.vue
│  │  ├─ ImpactStrip.vue
│  │  ├─ ProductShowcase.vue
│  │  ├─ ScholarScene.vue
│  │  ├─ SetupGuide.vue
│  │  ├─ SiteFooter.vue
│  │  └─ SiteHeader.vue
│  ├─ composables/useCommunity.js
│  ├─ config/site.js
│  ├─ services/firebase.js
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

Use Node 20 or newer.

```bash
cd "C:\flutter project\quizy\website"
npm install
copy .env.example .env.local
npm run dev
```

The marketing page works without Firebase credentials. Until they are configured, the community UI shows a clear preview state and its write controls remain disabled.

Create a production bundle with:

```bash
npm run build
npm run preview
```

## Connect Firebase

1. Create a Firebase project and register a Web app.
2. Create a Realtime Database. Choose a region near the primary audience.
3. In **Authentication → Sign-in method**, enable **Anonymous** authentication. Visitors receive an invisible anonymous UID; no login screen is shown.
4. Copy `.env.example` to `.env.local` and replace every `VITE_FIREBASE_*` value with the Web app configuration. Firebase Web API keys are intentionally public; never put a service-account key in this site.
5. Install the Firebase CLI and deploy the included default-deny rules:

   ```bash
   npm install --global firebase-tools
   firebase login
   firebase use --add
   firebase deploy --only database
   ```

6. Add the final Cloudflare Pages domain to **Authentication → Settings → Authorized domains**.
7. Recommended: register a reCAPTCHA Enterprise app in Firebase App Check for the production domain, place its site key in `VITE_FIREBASE_APPCHECK_SITE_KEY`, monitor valid traffic, then enforce App Check for Realtime Database.

The data layout is:

```text
stats/download_count
comments/{commentId}
commentReactions/{commentId}/{upvote|like|heart}/{anonymousUid}
bugReports/{reportId}
```

Comments and reaction totals are public and update through live listeners. Public comment records deliberately omit Firebase author UIDs. Reaction listeners are scoped to the 50 visible comments instead of downloading the entire reaction tree. Bug reports are not public; the included rules let only the submitting anonymous user or an account with an `admin: true` custom claim read the exact report. Public visitors cannot edit or delete comments after submission. Administrators can moderate through the Firebase console/Admin SDK.

### What the counter means

`download_count` is an atomic, best-effort count of confirmation-link clicks, not completed APK installations. A direct public client counter can never be authoritative: scripted anonymous accounts can click repeatedly, navigation can interrupt an in-flight client request, and direct R2 links bypass the page. Use Cloudflare R2/Analytics logs as the source of truth for file requests. For stronger abuse controls later, place comment/download writes behind a rate-limited Cloudflare Worker or Firebase callable function.

Public reaction membership is keyed by random Firebase anonymous UIDs so one anonymous account can toggle only its own reaction. Those pseudonymous keys are readable under the public reaction path even though the UI never displays them. At larger scale, replace this MVP model with private vote membership plus trusted server-maintained aggregate counts.

## Configure the R2 APK

The APK should not be committed to Git. Upload it to a public Cloudflare R2 bucket or a bucket served through a custom download domain.

Set object metadata when uploading:

- `Content-Type: application/vnd.android.package-archive`
- `Content-Disposition: attachment; filename="qc-scholar-latest.apk"`
- A long cache lifetime only if the object name is versioned. Do not long-cache a mutable `latest` object.

Then set this Cloudflare Pages environment variable:

```text
VITE_APK_DOWNLOAD_URL=https://downloads.your-domain.com/qc-scholar-v1.0.0.apk
```

Optional release presentation variables:

```text
VITE_APP_VERSION=1.0.0
VITE_APK_SIZE=~100 MB
VITE_RELEASE_DATE=2026-08-02
```

The final modal link always proceeds to the APK even if Firebase tracking is unavailable.

## Deploy to Cloudflare Pages

For a repository whose root is the Flutter project, use:

- **Root directory:** `website`
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node version:** `20`

Add every production `VITE_*` value under **Workers & Pages → your project → Settings → Variables and Secrets**, then redeploy. Vite substitutes these values at build time.

The files in `public/_headers` provide a restrictive security policy and `public/_redirects` provides an SPA fallback. If Firebase, reCAPTCHA, or the R2 hostname changes, update the `connect-src`, `frame-src`, or download navigation policy as needed and test the deployed browser console.

## Add generated artwork

The three detailed generation prompts are in [`public/assets/IMAGE_PROMPTS.md`](public/assets/IMAGE_PROMPTS.md). Save optimized results with these exact names:

```text
public/assets/hero-scholar.webp
public/assets/feature-lab.webp
public/assets/community-constellation.webp
```

No image is required for the first run. The live Three.js scene and CSS surfaces provide graceful fallbacks, and the generated art is decorative rather than a container for essential text.

## Accessibility and performance decisions

- The modal traps keyboard focus, closes with Escape/backdrop/secondary action, and restores focus.
- Visitor text is rendered as plain Vue interpolation; the site never uses `v-html` for Firebase content.
- All important information remains readable without WebGL or generated assets.
- Three.js is loaded as a separate lazy chunk, pauses offscreen, caps device pixel ratio, and disposes GPU resources on unmount.
- `prefers-reduced-motion` disables continuous scene movement and CSS animation.
- Controls use visible focus rings and minimum 44–48 px targets.
