// Rates are normalised to "MYR per 1 unit of currency".
// BNM sends no CORS headers, so it's reached through a same-origin proxy
// (vite server/preview proxy locally, vercel.json rewrite in production).
const BNM_URL = '/api/bnm/exchange-rate'
const FALLBACK_URLS = [
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/myr.json',
  'https://latest.currency-api.pages.dev/v1/currencies/myr.json',
]
const CACHE_KEY = 'fx-rates-v1'

async function fetchJson(url, headers) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

// Bank Negara Malaysia: ~25 currencies, updated at 0900/1130/1200/1700 MYT
async function fetchBnm() {
  const json = await fetchJson(BNM_URL, { Accept: 'application/vnd.BNM.API.v1+json' })
  const rates = {}
  for (const item of json?.data || []) {
    const r = item.rate || {}
    const buy = Number(r.buying_rate) || null
    const sell = Number(r.selling_rate) || null
    const mid = Number(r.middle_rate) || (buy && sell ? (buy + sell) / 2 : buy || sell)
    const unit = Number(item.unit) || 1
    if (mid && item.currency_code) rates[item.currency_code.toUpperCase()] = mid / unit
  }
  if (!Object.keys(rates).length) throw new Error('BNM returned no rates')
  return {
    rates,
    updatedAt: json.meta?.last_updated || json.data?.[0]?.rate?.date || null,
    session: json.meta?.session || null,
  }
}

// fawazahmed0 currency-api: 200+ currencies, daily
async function fetchFallback() {
  let lastErr
  for (const url of FALLBACK_URLS) {
    try {
      const json = await fetchJson(url)
      const rates = {}
      for (const [code, perMyr] of Object.entries(json.myr || {})) {
        if (perMyr > 0) rates[code.toUpperCase()] = 1 / perMyr
      }
      return { rates, updatedAt: json.date }
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr
}

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) } catch { return null }
}

function saveCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)) } catch {}
}

// BNM first; fallback fills currencies BNM doesn't cover (or everything if BNM fails).
export async function fetchRates() {
  const [bnm, fb] = await Promise.allSettled([fetchBnm(), fetchFallback()])

  if (bnm.status === 'rejected' && fb.status === 'rejected') {
    const cached = loadCache()
    if (cached) return { ...cached, offline: true }
    throw new Error('Unable to load exchange rates')
  }

  const rates = {}
  const sources = {}
  if (fb.status === 'fulfilled') {
    for (const [c, r] of Object.entries(fb.value.rates)) { rates[c] = r; sources[c] = 'fallback' }
  }
  if (bnm.status === 'fulfilled') {
    for (const [c, r] of Object.entries(bnm.value.rates)) { rates[c] = r; sources[c] = 'bnm' }
  }
  // set last: the fallback's MYR file includes myr itself and would mark it 'fallback'
  rates.MYR = 1
  sources.MYR = 'bnm'

  const result = {
    rates,
    sources,
    bnm: bnm.status === 'fulfilled' ? { updatedAt: bnm.value.updatedAt, session: bnm.value.session } : null,
    fallback: fb.status === 'fulfilled' ? { updatedAt: fb.value.updatedAt } : null,
    fetchedAt: new Date().toISOString(),
  }
  saveCache(result)
  return result
}
