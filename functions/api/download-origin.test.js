import assert from 'node:assert/strict'
import test from 'node:test'

import { onRequestPost } from './download-origin.js'

async function originFor(cf) {
  const request = new Request('https://genxyzlab.org/api/download-origin', { method: 'POST' })
  Object.defineProperty(request, 'cf', { value: cf })
  return (await onRequestPost({ request })).json()
}

test('snaps coordinates to the 0.25 degree grid', async () => {
  const origin = await originFor({ latitude: '14.5995', longitude: '120.9842' })
  assert.deepEqual(origin, { available: true, lat: 14.5, lng: 121, gridDegrees: 0.25 })
})

test('snapped values are exact multiples the database rules accept', async () => {
  for (const [latitude, longitude] of [
    ['-33.8688', '151.2093'],
    ['51.5072', '-0.1276'],
    ['-0.1', '-0.1'],
  ]) {
    const { lat, lng } = await originFor({ latitude, longitude })
    assert.ok(Number.isInteger(lat * 4), `${lat} is not on the grid`)
    assert.ok(Number.isInteger(lng * 4), `${lng} is not on the grid`)
    assert.ok(!Object.is(lat, -0) && !Object.is(lng, -0))
  }
})

test('reports unavailable when Cloudflare has no location', async () => {
  assert.deepEqual(await originFor({}), { available: false })
})
