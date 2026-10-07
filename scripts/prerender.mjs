/**
 * Last build step: injects server-rendered markup into the built HTML files.
 *
 * `vite build` writes dist/ with an empty `<!--app-html-->` mount point, then
 * `vite build --ssr src/entry-server.js` compiles the same components for
 * Node into dist-ssr/. This script renders every page from that bundle,
 * replaces the placeholder, and removes dist-ssr/ so it is never deployed.
 *
 * A page that fails to render fails the build on purpose: shipping an empty
 * mount point would bring back the blank-then-pop first paint.
 */
import { readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const ssrDir = join(root, 'dist-ssr')
const PLACEHOLDER = '<!--app-html-->'

const { pages } = await import(pathToFileURL(join(ssrDir, 'entry-server.js')).href)

for (const [file, render] of Object.entries(pages)) {
  const path = join(dist, file)
  const template = await readFile(path, 'utf8')
  if (!template.includes(PLACEHOLDER)) {
    throw new Error(`${file} has no ${PLACEHOLDER} mount point to fill.`)
  }
  const markup = await render()
  await writeFile(path, template.replace(PLACEHOLDER, markup))
  console.log(`prerendered ${file} (${(markup.length / 1024).toFixed(1)} kB)`)
}

await rm(ssrDir, { recursive: true, force: true })
