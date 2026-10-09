// IP parsing and matching for the BLOCKED_IPS list, plus the keyed hash used
// to rate-limit an address without storing it in the rate-limit records.

function parseIpv4(text) {
  const parts = text.split('.')
  if (parts.length !== 4) return null
  let value = 0n
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part) || Number(part) > 255) return null
    value = (value << 8n) | BigInt(part)
  }
  return { version: 4, value, bits: 32 }
}

function parseIpv6(text) {
  let address = text.toLowerCase()
  const zone = address.indexOf('%')
  if (zone !== -1) address = address.slice(0, zone)

  // A trailing dotted IPv4 (::ffff:1.2.3.4) supplies the last two groups.
  const lastColon = address.lastIndexOf(':')
  const last = address.slice(lastColon + 1)
  if (last.includes('.')) {
    const v4 = parseIpv4(last)
    if (!v4) return null
    address = `${address.slice(0, lastColon + 1)}${(v4.value >> 16n).toString(16)}:${(v4.value & 0xffffn).toString(16)}`
  }

  const halves = address.split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? halves[0].split(':') : []
  const rest = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  let groups = head
  if (halves.length === 2) {
    const missing = 8 - head.length - rest.length
    if (missing < 1) return null
    groups = [...head, ...Array(missing).fill('0'), ...rest]
  }
  if (groups.length !== 8) return null

  let value = 0n
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(group)) return null
    value = (value << 16n) | BigInt(`0x${group}`)
  }
  return { version: 6, value, bits: 128 }
}

export function parseIp(text) {
  const candidate = String(text || '').trim()
  if (!candidate) return null
  return candidate.includes(':') ? parseIpv6(candidate) : parseIpv4(candidate)
}

/** Parses "1.2.3.4, 5.6.0.0/16 2001:db8::/32" into matchable ranges; skips junk. */
export function parseBlocklist(text) {
  const ranges = []
  for (const entry of String(text || '').split(/[\s,;]+/)) {
    if (!entry) continue
    const [address, prefixText] = entry.split('/')
    const ip = parseIp(address)
    if (!ip) continue
    const prefix = prefixText === undefined ? ip.bits : Number(prefixText)
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > ip.bits) continue
    const shift = BigInt(ip.bits - prefix)
    ranges.push({ version: ip.version, shift, network: ip.value >> shift })
  }
  return ranges
}

export function isBlocked(ipText, ranges) {
  const ip = parseIp(ipText)
  if (!ip) return false
  return ranges.some(
    (range) => range.version === ip.version && ip.value >> range.shift === range.network,
  )
}

/**
 * What the rate limits count against. One IPv6 subscriber usually controls a
 * whole /64 and can rotate through it freely, so IPv6 is limited per /64;
 * IPv4 per address. Unparseable input is limited as one shared bucket.
 */
export function rateLimitSubject(ipText) {
  const ip = parseIp(ipText)
  if (!ip) return 'unknown'
  if (ip.version === 4) return String(ipText).trim()
  const prefix = (ip.value >> 64n).toString(16).padStart(16, '0').match(/.{4}/g).join(':')
  return `${prefix}::/64`
}

/** HMAC-SHA256 of the address, base64url, 22 characters: a stable database key. */
export async function ipKey(ip, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const digest = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(String(ip))),
  )
  let binary = ''
  for (const byte of digest) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '').slice(0, 22)
}
