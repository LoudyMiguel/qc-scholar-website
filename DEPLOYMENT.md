# GenXYZ Lab website — deployment & launch guide

Everything in this file is an action **you** need to take. The code side is
done, committed, and building clean.

## The plan, and one correction to it

The move: new GitHub repo → new Cloudflare Pages project → same Firebase →
same R2. No domain purchase needed — Cloudflare gives every Pages project a
free `*.pages.dev` URL.

**One thing doesn't work the way it looks like it should: Cloudflare Pages has
no "change the connected repository" option on an existing project.** It's not
a setting you haven't found — there genuinely isn't one; Cloudflare's own
community confirms switching repos means creating a new project
([source](https://community.cloudflare.com/t/how-to-change-repo-connected-to-page/332796)).
So this isn't "point `qc-scholar-website` at the new repo" — it's "stand up a
new project connected to the new repo," which is exactly what you'd do anyway
by creating a new repo. Nothing here costs you a domain purchase; it only
costs you a second `*.pages.dev` URL to redirect from later, if you want to.

The old `qc-scholar-website` project and repo are untouched by any of this —
leave them running, or delete them once the new one is confirmed working.

---

## Step 1 — Create the GitHub repository

On [github.com/new](https://github.com/new):

- **Name:** `genxyz-lab-website` (matches the package name and every doc in
  this repo already — but `genxyz-lab` works too if you'd rather; GitHub repos
  can be renamed later without breaking anything, unlike a Cloudflare Pages
  project name)
- **Visibility:** your call. Nothing secret lives in this repo — Firebase Web
  API keys are meant to be public (Firebase's own docs say so), and
  `.env.local` is gitignored and was never committed. Public is fine if you
  want it discoverable; private if you'd rather not.
- Leave "Initialize with a README" **unchecked** — this repo already has one,
  and an unrelated initial commit on GitHub's side would conflict with the
  push.

Click **Create repository**, then send me the URL it gives you (the
`https://github.com/...` one on the Quick Setup page). I'll take it from
there.

---

## Step 2 — I push the code

Once I have the URL:

```bash
cd "C:\flutter project\quizy\website"
git remote add genxyz https://github.com/<you>/genxyz-lab-website.git
git push genxyz main
```

Everything is already committed locally (46 files, the full rebrand — 3D hero,
Windows downloads, product data, image pipeline, ESLint). This push carries
all of it in one commit. Your existing `qc-scholar-website` repo is left
exactly as it is; this only adds a new remote.

---

## Step 3 — Firebase: nothing to do

Confirming this plainly since you asked about it: **zero changes.** The same
`qc-scholar-689f8` Firebase project, same Realtime Database, same web app
config. Firebase doesn't know or care which GitHub repo or Cloudflare project
is calling it — it authorizes by **domain**, which is a step below (Step 6).

---

## Step 4 — Cloudflare R2: nothing to do, except the two uploads

Same bucket (`qc-scholar-releases`), same object prefix, same public R2
hostname. R2 has no concept of "which repo" either — the website just points
at whatever URL you tell it to via an env var.

**The two files you mentioned are the one piece I can't do from here** — I
have no access to your signed release artifacts. [`RELEASE_RUNBOOK.md`](RELEASE_RUNBOOK.md)
has the exact upload commands:

- **APK** — Step 7 (`npx wrangler r2 object put "qc-scholar-releases/releases/..."`)
- **Windows zip** — the **Windows release** section near the bottom (build →
  zip the *whole* `Release` folder, not just the `.exe` → upload)

Both end up at `https://pub-16c29a592e56470b9f52d21fec59f97b.r2.dev/releases/<filename>`.
Keep those two final URLs handy for Step 5.

---

## Step 5 — Create the new Cloudflare Pages project

**Workers & Pages → Create → Pages → Connect to Git → select
`genxyz-lab-website`.**

Build settings:

| Field | Value |
|---|---|
| Production branch | `main` |
| Root directory | `website` |
| Build command | `npm run build` |
| Build output directory | `dist` |

Then **Settings → Environment variables** — add `NODE_VERSION=20`, plus all
the production variables. Copy the Firebase block unchanged from your old
project; the two download URLs are whatever Step 4 produced:

```text
NODE_VERSION=20

VITE_FIREBASE_API_KEY=AIzaSyDjaBKz3lkmzAABjOX218OCTsshs2y9Y1o
VITE_FIREBASE_AUTH_DOMAIN=qc-scholar-689f8.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://qc-scholar-689f8-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=qc-scholar-689f8
VITE_FIREBASE_STORAGE_BUCKET=qc-scholar-689f8.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=132579407931
VITE_FIREBASE_APP_ID=1:132579407931:web:be63f944084ff9bbeec41e

VITE_APK_DOWNLOAD_URL=<the APK URL from Step 4>
VITE_APK_SIZE=<its size, e.g. 41.7 MB>
VITE_WINDOWS_DOWNLOAD_URL=<the Windows zip URL from Step 4>
VITE_WINDOWS_SIZE=<its size, e.g. 118 MB>
VITE_APP_VERSION=1.1.1
VITE_RELEASE_DATE=2026-08-14

VITE_SITE_URL=https://genxyz-lab-website.pages.dev
```

`VITE_SITE_URL` drives the canonical link, the Open Graph image, `robots.txt`,
and `sitemap.xml` — set it to whatever `*.pages.dev` URL this new project
actually gets (Cloudflare shows it once the project is created; it should
match the project name).

If a release isn't uploaded yet, leave that platform's URL on the
`downloads.example.com` placeholder from `.env.example` — the site reads that
as "not published" and shows *Coming soon* instead of a dead link, rather than
leaving the variable blank.

Save, then **Deployments → Retry deployment** if the first build ran before
all variables were in place.

---

## Step 6 — Authorize the new domain in Firebase

**Firebase Console → Authentication → Settings → Authorized domains → Add:**

```text
genxyz-lab-website.pages.dev
```

(Or whatever the actual `*.pages.dev` address turns out to be — use the real
one Cloudflare assigned.) Skipping this silently breaks the community section
and the download counter — anonymous auth rejects requests from an
unrecognized origin.

---

## Step 7 — Verify

Open the new `*.pages.dev` URL and check:

- Hero 3D scene renders and responds to hovering (desktop, wide viewport)
- **Download** opens the dialog with working Android and Windows tabs
- Scroll past the hero — every section is visible, all the way to the footer
- `/robots.txt` and `/sitemap.xml` show the new pages.dev origin
- `/privacy.html` loads

---

## Later, if you ever do want a custom domain

Nothing above blocks it — a custom domain attaches to whichever Pages project
you're using at the time, same either way. Buy it, add it under **this**
project's **Custom domains** tab, update `VITE_SITE_URL` one more time. It's
the search-ranking upgrade over `*.pages.dev`, but it isn't required for any
of the above to work.

---

## Monetization — unchanged from before

Every ad network has a traffic floor a brand-new project has by definition:
AdSense wants a real content library, EthicalAds and Carbon Ads both want
50,000+ monthly pageviews. None of that changes with a new repo or a new
Pages project. A donation link (GitHub Sponsors / Ko-fi) in the footer is
still the one thing with zero barrier — say the word and I'll add it.

---

## Checklist

- [ ] New repo created, URL shared
- [ ] Code pushed (46 files, one commit)
- [ ] APK and Windows zip uploaded to R2
- [ ] New Cloudflare Pages project created and building
- [ ] All env vars set, including the two release URLs
- [ ] New `*.pages.dev` domain authorized in Firebase
- [ ] Hero, download dialog, and every section verified live
