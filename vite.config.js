import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const siteUrl = env.VITE_SITE_URL || 'https://genxyzlab.com'

  return {
    plugins: [vue(), seoFiles(siteUrl)],
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
