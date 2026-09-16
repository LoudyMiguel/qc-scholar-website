const CANONICAL_HOST = 'genxyzlab.org'
const WWW_HOST = `www.${CANONICAL_HOST}`

export async function onRequest({ request, next }) {
  const url = new URL(request.url)

  if (url.hostname.toLowerCase() === WWW_HOST) {
    url.hostname = CANONICAL_HOST
    return Response.redirect(url.toString(), 301)
  }

  return next()
}

