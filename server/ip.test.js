import assert from 'node:assert/strict'
import test from 'node:test'

import { ipKey, isBlocked, parseBlocklist, parseIp, rateLimitSubject } from './ip.js'

test('parses IPv4 and rejects malformed addresses', () => {
  assert.equal(parseIp('203.0.113.7').value, 0xcb007107n)
  for (const bad of ['', '1.2.3', '1.2.3.256', '1.2.3.4.5', 'a.b.c.d', 'unknown']) {
    assert.equal(parseIp(bad), null, bad)
  }
})

test('parses IPv6 including compressed and IPv4-mapped forms', () => {
  assert.equal(parseIp('::1').value, 1n)
  assert.equal(parseIp('2001:db8::').value, 0x20010db8n << 96n)
  assert.equal(parseIp('::ffff:1.2.3.4').value, parseIp('::ffff:102:304').value)
  assert.equal(parseIp('2001:DB8:0:0:0:0:0:1').value, parseIp('2001:db8::1').value)
  for (const bad of ['1::2::3', '2001:db8:::1', '12345::', ':::']) {
    assert.equal(parseIp(bad), null, bad)
  }
})

test('matches single addresses and CIDR ranges of either family', () => {
  const ranges = parseBlocklist('203.0.113.7, 198.51.100.0/24\n2001:db8::/32 junk 10.0.0.0/99')
  assert.equal(ranges.length, 3, 'junk entries are skipped')
  assert.ok(isBlocked('203.0.113.7', ranges))
  assert.ok(!isBlocked('203.0.113.8', ranges))
  assert.ok(isBlocked('198.51.100.200', ranges))
  assert.ok(!isBlocked('198.51.101.1', ranges))
  assert.ok(isBlocked('2001:db8:abcd::5', ranges))
  assert.ok(!isBlocked('2001:db9::5', ranges))
  assert.ok(!isBlocked('unknown', ranges))
  assert.ok(!isBlocked(null, ranges))
})

test('an empty or missing list blocks nothing', () => {
  assert.deepEqual(parseBlocklist(undefined), [])
  assert.ok(!isBlocked('1.2.3.4', parseBlocklist('')))
})

test('ipKey is stable, key-dependent, and safe as a database key', async () => {
  const first = await ipKey('203.0.113.7', 'secret')
  assert.equal(first, await ipKey('203.0.113.7', 'secret'))
  assert.notEqual(first, await ipKey('203.0.113.7', 'other secret'))
  assert.notEqual(first, await ipKey('203.0.113.8', 'secret'))
  assert.match(first, /^[A-Za-z0-9_-]{22}$/)
})

test('rate limits count IPv4 per address and IPv6 per /64', () => {
  assert.equal(rateLimitSubject('203.0.113.7'), '203.0.113.7')
  assert.equal(rateLimitSubject('2001:db8:1:2:aaaa::1'), '2001:0db8:0001:0002::/64')
  assert.equal(rateLimitSubject('2001:db8:1:2:bbbb::9'), rateLimitSubject('2001:db8:1:2:aaaa::1'))
  assert.notEqual(rateLimitSubject('2001:db8:1:3::1'), rateLimitSubject('2001:db8:1:2::1'))
  assert.equal(rateLimitSubject('garbage'), 'unknown')
})
