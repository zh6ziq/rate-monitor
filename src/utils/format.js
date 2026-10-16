export const GRAMS_PER_OZ = 31.1034768

const MYT_OFFSET_MS = 8 * 3600 * 1000

// YYYY-MM-DD in Malaysia time
export function todayMYT() {
  return new Date(Date.now() + MYT_OFFSET_MS).toISOString().slice(0, 10)
}

export function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function toUnit(pricePerOz, unit) {
  return unit === 'g' ? pricePerOz / GRAMS_PER_OZ : pricePerOz
}

const rm = new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const formatRM = (v) => (v == null ? '—' : rm.format(v))

export function formatChange(v) {
  if (v == null) return '—'
  return `${v > 0 ? '+' : v < 0 ? '−' : ''}${rm.format(Math.abs(v))}`
}

export function formatPct(v) {
  if (v == null) return '—'
  return `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)}%`
}

export function formatDate(isoDate) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  })
}

// in the viewer's local timezone
export function formatDateTime(date) {
  return date.toLocaleString('en-MY', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

export function formatTime(date) {
  return date.toLocaleTimeString('en-MY', { hour: 'numeric', minute: '2-digit', second: '2-digit' })
}
