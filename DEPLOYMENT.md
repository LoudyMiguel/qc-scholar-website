# GenXYZ Lab website — deployment & launch guide

Everything in this file is an action **you** need to take. The code side is
done, committed, **and already pushed** to your existing repo.

## The final shape of the plan

Two things are completely independent, and it's worth being explicit about
that since it wasn't obvious from the Cloudflare dashboard alone:

- **The domain** (what visitors type) attaches to whichever Cloudflare Pages
  **project** you choose. It has no relationship to which GitHub repo feeds
  that project.
- **The GitHub repo** (where your code lives) is a separate, permanent
  connection a Pages project has to exactly one repo — Cloudflare has no
  "change repository" option once a project exists
  ([confirmed here](https://community.cloudflare.com/t/how-to-change-repo-connected-to-page/332796)).

Given that, the simplest path — and the one this guide now follows — keeps
**both** as they already are: same repo (`github.com/LoudyMiguel/
qc-scholar-website`), same Cloudflare Pages project (`qc-scholar-website`).
You buy a domain and attach it to that existing project. Nothing about
GitHub changes; you keep committing and pushing to the same repo forever,
exactly like today. The internal names `qc-scholar-website` /
`qc-scholar-689f8` stay as backend plumbing no visitor ever sees — the same
way they already do.

*(An earlier draft of this guide proposed a brand-new repo + a brand-new
Pages project, for the case where you wanted a separately-branded repo
identity. That's still possible later if you ever want it — see the note at
the very bottom — but it's not what's happening here.)*

---

## Already done

- ✅ All 46 files committed (3D hero, Windows downloads, product data, image
  pipeline, ESLint, everything from this session)
- ✅ Pushed to `origin/main` — commit `1829092`
- ✅ Cloudflare Pages should be building this right now if `main` is its
  tracked production branch. Check **Workers & Pages → qc-scholar-website →
  Deployments** — you should see a new build in progress or completed.

If that deployment succeeded, `qc-scholar-website.pages.dev` already shows
the rebranded site. Everything below is about attaching your own domain on
top of that.

---

## Step 1 — Buy the domain ✅ done

**Bought: `genxyzlab.org`.** Good choice — no SEO penalty for the TLD, and
`.org` fits the product's real open-source footprint (30+ games, 20+ system
templates, free courses) rather than reading as a mismatch.

If it was bought through Cloudflare Registrar, skip to Step 2 — DNS is
already where it needs to be. If bought elsewhere (Namecheap, Porkbun, etc.):

1. **Cloudflare dashboard → Add a site → `genxyzlab.org`.**
2. Cloudflare shows two nameservers (something like `xxx.ns.cloudflare.com`).
   Go to your registrar's DNS/nameserver settings and replace whatever is
   there with those two.
3. Wait for Cloudflare to show the site as **Active** — usually minutes, can
   take up to 24 hours while the change propagates.

---

## Step 2 — Attach it to the existing project

**Workers & Pages → qc-scholar-website → Custom domains → Set up a custom
domain.** Add both the apex (`genxyzlab.org`) and `www`. Cloudflare creates
the DNS records and issues the certificate automatically — typically minutes.

Pick one as canonical (apex is recommended) and add a **Redirect Rule**
sending the other to it, or search engines split your ranking across two
URLs for the same content.

---

## Step 3 — Point the site's own metadata at the new domain

**Settings → Variables and Secrets → Production**, update:

```text
VITE_SITE_URL=https://genxyzlab.org
```

This one variable drives the canonical link, the Open Graph image URL,
`robots.txt`, and `sitemap.xml` — all generated at build time. Then
**Deployments → Retry deployment** (Vite only reads env vars at build time,
so a variable change alone needs a fresh build).

Confirm afterward that `https://genxyzlab.org/sitemap.xml` and `/robots.txt`
both show the new domain, not the old pages.dev one.

---

## Step 4 — Authorize the domain in Firebase

**Firebase Console → Authentication → Settings → Authorized domains → Add:**

```text
genxyzlab.org
```

Skipping this silently breaks the community section and the download
counter — anonymous auth rejects requests from an unrecognized origin. The
`qc-scholar-website.pages.dev` domain should already be authorized from
before; leave it in the list, it keeps working as a fallback address.

---

## Step 5 — Get indexed

The site ships a canonical link, Open Graph and Twitter card tags, a
`SoftwareApplication` JSON-LD block (with the course/tool/framework counts),
a generated `sitemap.xml`, and `robots.txt`. None of that gets you indexed by
itself — you still submit.

1. **[Google Search Console](https://search.google.com/search-console)** →
   Add property → Domain → `genxyzlab.org`. Verify with the DNS TXT record
   (Cloudflare DNS). **Sitemaps → Add** `https://genxyzlab.org/sitemap.xml`,
   then **URL Inspection → Request indexing** on the homepage.
2. **[Bing Webmaster Tools](https://www.bing.com/webmasters)** → import
   directly from Search Console. Also feeds DuckDuckGo and ChatGPT search.
3. Validate the share preview with the
   [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   or by pasting the link into Slack/Discord — you should see the generated
   1200×630 card with the course/tool numbers on it.
4. Test structured data with the
   [Rich Results Test](https://search.google.com/test/rich-results).

Indexing takes days to a few weeks. Ranking for competitive terms is a
content problem, not a technical one.

---

## Two things this repo can't do for you

**The APK and Windows zip.** Upload both files to Google Drive, share them as
**Anyone with the link**, and set `VITE_APK_GOOGLE_DRIVE_URL` and
`VITE_WINDOWS_GOOGLE_DRIVE_URL` (plus their `*_SIZE` companions) in the same
Variables screen as Step 3. [`RELEASE_RUNBOOK.md`](RELEASE_RUNBOOK.md) has the
complete release procedure. A missing or non-Drive URL shows as *Coming soon*
rather than opening a stale download host.

**Ads.** Every network has a traffic floor a new domain doesn't have yet —
AdSense wants a real content library, EthicalAds and Carbon Ads both want
50,000+ monthly pageviews. A donation link (GitHub Sponsors / Ko-fi) in the
footer is the one option with zero barrier; say the word and I'll add it.

---

## If you ever DO want a separately-branded repo

Not needed for anything above, but for the record: a repo literally named
`genxyz-lab-website` (rather than the current `qc-scholar-website`) would
need its own new Cloudflare Pages project too, per the repo-swap limitation
at the top. That project would get its own `*.pages.dev` address, which you
could then attach this same domain to instead — moving a custom domain
between projects is supported, unlike moving a repo between them. Not
something to do today; just noting the door isn't closed.

---

## Checklist

- [x] Code committed and pushed to `origin/main`
- [ ] Cloudflare Pages build succeeded on the new push
- [x] Domain purchased — `genxyzlab.org`
- [ ] Domain attached to `qc-scholar-website` project, both apex and www
- [ ] `VITE_SITE_URL` updated, redeployed, sitemap/robots confirmed
- [ ] Domain authorized in Firebase
- [ ] Sitemap submitted to Search Console and Bing
- [ ] APK and Windows zip uploaded to Google Drive and publicly shared
