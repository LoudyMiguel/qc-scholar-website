# assets-source

Full-resolution originals. **Nothing in this folder is ever served.** It sits
outside `public/`, so Vite never copies it into `dist/`.

`npm run assets` reads from here and writes web-sized derivatives into
`public/assets/`. Those generated files are what ship, and they are committed.

## What is here, and why it cannot be deleted

| File | Why it must stay |
|---|---|
| `feature-lab.webp` | 1448×1086 original. `public/assets/` only has the 1200 px, quality-76 derivative — re-encoding from that would compound compression artifacts, and this artwork cannot be regenerated identically. |
| `community-constellation.webp` | Same, at 1915×821. |
| `IMAGE_PROMPTS.md` | The generation prompts for both images above, for producing replacements. |

## What is deliberately NOT here

**The app icon.** `scripts/optimize-assets.mjs` reads it straight from the
Flutter project:

```text
../assets/images/app_ic.png
```

There used to be a copy in this folder, and it silently went stale through an
entire rebrand — the app moved to the GenXYZ "G" mark while the website kept
generating its favicon, header logo, and social card from the old QC Scholar
"Q". One source of truth prevents that recurring.

The script falls back to `assets-source/app_ic.png` if the Flutter project is
not alongside (this website is its own git repo, so it can be checked out
alone). Add that fallback copy only if you actually hit that case, and expect
to keep it in sync by hand if you do.

## Regenerating

```bash
npm run assets
```

It prints which icon source it used and the corner radius it measured, then
lists every output with its size. Re-run it after changing the app icon or
replacing either artwork file.
