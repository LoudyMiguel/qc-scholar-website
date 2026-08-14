# GenXYZ Lab website — deployment & launch guide

Everything in this file is an action **you** need to take. The code side is
done and building clean; these are the account, DNS, and dashboard steps that
cannot be done from the repository.

**You already have a live Cloudflare Pages project — `qc-scholar-website`.**
Once a custom domain is attached, visitors never see that `*.pages.dev` name,
so there is no need to create a second project. Push this code to the same
project, buy the domain, point it there. That's the whole shape of it.

Ordered by dependency. Steps 1–2 are local checks. Steps 3–5 get the current
code live and reachable at your own domain. Step 6 is search visibility.
Step 7 is the monetization question. Step 8 is the Windows release, whenever
you're ready for it.

---

## Step 1 — Deploy the new Firebase database rules (5 minutes, optional)

The site now records a per-platform download breakdown at
`stats/platform_downloads/{android|windows}`. The existing rules reject that
path, so it needs a deploy to actually record it.

```bash
cd "C:\flutter project\quizy\website"
npm install --global firebase-tools
firebase login
firebase use --add          # pick the qc-scholar-689f8 project
firebase deploy --only database
```

**Safe to skip or delay.** The per-platform increment is deliberately
best-effort and never rethrows — on the old rules, downloads keep working and
only the breakdown stays empty. Nothing else depends on this.

---

## Step 2 — Build and click through locally (2 minutes)

```bash
cd "C:\flutter project\quizy\website"
npm install
npm run check      # lint, then build — catches broken references, not just syntax errors
npm run preview    # open the printed URL and click through
```

Check specifically:

- The hero renders the 3D scene on a window wider than 768 px, and responds to
  hovering over the hero.
- Narrow the window below 768 px and reload — CSS orbit fallback, no `three`
  chunk in the Network tab.
- **Download** opens the dialog with Android/Windows tabs; Windows shows
  *Coming soon*.
- Scroll past the hero — every section below it should be visible. (This used
  to silently fail; `npm run check` now catches the class of bug that caused
  it before it ever reaches a browser.)

---

## Step 3 — Push to the existing Cloudflare Pages project

