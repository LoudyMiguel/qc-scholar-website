import assert from 'node:assert/strict'
import test from 'node:test'

import {
  cellKey,
  isLocationGridValue,
  parseCells,
  snapToLocationGrid,
} from './download-cells.js'

test('encodes keys without characters Firebase rejects', () => {
  assert.equal(cellKey(14.5, 121), 'n14p5_e121')
  assert.equal(cellKey(-33.75, 151.25), 's33p75_e151p25')
  assert.equal(cellKey(0, -0.25), 'n0_w0p25')
  for (const key of [cellKey(89.75, 179.75), cellKey(-90, -180)]) {
    assert.doesNotMatch(key, /[.$#[\]/]/)
  }
})

test('keeps the original keys for whole-degree legacy regions', () => {
  assert.equal(cellKey(15, 120), 'n15_e120')
  assert.equal(cellKey(-35, -60), 's35_w60')
})

test('accepts only 0.25 degree grid values for precise locations', () => {
  for (const value of [0, 14.25, -0.25, 179.75, -180, 90]) {
    assert.ok(isLocationGridValue(value), `${value} should be on the grid`)
  }
  for (const value of [14.3, 0.1, Number.NaN, Infinity]) {
    assert.ok(!isLocationGridValue(value), `${value} should be off the grid`)
  }
})

test('snaps coordinates to the 0.25 degree grid', () => {
  assert.equal(snapToLocationGrid('14.5995', -90, 90), 14.5)
  assert.equal(snapToLocationGrid('120.9842', -180, 180), 121)
  assert.equal(snapToLocationGrid(-0.1, -90, 90), 0)
  assert.ok(!Object.is(snapToLocationGrid(-0.1, -90, 90), -0))
  assert.equal(snapToLocationGrid(95, -90, 90), 90)
  for (const value of ['-33.8688', '151.2093', '-0.1276']) {
    assert.ok(isLocationGridValue(snapToLocationGrid(value, -180, 180)))
  }
})

test('reports no location when Cloudflare has none', () => {
  for (const value of [undefined, null, '', 'abc', Number.NaN]) {
    assert.equal(snapToLocationGrid(value, -90, 90), null)
  }
})

test('parses cells, skips malformed records, and sorts busiest first', () => {
  const cells = parseCells([
    ['a', { lat: 14.5, lng: 121, count: 3, android: 2, windows: 1 }],
    ['b', { lat: 51.5, lng: -0.25, count: 9 }],
    ['bad-count', { lat: 1, lng: 1, count: 0 }],
    ['bad-lat', { lat: 'x', lng: 1, count: 2 }],
    ['out-of-range', { lat: 120, lng: 1, count: 2 }],
    ['null', null],
  ])
  assert.deepEqual(
    cells.map((cell) => cell.id),
    ['b', 'a'],
  )
  assert.equal(cells[1].android, 2)
  assert.equal(cells[0].windows, 0)
})
