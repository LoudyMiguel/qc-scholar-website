/**
 * One-shot asset pipeline: reads the full-resolution originals in
 * `assets-source/` and writes web-sized derivatives into `public/assets/`.
 *
 * Why this exists: the originals are 1.4-1.9 MB each and were being served
 * verbatim. `app_ic.png` in particular was a 1254x1254 / 1.45 MB file used as
 * the favicon and as a 40 px header logo — every visitor paid for it before the
 * page could paint. Sources now live outside `public/` so they are never
 * copied into the bundle, and this script is the only thing that produces what
 * ships.
 *
 * Run with: npm run assets
 */
import { access, mkdir, readdir, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = join(root, 'assets-source')
const OUT = join(root, 'public', 'assets')

// The app icon's real home is the Flutter project, and this website is a
// separate git repo that used to keep its own copy. That copy silently went
// stale through an entire rebrand: the app moved to the GenXYZ "G" mark while
// the site kept shipping the old QC Scholar "Q" everywhere, including the
// social card. So prefer the live app icon and treat the local file as a
// fallback for when the website repo is checked out on its own.
const APP_ICON_CANDIDATES = [
  resolve(root, '..', 'assets', 'images', 'app_ic.png'),
  join(SOURCE, 'app_ic.png'),
]

async function resolveAppIcon() {
  for (const candidate of APP_ICON_CANDIDATES) {
    try {
      await access(candidate)
      return candidate
    } catch {
      // Try the next candidate.
    }
  }
  throw new Error(
    `No app icon found. Looked in:\n  ${APP_ICON_CANDIDATES.join('\n  ')}`,
  )
}

/**
 * The source icon is a fully opaque square whose rounded corners are PAINTED
 * BLACK rather than left transparent. Dropped onto the site's dark panels that
 * reads as a black square halo around the mark, so the corners are cut to real
 * transparency at the icon's own radius — measured from the artwork rather than
 * guessed, so nothing of the mark is clipped.
 */
async function measureCornerRadiusRatio(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const luminanceAt = (x, y) => {
    const i = (y * info.width + x) * info.channels
    return data[i] + data[i + 1] + data[i + 2]
  }

  // On the top row a rounded rect is empty until x reaches the corner radius.
  for (let x = 0; x < info.width; x += 1) {
    if (luminanceAt(x, 0) > 30) return x / info.width
  }
  // A square icon with no rounding at all: nothing to cut.
  return 0
}

function roundedMask(size, radius) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
       <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/>
     </svg>`,
  )
}

async function roundedIcon(file, size, radiusRatio) {
  const pipeline = sharp(file).resize(size, size, { fit: 'cover' })
  if (radiusRatio > 0) {
    pipeline.composite([
      { input: roundedMask(size, Math.round(size * radiusRatio)), blend: 'dest-in' },
    ])
  }
  return pipeline.png({ compressionLevel: 9 }).toBuffer()
}

const BRAND = {
  ink: '#020617',
  panel: '#0b1120',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  cyan: '#22d3ee',
  text: '#f8fafc',
  muted: '#94a3b8',
}

async function icons(source, radiusRatio) {
  // 256 is the largest size the mark is ever displayed at (the OG cover
  // composites its own copy), so anything bigger is pure waste.
  // Palette quantisation keeps these two small. The mark is a smooth gradient
  // behind a flat white glyph, so 128 colours is indistinguishable at 256 px
  // and roughly a fifth of the truecolour size.
  await sharp(await roundedIcon(source, 256, radiusRatio))
    .png({ compressionLevel: 9, palette: true, colours: 128 })
    .toFile(join(OUT, 'logo.png'))

  await sharp(await roundedIcon(source, 48, radiusRatio))
    .png({ compressionLevel: 9, palette: true, colours: 96 })
    .toFile(join(OUT, 'favicon.png'))

  // Apple wants exactly 180x180 and applies its OWN superellipse mask at about
  // 22% radius — comfortably more than this icon's ~10%, so it already removes
  // the black corners. Masking here as well would only cut into artwork Apple
  // was going to keep, so this one ships as the full-bleed square.
  await sharp(source)
    .resize(180, 180, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(join(OUT, 'apple-touch-icon.png'))
}

/**
 * Social preview card. Built as an SVG so the layout is declarative, then
 * rasterised — link unfurlers (Slack, Discord, iMessage, X) do not render SVG,
 * so this must ship as a PNG at exactly 1200x630.
 */
async function ogCover(source, radiusRatio) {
  const logo = await roundedIcon(source, 148, radiusRatio)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BRAND.panel}"/>
      <stop offset="100%" stop-color="${BRAND.ink}"/>
    </linearGradient>
    <radialGradient id="glowA" cx="0.78" cy="0.24" r="0.55">
      <stop offset="0%" stop-color="${BRAND.indigo}" stop-opacity="0.42"/>
      <stop offset="100%" stop-color="${BRAND.indigo}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowB" cx="0.22" cy="0.88" r="0.5">
      <stop offset="0%" stop-color="${BRAND.cyan}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="${BRAND.cyan}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${BRAND.indigo}"/>
      <stop offset="55%" stop-color="${BRAND.violet}"/>
      <stop offset="100%" stop-color="${BRAND.cyan}"/>
    </linearGradient>
    <pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse">
      <path d="M56 0H0V56" fill="none" stroke="#64748b" stroke-opacity="0.08" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="url(#sky)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#glowA)"/>
  <rect width="1200" height="630" fill="url(#glowB)"/>

  <!-- Orbit motif, echoing the site's WebGL hero -->
  <g transform="translate(940 315)" fill="none" stroke-width="1.5">
    <ellipse rx="196" ry="74" stroke="${BRAND.indigo}" stroke-opacity="0.34" transform="rotate(-24)"/>
    <ellipse rx="248" ry="94" stroke="${BRAND.violet}" stroke-opacity="0.26" transform="rotate(18)"/>
    <ellipse rx="300" ry="112" stroke="${BRAND.cyan}" stroke-opacity="0.18" transform="rotate(-52)"/>
    <circle r="6" cx="182" cy="-52" fill="${BRAND.cyan}" stroke="none" opacity="0.9"/>
    <circle r="5" cx="-210" cy="62" fill="${BRAND.violet}" stroke="none" opacity="0.8"/>
    <circle r="4" cx="96" cy="104" fill="${BRAND.indigo}" stroke="none" opacity="0.75"/>
  </g>

  <rect x="86" y="214" width="54" height="3" rx="1.5" fill="url(#accent)"/>

  <text x="86" y="300" font-family="Segoe UI, Helvetica Neue, Arial, sans-serif"
        font-size="66" font-weight="700" fill="${BRAND.text}" letter-spacing="-2.4">GenXYZ Lab</text>
  <text x="86" y="358" font-family="Segoe UI, Helvetica Neue, Arial, sans-serif"
        font-size="32" font-weight="600" fill="#c7d2fe" letter-spacing="-0.6">Learn. Practice. Build. Get certified.</text>

  <!-- The numbers are the strongest thing this card can say. A shared link is
       often the only impression someone gets, so it leads with substance
       rather than repeating the tagline in smaller type. -->
  <g font-family="Segoe UI, Helvetica Neue, Arial, sans-serif">
    <text x="86" y="418" font-size="25" font-weight="700" fill="${BRAND.text}">50+ free offline courses</text>
    <text x="86" y="454" font-size="21" font-weight="400" fill="${BRAND.muted}">7 developer tools · 20+ frameworks · 30+ games · 20+ templates</text>
  </g>

  <g font-family="Consolas, Menlo, monospace" font-size="18" font-weight="700" letter-spacing="2.4">
    <rect x="86" y="500" width="150" height="42" rx="21" fill="#6366f1" fill-opacity="0.14" stroke="${BRAND.indigo}" stroke-opacity="0.4"/>
    <text x="112" y="527" fill="#a5b4fc">ANDROID</text>
    <rect x="250" y="500" width="150" height="42" rx="21" fill="#22d3ee" fill-opacity="0.12" stroke="${BRAND.cyan}" stroke-opacity="0.36"/>
    <text x="276" y="527" fill="#67e8f9">WINDOWS</text>
    <rect x="414" y="500" width="96" height="42" rx="21" fill="#34d399" fill-opacity="0.12" stroke="#34d399" stroke-opacity="0.36"/>
    <text x="446" y="527" fill="#6ee7b7">FREE</text>
  </g>
</svg>`

  await sharp(Buffer.from(svg))
    .composite([{ input: logo, top: 52, left: 86 }])
    .png({ compressionLevel: 9 })
    .toFile(join(OUT, 'og-cover.png'))
}