No new project. Commit and push to whatever branch `qc-scholar-website` is
already tracking (check **Workers & Pages → qc-scholar-website → Settings →
Builds → Production branch** if you're not sure which one). Cloudflare builds
and deploys automatically on push.

Confirm the build settings still match — they shouldn't have changed, but
worth a glance under **Settings → Builds**:

| Field | Value |
|---|---|
| Root directory | `website` |
| Build command | `npm run build` |
| Build output directory | `dist` |

---

## Step 4 — Set the new environment variables

**qc-scholar-website → Settings → Variables and Secrets → Production.** Your
existing Firebase and APK variables are already there and stay as-is. Add
these four:

```text
VITE_SITE_URL=https://qc-scholar-website.pages.dev
VITE_WINDOWS_DOWNLOAD_URL=https://downloads.example.com/genxyz-lab-latest-windows.zip
VITE_WINDOWS_SIZE=~120 MB
```

Notes:

- **`VITE_SITE_URL` drives the canonical link, the Open Graph image URL,
  `robots.txt`, and `sitemap.xml`.** Set it to the pages.dev URL for now — you
  will change it once in Step 5b, to your real domain, and that's the only
  edit needed there.
- Leave `VITE_WINDOWS_DOWNLOAD_URL` on `downloads.example.com` until you've
  actually uploaded a Windows build. That hostname is the site's signal for
  "not published yet" — Windows renders as *Coming soon* with a disabled
  button instead of a dead link.
- Enter name and value in separate fields. No `NAME=value` in the name box, no
  quotation marks around values.

**Deployments → Retry deployment** afterward — Vite reads these at build
time, so a variable change alone needs a fresh build even without a new push.

Then, regardless of the domain step below:

**Firebase Console → Authentication → Settings → Authorized domains → Add:**
```text
qc-scholar-website.pages.dev
```
Anonymous auth rejects unknown origins, which would silently break the
community section and the download counter.

---

## Step 5 — Buy and connect your domain

### 5a. Choose and buy

Aim for an exact brand match. Check availability in this order:

```text
genxyzlab.com        ← best: exact brand, .com
genxyzlab.app         credible for software, HTTPS enforced
genxyzlab.dev          credible for developer tools, HTTPS enforced
genxyz-lab.com        fall back only if the unhyphenated one is taken
```

Buy from **Cloudflare Registrar** if possible — wholesale price, no
markup, no first-year-cheap/renewal-expensive trick, and the DNS is already
where you need it. Namecheap or Porkbun are fine alternatives.

Avoid `.xyz` despite the brand fit — it carries a spam reputation that costs
click-through even when you rank.

### 5b. Connect it

1. If bought elsewhere, add the domain as a **site** in Cloudflare and point
   the registrar's nameservers at the two Cloudflare gives you. Wait for
   "Active" (minutes to 24 hours).
2. **Workers & Pages → qc-scholar-website → Custom domains → Set up a custom
   domain.** Add both the apex (`genxyzlab.com`) and `www`. Cloudflare creates
   the DNS records and issues the certificate automatically.
3. Pick one as canonical — apex is recommended — and add a **Redirect Rule**
   sending the other to it. Serving both without a redirect splits your search
   ranking across two URLs.
4. Back in **Settings → Variables and Secrets**, update:
   ```text
   VITE_SITE_URL=https://genxyzlab.com
   ```
   and in **Firebase → Authentication → Authorized domains**, add
   `genxyzlab.com`. Redeploy.

Confirm afterward that `https://genxyzlab.com/sitemap.xml` and `/robots.txt`
both show the new origin — they're generated from `VITE_SITE_URL` at build
time, so a stale value shows up there first.

The `qc-scholar-website.pages.dev` address keeps working the whole time and
after — Cloudflare doesn't retire it when you attach a custom domain, it just
stops being the address you hand out.

---

## Step 6 — Get indexed by search engines

The site ships a canonical link, Open Graph and Twitter card tags, a
`SoftwareApplication` JSON-LD block (with the course/tool/framework counts),
a generated `sitemap.xml`, and a `robots.txt`. None of that gets you indexed
on its own — you still have to submit.

1. **[Google Search Console](https://search.google.com/search-console)** → Add
   property → Domain → `genxyzlab.com`. Verify with the DNS TXT record (in
   Cloudflare DNS). Then **Sitemaps → Add** `https://genxyzlab.com/sitemap.xml`
   and use **URL Inspection → Request indexing** on the homepage.
2. **[Bing Webmaster Tools](https://www.bing.com/webmasters)** → import
   directly from Search Console. Also feeds DuckDuckGo and ChatGPT search.
3. Validate the link preview with the
   [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   and by pasting the URL into Slack or Discord — you should see the generated
   1200×630 card with the course/tool numbers on it.
4. Test structured data with the
   [Rich Results Test](https://search.google.com/test/rich-results).

Realistic expectation: indexing takes days to a few weeks. Ranking for
competitive terms is a content problem, not a technical one — see Step 7.

---

## Step 7 — Monetization: ads before you buy the domain?

**No. Every ad network I checked has a traffic floor, and a domain you haven't
bought yet has zero traffic. This isn't an AdSense-specific problem — I
re-checked the alternatives too, and they gate on the same thing.**

| Network | Requirement | Fits today? |
|---|---|---|
| Google AdSense | ~20–30 substantial articles (2026 policy); a landing page is an instant "Low value content" rejection | No |
| EthicalAds | 50,000+ monthly pageviews | No |
| Carbon Ads | ~50,000 monthly pageviews guideline, manual review | No |

Every option needs an audience that doesn't exist yet on a domain that
doesn't exist yet. Wiring up ad code now would ship non-functional
placeholders — no network would approve the account behind them — while also
adding third-party scripts and loosening the CSP on a brand-new domain during
the exact window when a clean, fast, script-light site helps it get indexed
and trusted fastest. That's a real cost for zero return.

**There's also a product-fit problem underneath the traffic problem, which is
worth knowing before you build toward ads at all:** your entire funnel here is
one download button. Display ads next to a free APK are the strongest trust
signal that the download might not be safe — the exact worry an unsigned
Windows build already has to overcome (see Step 8). Ads on this specific page
would work against your own conversion goal even once you had the traffic.

### What actually gives you ROI now

1. **Donations (do this today — 30 minutes, zero barrier).** The footer
   already reads "Built independently with care and learner feedback" — add a
   **GitHub Sponsors**, **Ko-fi**, or **Buy Me a Coffee** link next to it. No
   approval process, no CSP change beyond one outbound link, no traffic
   minimum. Say the word and I'll wire the link in.
2. **Affiliate links, scoped narrowly.** The app has a real Arduino Studio —
   Arduino kits and microcontroller boards are an honest recommendation, not
   filler. Amazon Associates has no traffic minimum either. Belongs on a
   future "recommended hardware" page, not the landing page.
3. **Content, which is also what gets you to the ad traffic floor.** Tutorials
   people actually search for — "compile C on Android with Termux", "run
   Flask on your phone" — build search traffic *and* are the only realistic
   path to 50k monthly pageviews. Ads become viable as a side effect of this,
   never as a starting point.
4. **Paid tiers inside the app**, not the site — certificate verification for
   institutions, premium course packs. Normal for an education product, and
   doesn't touch the site's CSP or trust posture at all.

**My recommendation:** ship the donation link this week, buy the domain, get
indexed, then revisit ads only once traffic numbers make a network's approval
realistic. Building the ad infrastructure earlier than that produces code with
nothing to plug into.

---

## Step 8 — Publish the Windows build (when ready)

Full instructions in [`RELEASE_RUNBOOK.md`](RELEASE_RUNBOOK.md) under
**Windows release**. In brief:

```powershell
cd "C:\flutter project\quizy"
flutter build windows --release
Compress-Archive -Path "build\windows\x64\runner\Release\*" `
  -DestinationPath "build\genxyz-lab-v1.1.1-windows.zip" -Force
```

Upload to R2, set `VITE_WINDOWS_DOWNLOAD_URL` and `VITE_WINDOWS_SIZE`,
redeploy. The site flips Windows from *Coming soon* to live automatically.

Two things to know:

- Zip the **whole `Release` folder**, not just the `.exe` — it won't start
  without the DLLs and `data\` directory beside it.
- The build is unsigned; SmartScreen warns on first run. The download dialog
  already tells users *More info → Run anyway*. Removing the warning needs a
  paid code-signing certificate — a commercial decision, not a blocker.

---

## Post-launch checklist

- [ ] Latest code pushed and deployed on `qc-scholar-website`
- [ ] New Firebase rules deployed (optional); a test download increments both counters
- [ ] Custom domain resolves over HTTPS, with www redirecting to apex
- [ ] `VITE_SITE_URL` updated and `/sitemap.xml` shows the real domain
- [ ] Custom domain added to Firebase authorized domains
- [ ] Sitemap submitted to Google Search Console and Bing
- [ ] Link preview card renders correctly in Slack or Discord
- [ ] Donation link added to the footer

---

## Sources

- Google AdSense 2026 content requirements —
  [AdSense approval requirements 2026](https://innopanda.com/google-adsense-in-2026/),
  [AdSense approval guide 2026](https://zeroclickgrowth.com/google-adsense-approval-guide-2026/)
- EthicalAds 50k+ monthly pageview publisher guideline —
  [EthicalAds Publisher's Guide](https://www.ethicalads.io/publisher-guide/)
- Carbon Ads traffic guideline and manual review —
  [Carbon Ads FAQ](https://www.carbonads.net/faq)
