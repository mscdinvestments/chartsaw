const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_KEY || 'd7p8de1r01qlb0a94bcgd7p8de1r01qlb0a94bd0'

async function get(path) {
  const res = await fetch(`https://finnhub.io/api/v1${path}&token=${FINNHUB_KEY}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchLiveData(ticker) {
  const sym = ticker.toUpperCase()

  const [quote, profile, metrics] = await Promise.all([
    get(`/quote?symbol=${sym}`),
    get(`/stock/profile2?symbol=${sym}`),
    get(`/stock/metric?symbol=${sym}&metric=all`),
  ])

  if (!quote.c || quote.c === 0)
    throw new Error(`No data found for "${sym}". Check the ticker symbol.`)

  const m = metrics.metric || {}

  return {
    currentPrice:  quote.c?.toFixed(2)  || '',
    change:        quote.d?.toFixed(2)  || '0',
    changePct:     quote.dp?.toFixed(2) || '0',
    weekHigh52:    m['52WeekHigh']?.toFixed(2) || '',
    weekLow52:     m['52WeekLow']?.toFixed(2)  || '',
    marketCap:     profile.marketCapitalization
                     ? `$${(profile.marketCapitalization / 1000).toFixed(1)}B`
                     : '',
    eps:           (m.epsNormalizedAnnual ?? m.epsTTM)?.toFixed(2) ?? '',
    peRatio:       m.peTTM?.toFixed(1)  || '',
    beta:          m.beta?.toFixed(2)   || '',
    weekReturn52:  m['52WeekPriceReturnDaily']?.toFixed(1) || '',
    companyName:   profile.name         || sym,
    sector:        profile.finnhubIndustry || '',
    exchange:      profile.exchange     || '',
    logo:          profile.logo         || '',
  }
}
