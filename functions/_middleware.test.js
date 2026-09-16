import assert from 'node:assert/strict'
import test from 'node:test'

import { onRequest } from './_middleware.js'

test('permanently redirects www URLs to the canonical host', async () => {
  const response = await onRequest({
    request: new Request('https://www.genxyzlab.org/docs/?source=test'),
    next: () => {
      throw new Error('A www request must not reach the Pages asset.')
    },
  })

  assert.equal(response.status, 301)
  assert.equal(
    response.headers.get('location'),
    'https://genxyzlab.org/docs/?source=test',
  )
})

test('passes canonical-host requests through unchanged', async () => {
  const expected = new Response('ok', { status: 200 })
  const response = await onRequest({
    request: new Request('https://genxyzlab.org/'),
    next: () => expected,
  })

  assert.equal(response, expected)
})
