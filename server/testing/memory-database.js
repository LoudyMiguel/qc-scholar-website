// In-memory stand-in for the database client in firebase-admin.js, for unit
// tests. The emulator tests in server/emulator.test.js cover the real REST API.

const clone = (value) => (value === undefined ? undefined : structuredClone(value))

export function createMemoryDatabase(initial = {}) {
  const root = { value: clone(initial) }

  const segments = (path) => path.split('/').filter(Boolean)

  function read(path) {
    let node = root.value
    for (const part of segments(path)) {
      if (!node || typeof node !== 'object' || !(part in node)) return null
      node = node[part]
    }
    return node === undefined ? null : clone(node)
  }

  function write(path, value) {
    const parts = segments(path)
    if (!parts.length) {
      root.value = clone(value) ?? {}
      return
    }
    let node = (root.value ??= {})
    for (const part of parts.slice(0, -1)) {
      if (!node[part] || typeof node[part] !== 'object') node[part] = {}
      node = node[part]
    }
    const last = parts.at(-1)
    if (value === null || value === undefined) delete node[last]
    else node[last] = resolveServerValues(clone(value), read(path))
  }

  function resolveServerValues(value, current) {
    if (value && typeof value === 'object') {
      if (value['.sv'] === 'timestamp') return Date.now()
      if (value['.sv']?.increment !== undefined) return (Number(current) || 0) + value['.sv'].increment
      for (const key of Object.keys(value)) {
        value[key] = resolveServerValues(value[key], current?.[key])
      }
    }
    return value
  }

  let counter = 0
  return {
    root,
    calls: [],
    async get(path, query = {}) {
      this.calls.push(['get', path, query])
      const value = read(path)
      if (query.shallow && value && typeof value === 'object') {
        return Object.fromEntries(Object.keys(value).map((key) => [key, true]))
      }
      if (query.orderBy && value && typeof value === 'object') {
        const field = JSON.parse(query.orderBy)
        let entries = Object.entries(value).sort((a, b) => (a[1]?.[field] ?? 0) - (b[1]?.[field] ?? 0))
        if (query.endAt !== undefined) entries = entries.filter(([, item]) => (item?.[field] ?? 0) <= Number(query.endAt))
        if (query.limitToFirst) entries = entries.slice(0, Number(query.limitToFirst))
        if (query.limitToLast) entries = entries.slice(-Number(query.limitToLast))
        return Object.fromEntries(entries)
      }
      return value
    },
    async patch(path, body) {
      this.calls.push(['patch', path, body])
      for (const [key, value] of Object.entries(body)) write(`${path}/${key}`, value)
    },
    async post(path, body) {
      this.calls.push(['post', path, body])
      const name = `-test${String(counter++).padStart(4, '0')}`
      write(`${path}/${name}`, body)
      return { name }
    },
    async remove(path) {
      this.calls.push(['remove', path])
      write(path, null)
    },
    async increment(path) {
      this.calls.push(['increment', path])
      write(path, { '.sv': { increment: 1 } })
      return read(path)
    },
    async transaction(path, update) {
      this.calls.push(['transaction', path])
      const next = update(read(path))
      if (next === undefined) return { committed: false, value: read(path) }
      write(path, next)
      return { committed: true, value: next }
    },
  }
}
