import { createSeed } from './seed'

const KEY = 'mbi:db:v1'
const EVENT = 'mbi:db-change'

let cache = null

function load() {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    cache = raw ? JSON.parse(raw) : null
  } catch {
    cache = null
  }
  if (!cache) {
    cache = createSeed()
    persist()
  }
  cache.comments ??= []
  return cache
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    throw new Error('Browser storage is full — try a smaller photo or reset the demo data.')
  }
  window.dispatchEvent(new Event(EVENT))
}

export function read(selector) {
  return structuredClone(selector(load()))
}

export function write(mutator) {
  const snapshot = structuredClone(load())
  try {
    const result = structuredClone(mutator(cache))
    persist()
    return result
  } catch (err) {
    cache = snapshot
    throw err
  }
}

export function resetDb() {
  cache = createSeed()
  persist()
}

/** Fires on local writes and on writes from other tabs (e.g. buyer page open beside the dashboard). */
export function subscribe(callback) {
  const onStorage = (e) => {
    if (e.key === KEY) {
      cache = null
      callback()
    }
  }
  window.addEventListener(EVENT, callback)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT, callback)
    window.removeEventListener('storage', onStorage)
  }
}

export const delay = (ms = 220 + Math.random() * 260) => new Promise((r) => setTimeout(r, ms))

export const uid = (prefix = '') => prefix + Math.random().toString(36).slice(2, 10)
