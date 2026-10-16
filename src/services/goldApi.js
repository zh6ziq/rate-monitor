import { addDays, todayMYT } from '../utils/format'

const GOLD_LIVE_URL = 'https://api.gold-api.com/price/XAU'
const CACHE_KEY = 'gold-myr-history-v1'

const currencyApiUrls = (tag, base) => [
  `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${tag}/v1/currencies/${base}.json`,
  `https://${tag}.currency-api.pages.dev/v1/currencies/${base}.json`,
]

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

async function fetchFirst(urls) {
  let lastErr
  for (const url of urls) {
    try {
      return await fetchJson(url)
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr
}

// --- localStorage cache: { 'YYYY-MM-DD': MYR per oz } ---
function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}
  } catch {
    return {}
  }
}

function saveCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // storage full or blocked; cache is optional
  }
}

// MYR per troy oz for a given date (daily rate)
async function fetchByDate(date) {
  const data = await fetchFirst(currencyApiUrls(date, 'xau'))
  const price = data?.xau?.myr
  if (!price) throw new Error(`No XAU/MYR for ${date}`)
  return price
}

async function runPool(items, limit, worker) {
  const queue = [...items]
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) await worker(queue.shift())
  })
  await Promise.all(runners)
}

// Daily history for the past `days` days. Returns [{ date, price }] sorted asc.
export async function fetchHistory(days = 180) {
  const today = todayMYT()
  const cache = loadCache()
  const dates = Array.from({ length: days + 1 }, (_, i) => addDays(today, -days + i))
  const missing = dates.filter((d) => cache[d] == null && d !== today)

  await runPool(missing, 10, async (date) => {
    try {
      cache[date] = await fetchByDate(date)
    } catch {
      // not published (e.g. very recent date) — skip
    }
  })

  // keep cache bounded to the requested window
  const minDate = dates[0]
  for (const d of Object.keys(cache)) if (d < minDate) delete cache[d]
  saveCache(cache)

  return dates.filter((d) => cache[d] != null).map((date) => ({ date, price: cache[date] }))
}

// Live spot in MYR per oz. Falls back to currency-api latest daily rate.
export async function fetchLive() {
  try {
    const [gold, fx] = await Promise.all([
      fetchJson(GOLD_LIVE_URL),
      fetchFirst(currencyApiUrls('latest', 'usd')),
    ])
    const usdMyr = fx?.usd?.myr
    if (!gold?.price || !usdMyr) throw new Error('Incomplete live data')
    return {
      price: gold.price * usdMyr,
      updatedAt: gold.updatedAt ? new Date(gold.updatedAt) : new Date(),
      source: 'live',
    }
  } catch {
    const data = await fetchFirst(currencyApiUrls('latest', 'xau'))
    return {
      price: data.xau.myr,
      updatedAt: new Date(`${data.date}T00:00:00Z`),
      source: 'daily',
    }
  }
}