async function artwork() {
  const jobs = [
    // Rendered at most ~700 CSS px wide inside the showcase frame; 1200 covers
    // a 2x display with room to spare.
    { file: 'feature-lab.webp', width: 1200, quality: 76 },
    // A 30%-opacity decorative backdrop. It never needs to be sharp, and it is
    // the single heaviest asset on the page.
    { file: 'community-constellation.webp', width: 1600, quality: 68 },
  ]

  for (const job of jobs) {
    const source = join(SOURCE, job.file)
    try {
      await stat(source)
    } catch {
      console.warn(`  skipped ${job.file} (no source)`)
      continue
    }
    await sharp(source)
      .resize({ width: job.width, withoutEnlargement: true })
      .webp({ quality: job.quality, effort: 6 })
      .toFile(join(OUT, job.file))
  }
}

async function report() {
  const files = await readdir(OUT)
  const rows = []
  for (const file of files.sort()) {
    const info = await stat(join(OUT, file))
    if (info.isFile()) rows.push(`  ${file.padEnd(30)} ${(info.size / 1024).toFixed(1)} kB`)
  }
  console.log(rows.join('\n'))
}

await mkdir(OUT, { recursive: true })

const appIcon = await resolveAppIcon()
const radiusRatio = await measureCornerRadiusRatio(appIcon)
console.log(`App icon: ${appIcon}`)
console.log(`Corner radius: ${(radiusRatio * 100).toFixed(1)}% of width`)

console.log('Generating icons…')
await icons(appIcon, radiusRatio)
console.log('Generating social cover…')
await ogCover(appIcon, radiusRatio)
console.log('Optimising artwork…')
await artwork()
console.log('\npublic/assets:')
await report()
