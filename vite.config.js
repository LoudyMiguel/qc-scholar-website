import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * robots.txt and sitemap.xml both have to carry the absolute production origin,
 * and anything in `public/` is copied byte-for-byte with no env substitution.
 * Generating them at build time keeps the domain defined in exactly one place
 * (VITE_SITE_URL) instead of hardcoded in two files that quietly go stale the
 * day a custom domain is bought.
 */
function seoFiles(siteUrl) {
  const origin = siteUrl.replace(/\/+$/, '')
  const today = new Date().toISOString().slice(0, 10)

  return {
    name: 'genxyz-seo-files',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: [
          'User-agent: *',
          'Allow: /',
          '',
          `Sitemap: ${origin}/sitemap.xml`,
          '',
        ].join('\n'),
      })

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${origin}/privacy.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
`,
      })
    },
  }
}

function readGoogleDriveUrl(value) {
  if (!value) return ''

  try {
    const normalizedValue = value.trim()
    const parsedUrl = new URL(normalizedValue)
    const hostname = parsedUrl.hostname.toLowerCase()
    return parsedUrl.protocol === 'https:' &&
      (hostname === 'drive.google.com' || hostname === 'drive.usercontent.google.com')
      ? normalizedValue
      : ''
  } catch {
    return ''
  }
}

function releaseManifest(env) {
  const metadata = JSON.parse(
    readFileSync(resolve(process.cwd(), 'release-manifest.json'), 'utf8'),
  )

  function buildEntry(platform, urlKey, sizeKey) {
    const entry = metadata[platform]
    const url = readGoogleDriveUrl(entry.url) || readGoogleDriveUrl(env[urlKey])
    return {
      ...entry,
      version: url ? entry.version || env.VITE_APP_VERSION : '0.0.0',
      url,
      size: entry.size || env[sizeKey],
      releaseDate: entry.releaseDate || env.VITE_RELEASE_DATE,
    }
  }

  return {
    name: 'genxyz-release-manifest',
    apply: 'build',
    generateBundle() {
      const manifest = {
        android: buildEntry('android', 'VITE_APK_GOOGLE_DRIVE_URL', 'VITE_APK_SIZE'),
        windows: buildEntry(
          'windows',
          'VITE_WINDOWS_GOOGLE_DRIVE_URL',
          'VITE_WINDOWS_SIZE',
        ),
      }
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: `${JSON.stringify(manifest, null, 2)}\n`,
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const siteUrl = env.VITE_SITE_URL || 'https://genxyzlab.org'

  return {
    plugins: [vue(), seoFiles(siteUrl), releaseManifest(env)],
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      // The three.js chunk is deliberately over the default 500 kB advisory: it
      // is lazy, gated behind idle + viewport + screen-size checks, and never on
      // the critical path. Raising the limit keeps a real regression visible
      // instead of burying it under a warning we always ignore.
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: {
            firebase: ['firebase/app', 'firebase/auth', 'firebase/database'],
            motion: ['gsap', 'lenis'],
            // Three.js only ever loads behind a dynamic import in LabScene.vue.
            // Naming it here keeps it out of the entry chunk on devices that
            // never render the scene (reduced motion, no WebGL, small screens).
            three: ['three'],
          },
        },
      },
    },
  }
})
