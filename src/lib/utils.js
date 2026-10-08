import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs) => twMerge(clsx(inputs))

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export const formatINR = (amount) => inr.format(amount)

export const formatNumber = (n) => new Intl.NumberFormat('en-IN').format(n)

export function daysUntil(iso) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

export function formatDate(iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Intl.DateTimeFormat('en-IN', opts).format(new Date(iso))
}

export function formatDateTime(iso) {
  return formatDate(iso, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const UNITS = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

export function timeAgo(iso) {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

export const slugFrom = (text) =>
  text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-/, '')
    .slice(0, 40)

export function pluralize(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`
}

export function absoluteUrl(path) {
  return `${window.location.origin}${path}`
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
