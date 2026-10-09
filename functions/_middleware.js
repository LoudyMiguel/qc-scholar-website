import { isBlocked, parseBlocklist } from '../server/ip.js'

const CANONICAL_HOST = 'genxyzlab.org'
const WWW_HOST = `www.${CANONICAL_HOST}`

export async function onRequest({ request, env = {}, next }) {
  // BLOCKED_IPS (Pages environment variable): addresses or CIDR ranges
  // refused on every page and API route. Cloudflare's own IP Access Rules
  // block at the edge without a redeploy and also cover /assets/*.
  if (env.BLOCKED_IPS && isBlocked(request.headers.get('CF-Connecting-IP'), parseBlocklist(env.BLOCKED_IPS))) {
    return new Response('Access from your network has been blocked because of abuse.', {
      status: 403,
      headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const url = new URL(request.url)

  if (url.hostname.toLowerCase() === WWW_HOST) {
    url.hostname = CANONICAL_HOST
    return Response.redirect(url.toString(), 301)
  }

  return next()
}
