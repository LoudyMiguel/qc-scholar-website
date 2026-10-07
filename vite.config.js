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
    <loc>${origin}/privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${origin}/docs/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
`,
      })
    },
  }
}

/**
 * Fills the SEO placeholders in every HTML entry from one source each:
 * `%SITE_URL%` from VITE_SITE_URL (default: the production origin), and the
 * release fields from release-manifest.json. Vite's own `%VITE_*%` syntax
 * left the literal placeholder in the page whenever a deployment lacked the
 * variable (preview builds shipped `href="%VITE_SITE_URL%/"` as canonical),
 * and a stale VITE_APP_VERSION told search engines the app was 2.1.0 after
 * 3.0.0 shipped.
 */
function htmlMetadata(siteUrl) {
  const manifest = JSON.parse(
    readFileSync(resolve(process.cwd(), 'release-manifest.json'), 'utf8'),
  )
  const release = manifest.android || {}
  const values = {
    '%SITE_URL%': siteUrl.replace(/\/+$/, ''),
    '%RELEASE_VERSION%': release.version || '',
    '%RELEASE_DATE%': release.releaseDate || '',
    '%RELEASE_NOTES_URL%': release.releaseNotesUrl || '',
  }

  return {
    name: 'genxyz-html-metadata',
    transformIndexHtml(html) {
      return Object.entries(values).reduce(
        (output, [placeholder, value]) => output.replaceAll(placeholder, value),
        html,
      )
    },
  }
}

const downloadPaths = {
  android: '/latest.apk',
  windows: '/latest-windows.zip',
}

function readOfficialDownloadUrl(value, platform) {
  if (!value) return ''

  try {
    const normalizedValue = value.trim()
    const parsedUrl = new URL(normalizedValue)
    return parsedUrl.protocol === 'https:' &&
      parsedUrl.hostname.toLowerCase() === 'downloads.genxyzlab.org' &&
      parsedUrl.pathname === downloadPaths[platform] &&
      !parsedUrl.search &&
      !parsedUrl.hash
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
    const url =
      readOfficialDownloadUrl(entry.url, platform) ||
      readOfficialDownloadUrl(env[urlKey], platform)
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
        android: buildEntry('android', 'VITE_APK_DOWNLOAD_URL', 'VITE_APK_SIZE'),
        windows: buildEntry(
          'windows',
          'VITE_WINDOWS_DOWNLOAD_URL',
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

export default defineConfig(({ mode, isSsrBuild }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const siteUrl = env.VITE_SITE_URL || 'https://genxyzlab.org'

  // `vite build --ssr src/entry-server.js` compiles the pages for the Node
  // prerender step only; it needs none of the browser bundle's entries,
  // chunking, or generated SEO files.
  if (isSsrBuild) {
    return { plugins: [vue()] }
  }

  return {
    plugins: [vue(), htmlMetadata(siteUrl), seoFiles(siteUrl), releaseManifest(env)],
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      rollupOptions: {
        input: {
          main: resolve(process.cwd(), 'index.html'),
          docs: resolve(process.cwd(), 'docs/index.html'),
        },
        output: {
          manualChunks: {
            firebase: ['firebase/app', 'firebase/auth', 'firebase/database'],
          },
        },
      },
    },
  }
})
