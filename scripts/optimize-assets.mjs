/**
 * One-shot asset pipeline: reads the app icon and writes the web-sized icons
 * and social card into `public/assets/`.
 *
 * Why this exists: `app_ic.png` is a 1254x1254 / 1.45 MB file. It used to be
 * served verbatim as the favicon and a 40 px header logo, so every visitor paid
 * for it before the page could paint. This script is the only thing that
 * produces what ships.
 *
 * The site's illustrations are HTML and CSS (see AppPreview.vue), so there is
 * no bitmap artwork to process here any more.
 *
 * Run with: npm run assets
 */
import { access, mkdir, readdir, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(root, 'public', 'assets')

// The app icon's real home is the Flutter project, and this website is a
// separate git repo that used to keep its own copy. That copy silently went
// stale through an entire rebrand: the app moved to the GenXYZ "G" mark while
// the site kept shipping the old QC Scholar "Q" everywhere, including the
// social card. So prefer the live app icon and treat the local file as a
// fallback for when the website repo is checked out on its own (create
// `assets-source/app_ic.png` only if you actually hit that case).
const APP_ICON_CANDIDATES = [
  resolve(root, '..', 'assets', 'images', 'app_ic.png'),
  join(root, 'assets-source', 'app_ic.png'),
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

// Mirrors the light theme tokens in src/assets/main.css so the social card
// looks like the site it links to.
const BRAND = {
  bg: '#ffffff',
  subtle: '#f8fafc',
  border: '#e2e8f0',
  fg: '#0f172a',
  muted: '#475569',
  faint: '#64748b',
  brand: '#4f46e5',
  keyword: '#7c3aed',
  string: '#047857',
  fn: '#2563eb',
  number: '#c2410c',
  success: '#047857',
}

const SANS = 'Inter, Segoe UI, Helvetica Neue, Arial, sans-serif'
const MONO = 'Consolas, Menlo, DejaVu Sans Mono, monospace'

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
 * Social preview card, laid out like the site's hero: the headline and key
 * numbers on the left, the code-editor preview on the right. Built as an SVG
 * so the layout is declarative, then rasterised — link unfurlers (Slack,
 * Discord, iMessage, X) do not render SVG, so this must ship as a PNG at
 * exactly 1200x630. The output name is versioned because link previews cache
 * images by URL; bump it (and the meta tags) whenever the design changes.
 */
export const OG_COVER_FILE = 'og-cover-v3.png'

async function ogCover(source, radiusRatio) {
  const logo = await roundedIcon(source, 64, radiusRatio)

  const code = [
    [['comment', '# Lesson 4 · Lists and functions']],
    [['keyword', 'def '], ['fn', 'average'], ['plain', '(scores):']],
    [['plain', '    '], ['keyword', 'return '], ['fn', 'sum'], ['plain', '(scores) / '], ['fn', 'len'], ['plain', '(scores)']],
    [],
    [['plain', 'grades = ['], ['number', '92'], ['plain', ', '], ['number', '85'], ['plain', ', '], ['number', '78'], ['plain', ', '], ['number', '96'], ['plain', ']']],
    [['fn', 'print'], ['plain', '(average(grades))']],
  ]
  const tokenColor = {
    comment: BRAND.faint,
    keyword: BRAND.keyword,
    fn: BRAND.fn,
    number: BRAND.number,
    plain: BRAND.fg,
  }
  const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const codeLines = code
    .map((line, index) => {
      const y = 248 + index * 30
      const spans = line
        .map(([type, text]) => `<tspan fill="${tokenColor[type]}"${type === 'comment' ? ' font-style="italic"' : ''}>${escape(text)}</tspan>`)
        .join('')
      return `<text x="712" y="${y}" font-size="16" fill="${BRAND.faint}" fill-opacity="0.6">${index + 1}</text>
    <text x="740" y="${y}" font-size="16" xml:space="preserve">${spans}</text>`
    })
    .join('\n    ')

  const stats = [
    ['70', 'offline courses'],
    ['129', 'templates'],
    ['30+', 'tools'],
  ]
  const statBlocks = stats
    .map(([value, label], index) => {
      const x = 80 + index * 180
      return `<text x="${x}" y="476" font-size="44" font-weight="700" fill="${BRAND.fg}" letter-spacing="-1">${value}</text>
    <text x="${x}" y="508" font-size="20" fill="${BRAND.faint}">${label}</text>`
    })
    .join('\n    ')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="0.9" cy="0" r="0.75">
      <stop offset="0%" stop-color="${BRAND.brand}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${BRAND.brand}" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#0f172a" flood-opacity="0.14"/>
    </filter>
  </defs>

  <rect width="1200" height="630" fill="${BRAND.bg}"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <g font-family="${SANS}">
    <text x="164" y="103" font-size="30" font-weight="700" fill="${BRAND.fg}" letter-spacing="-0.5">GenXYZ Lab</text>

    <text x="80" y="246" font-size="60" font-weight="700" fill="${BRAND.fg}" letter-spacing="-2">Learn to code.</text>
    <text x="80" y="318" font-size="60" font-weight="700" fill="${BRAND.brand}" letter-spacing="-2">Build real projects.</text>
    <text x="80" y="374" font-size="24" fill="${BRAND.muted}">Free for Android and Windows · Works offline</text>

    ${statBlocks}

    <rect x="80" y="550" width="132" height="40" rx="20" fill="${BRAND.brand}" fill-opacity="0.1"/>
    <text x="146" y="576" font-size="17" font-weight="600" fill="${BRAND.brand}" text-anchor="middle">Android</text>
    <rect x="224" y="550" width="132" height="40" rx="20" fill="${BRAND.brand}" fill-opacity="0.1"/>
    <text x="290" y="576" font-size="17" font-weight="600" fill="${BRAND.brand}" text-anchor="middle">Windows</text>
    <rect x="368" y="550" width="96" height="40" rx="20" fill="${BRAND.success}" fill-opacity="0.1"/>
    <text x="416" y="576" font-size="17" font-weight="600" fill="${BRAND.success}" text-anchor="middle">Free</text>
  </g>

  <!-- Code editor preview, as in the site's hero -->
  <g filter="url(#shadow)">
    <rect x="690" y="150" width="440" height="390" rx="16" fill="${BRAND.bg}" stroke="${BRAND.border}"/>
  </g>
  <path d="M706 150h408a16 16 0 0 1 16 16v32H690v-32a16 16 0 0 1 16-16z" fill="${BRAND.subtle}"/>
  <line x1="690" y1="198" x2="1130" y2="198" stroke="${BRAND.border}"/>
  <circle cx="716" cy="174" r="6" fill="#cbd5e1"/>
  <circle cx="736" cy="174" r="6" fill="#cbd5e1"/>
  <circle cx="756" cy="174" r="6" fill="#cbd5e1"/>
  <text x="780" y="180" font-family="${SANS}" font-size="15" font-weight="500" fill="${BRAND.faint}">main.py</text>

  <g font-family="${MONO}">
    ${codeLines}
  </g>

  <line x1="690" y1="452" x2="1130" y2="452" stroke="${BRAND.border}"/>
  <path d="M690 452h440v72a16 16 0 0 1-16 16H706a16 16 0 0 1-16-16z" fill="${BRAND.subtle}"/>
  <text x="712" y="486" font-family="${MONO}" font-size="16" fill="${BRAND.fg}">87.75</text>
  <text x="712" y="516" font-family="${MONO}" font-size="16" fill="${BRAND.success}">✓ Finished in 0.12s</text>
  <rect x="1050" y="470" width="58" height="28" rx="6" fill="${BRAND.brand}"/>
  <text x="1079" y="489" font-family="${SANS}" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">Run</text>
</svg>`

  await sharp(Buffer.from(svg))
    .composite([{ input: logo, top: 56, left: 80 }])
    .png({ compressionLevel: 9 })
    .toFile(join(OUT, OG_COVER_FILE))
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

async function main() {
  await mkdir(OUT, { recursive: true })

  const appIcon = await resolveAppIcon()
  const radiusRatio = await measureCornerRadiusRatio(appIcon)
  console.log(`App icon: ${appIcon}`)
  console.log(`Corner radius: ${(radiusRatio * 100).toFixed(1)}% of width`)

  console.log('Generating icons…')
  await icons(appIcon, radiusRatio)
  console.log('Generating social cover…')
  await ogCover(appIcon, radiusRatio)
  console.log('\npublic/assets:')
  await report()
}

export { icons, measureCornerRadiusRatio, ogCover }

// `npm run assets` runs everything; importing this file runs nothing, so a
// single output can be regenerated on its own.
// (`node -e` has no script path, so process.argv[1] is undefined there.)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
