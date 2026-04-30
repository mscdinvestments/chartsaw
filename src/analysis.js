export function analyze(params, live) {
  const {
    ticker, currentPrice, weekHigh52, weekLow52,
    maType, volume, trend, sector,
    marketCap, eps, cash, debt, catalysts,
  } = params

  const sym   = ticker.toUpperCase()
  const price = parseFloat(currentPrice) || null
  const hi    = parseFloat(weekHigh52)   || null
  const lo    = parseFloat(weekLow52)    || null

  let fib = null
  if (price && hi && lo && hi > lo) {
    const r = hi - lo
    fib = {
      r236: +(lo + r * 0.236).toFixed(2),
      r382: +(lo + r * 0.382).toFixed(2),
      r500: +(lo + r * 0.500).toFixed(2),
      r618: +(lo + r * 0.618).toFixed(2),
      r786: +(lo + r * 0.786).toFixed(2),
    }
  }

  const rPos      = (price && hi && lo) ? Math.round(((price - lo) / (hi - lo)) * 100) : null
  const pctFromHi = (price && hi)       ? Math.round(((hi - price) / hi) * 100)        : null
  const broken    = trend === 'broken' || trend === 'downtrend'
  const bullMA    = maType === 'bullish'
  const volWeak   = volume === 'declining' || volume === 'diverging'
  const epsNeg    = eps && parseFloat(eps) < 0
  const parabolic = rPos !== null && rPos > 85
  const hardAsset = /mining|gold|silver|energy|material|metal|resource/i.test(
    ((live?.sector || sector) + catalysts).toLowerCase()
  )

  let st = 'NEUTRAL'
  if (broken && volWeak)                st = 'BEARISH'
  else if (!broken && bullMA && !volWeak) st = 'BULLISH'
  else if (broken || volWeak)           st = 'CAUTION'

  const mt = (bullMA && !broken) ? 'BULLISH' : (broken && !bullMA) ? 'BEARISH' : 'WATCH'
  const lt = (hardAsset || bullMA) ? 'BULLISH' : 'NEUTRAL'

  let overall = 'WAIT FOR CONFLUENCE'
  if (st === 'BULLISH' && bullMA)            overall = 'BUY THE BREAKOUT'
  else if (st === 'BEARISH' && broken)       overall = 'AVOID — BROKEN CHART'
  else if (lt === 'BULLISH' && st !== 'BULLISH') overall = 'ACCUMULATE ON DIPS'

  const stats = []
  if (price)              stats.push({ label: 'Current Price',  value: `$${price}`,             note: live ? 'Live via Finnhub' : 'Manual entry', color: 'gold' })
  if (hi)                 stats.push({ label: '52-Week High',   value: `$${hi}`,                note: pctFromHi ? `${pctFromHi}% above current` : '', color: 'yellow' })
  if (lo)                 stats.push({ label: '52-Week Low',    value: `$${lo}`,                note: '', color: 'silver' })
  if (rPos !== null)      stats.push({ label: 'Range Position', value: `${rPos}%`,              note: rPos > 70 ? 'Near highs — caution' : rPos < 30 ? 'Near lows — opportunity' : 'Mid-range', color: rPos > 70 ? 'red' : rPos < 30 ? 'green' : 'yellow' })
  if (live?.peRatio)      stats.push({ label: 'P/E Ratio',      value: live.peRatio,            note: '', color: 'gold' })
  if (live?.beta)         stats.push({ label: 'Beta',           value: live.beta,               note: parseFloat(live.beta) > 1.5 ? 'High volatility' : 'Normal volatility', color: parseFloat(live.beta) > 1.5 ? 'red' : 'green' })
  if (marketCap)          stats.push({ label: 'Market Cap',     value: marketCap,               note: '', color: 'gold' })
  if (eps)                stats.push({ label: 'EPS (TTM)',       value: eps,                     note: parseFloat(eps) < 0 ? 'Pre-revenue / loss' : 'Earnings positive', color: parseFloat(eps) < 0 ? 'red' : 'green' })
  if (live?.weekReturn52) stats.push({ label: '52W Return',     value: `${live.weekReturn52}%`, note: '', color: parseFloat(live.weekReturn52) >= 0 ? 'green' : 'red' })
  if (cash)               stats.push({ label: 'Cash',           value: cash,                    note: 'Balance sheet', color: 'green' })

  const nearFib = fib ? Object.values(fib).some(v => price && Math.abs(v - price) / price < 0.03) : false

  const signals = [
    { tool: 'Fibonacci Retracement', sub: '23.6% / 38.2% / 50% / 61.8% / 78.6%',
      sig: fib ? (nearFib ? 'KEY ZONE' : 'WATCH') : 'ENTER DATA',
      read: fib ? `Levels from $${lo}→$${hi}: 38.2%=$${fib.r382} | 50%=$${fib.r500} | 61.8%=$${fib.r618} | 78.6%=$${fib.r786}. ${nearFib ? 'Price is near a key Fib level — high-probability zone.' : 'Price is between levels — monitor for next confluence.'}` : 'Enter price + 52W High/Low to unlock exact Fibonacci calculations.',
      imp: fib ? `The 61.8% golden ratio at $${fib.r618} is Soloway's #1 entry zone.` : "The 61.8% golden ratio is Soloway's favorite entry zone." },
    { tool: 'Support & Resistance', sub: 'Multi-touch price zones',
      sig: broken ? 'ALERT' : 'WATCH',
      read: broken ? `Uptrend ${trend === 'downtrend' ? 'fully reversed' : 'broken'} — former support is now resistance. ${hi ? `Key resistance near $${(hi * 0.79).toFixed(2)}–$${(hi * 0.82).toFixed(2)}.` : ''}` : `Uptrend intact — prior resistance becoming new support. ${price ? `Watch $${(price * 0.93).toFixed(2)} as first support and $${(price * 1.07).toFixed(2)} as next resistance.` : ''}`,
      imp: 'A level touched 3+ times becomes hardened S/R. More tests = more powerful the eventual break.' },
    { tool: 'Trend Lines', sub: 'Major & minor channels',
      sig: trend === 'intact' ? 'BULLISH' : trend === 'broken' ? 'BROKEN' : trend === 'downtrend' ? 'BEARISH' : 'NEUTRAL',
      read: trend === 'intact' ? 'Uptrend intact — higher lows confirmed. Trade WITH the trend until it breaks.' : trend === 'broken' ? "Uptrend broken — Soloway's #1 sell signal. Bias shifts bearish until new base confirmed." : trend === 'downtrend' ? 'Confirmed downtrend: lower highs and lower lows. Never buy a falling knife.' : 'Basing/consolidating. Wait for breakout or breakdown to confirm direction.',
      imp: broken ? 'Respect a broken trendline — no long entries until a new higher low is confirmed on strong volume.' : 'Trend is your edge. Only take longs in uptrends, shorts in downtrends.' },
    { tool: 'Chart Patterns', sub: 'H&S, Cup & Handle, Flags',
      sig: broken ? 'BEAR FLAG' : bullMA ? 'WATCH' : 'FORMING',
      read: broken ? 'Bear flag or H&S topping likely forming. Watch for lower highs, declining bounce volume, and neckline break as confirmation.' : bullMA ? 'Watch for bull flag on pullbacks — tight consolidation after strong move. Cup & handle = highest-conviction entry.' : 'Pattern unclear — needs more price action.',
      imp: "Measure pattern height, project from breakout point for exact target. Core to Soloway's most profitable setups." },
    { tool: 'Volume Analysis', sub: 'Volume confirms price',
      sig: volWeak ? 'DIVERGENCE' : (volume === 'confirming' || volume === 'rising') ? 'BULLISH' : 'WATCH',
      read: volWeak ? "Volume declining on bounces — distribution signal. Smart money selling into strength. 'Volume tells the truth.'" : (volume === 'confirming' || volume === 'rising') ? 'Volume confirming price — institutional accumulation. Soloway requires this before any long entry.' : 'Volume trend not set. Always verify — a breakout on low volume is a false breakout.',
      imp: "'Volume is the gas in the engine.' Rising price + declining volume = suspect rally." },
    { tool: 'Moving Averages', sub: '20 / 50 / 200 Day MA',
      sig: maType === 'bullish' ? 'BULLISH' : maType === 'bearish' ? 'BEARISH CROSS' : maType === 'mixed' ? 'WATCH' : 'UNKNOWN',
      read: maType === 'bullish' ? "All MAs stacked bullishly. 20 MA acting as dynamic support. Soloway's ideal 'stacked' setup." : maType === 'bearish' ? 'Price below 20 and 50-day MAs — both act as resistance. Watch for death cross.' : maType === 'mixed' ? 'Above 200 MA but below 50 MA. Wait for 50 MA recapture before re-entering long.' : 'Select MA posture in Advanced Parameters.',
      imp: "The 200-day MA is Soloway's 'great equalizer.' A close below it signals long-term trend change." },
    { tool: 'Tail Theory', sub: 'Rejection candles & shadows',
      sig: broken ? 'WATCH LOWS' : 'WATCH HIGHS',
      read: broken ? 'Watch for long lower-shadow tails at Fib levels and 200 MA — buy signals at support. Bearish engulfing at resistance confirms downtrend.' : 'Watch for bearish tail rejections at resistance. Bullish tails at support = preferred Soloway entry.',
      imp: "'Tail Theory': a long shadow at a key level reveals where smart money entered. Longer tail = more conviction." },
    { tool: 'Multi-Factor Confluence', sub: '2+ factors = high probability',
      sig: fib ? 'KEY ZONE' : 'IDENTIFY',
      read: fib ? `Find zones where Fib + MAs + prior S/R + gap fills cluster within 1-2%. 50% Fib at $${fib.r500} may converge with key MA levels.` : 'Enter price data to identify confluence zones. Soloway only trades where 2+ factors align.',
      imp: 'Three-factor confluence = highest conviction. Quality over quantity — fewer, better trades only.' },
    { tool: 'Sentiment / Counter-Trend', sub: 'Euphoria = fade it',
      sig: parabolic ? 'CAUTION' : (rPos !== null && rPos < 20) ? 'OVERSOLD' : 'WATCH',
      read: parabolic ? `Stock at ${rPos}% of 52-week range — ATH territory. Soloway: "When everyone is screaming bullish — think opposite."` : (rPos !== null && rPos < 20) ? `Near 52-week low (${rPos}% of range) — fear/capitulation zone. "Panic is the time to buy."` : 'Sentiment neutral. Watch for catalyst-driven extremes as entry triggers.',
      imp: 'Soloway called Bitcoin, crude, and tech tops when retail was most euphoric. Use sentiment as a contrarian timing tool.' },
    { tool: 'Bull / Bear Flag', sub: 'Flag transition identification',
      sig: broken && volWeak ? 'BEAR FLAG' : (!broken && bullMA) ? 'BULL FLAG' : 'NEUTRAL',
      read: (broken && volWeak) ? 'Bear flag: downward channel with lower highs/lows and declining volume. Next leg lower is higher probability.' : (!broken && bullMA) ? 'Intact uptrend may be forming bull flag — tight pullback on low volume, then explosive breakout = entry.' : 'Flag unclear. Bull-to-bear transition is where retail traders get trapped.',
      imp: 'The moment a bull flag makes lower lows it has become a bear flag — exit immediately.' },
  ]

  const down = [], up2 = []
  if (fib && price) {
    if (price > fib.r382) down.push({ type: '38.2% Fib Support',   price: `$${fib.r382}`, note: 'First major retracement' })
    if (price > fib.r500) down.push({ type: '50% Fib Mid-Point',   price: `$${fib.r500}`, note: "Soloway's key decision level" })
    if (price > fib.r618) down.push({ type: '61.8% Golden Ratio',  price: `$${fib.r618}`, note: 'Highest probability bounce zone' })
    if (price > fib.r786) down.push({ type: '78.6% Last Defense',  price: `$${fib.r786}`, note: 'Break = full retracement likely' })
    if (price < fib.r618) up2.push({ type: '61.8% Fib Resistance', price: `$${fib.r618}`, note: 'Must clear for bull case' })
    if (price < fib.r786) up2.push({ type: '78.6% Fib Resistance', price: `$${fib.r786}`, note: 'Second hurdle toward ATH' })
    if (hi)               up2.push({ type: '52W High / ATH',       price: `$${hi}`,        note: 'Full reclaim = confirmed bull' })
    if (lo && hi)         up2.push({ type: '1.272 Extension',      price: `$${(lo + (hi - lo) * 1.272).toFixed(2)}`, note: 'Bull extension target' })
  } else if (price) {
    down.push(
      { type: '~10% Pullback Zone',   price: `$${(price * 0.90).toFixed(2)}`, note: 'Initial support estimate' },
      { type: '~20% Correction Zone', price: `$${(price * 0.80).toFixed(2)}`, note: 'Deeper correction zone' },
      { type: '~35% Deep Support',    price: `$${(price * 0.65).toFixed(2)}`, note: 'Major support / oversold' },
    )
    up2.push(
      { type: '~10% Resistance',  price: `$${(price * 1.10).toFixed(2)}`, note: 'Nearest resistance estimate' },
      { type: '~20% Target',      price: `$${(price * 1.20).toFixed(2)}`, note: 'Secondary target' },
      { type: '~40% Bull Target', price: `$${(price * 1.40).toFixed(2)}`, note: 'Extended bull case' },
    )
  } else {
    down.push({ type: 'Enter Price Data', price: '—', note: 'Add price + 52W range for Fib levels' })
    up2.push({  type: 'Enter Price Data', price: '—', note: 'Add price + 52W range for Fib levels' })
  }

  const bull = []
  if (catalysts)      bull.push({ title: 'KEY CATALYST',            body: `${catalysts}. Soloway prioritizes catalyst-driven setups — technical confluence + catalyst = highest-conviction trade.` })
  if (!epsNeg && eps) bull.push({ title: 'EARNINGS SUPPORT',        body: `Positive EPS of ${eps} provides a fundamental floor. Soloway prefers trades where technicals AND fundamentals align.` })
  if (hardAsset)      bull.push({ title: 'HARD ASSET MACRO TAILWIND', body: `${live?.sector || sector} sector aligned with 2026 rotation into real assets. Soloway is long-term bullish on gold, silver, and commodities.` })
  if (!broken && bullMA) bull.push({ title: 'TECHNICAL ALIGNMENT',  body: 'Intact uptrend + bullish MAs = ideal long setup. Price making higher highs and higher lows — textbook uptrend.' })
  if (cash)           bull.push({ title: 'BALANCE SHEET STRENGTH',  body: `Cash: ${cash}.${debt ? ` Debt: ${debt}.` : ''} Soloway verifies the balance sheet before trading smaller caps.` })
  if (!bull.length)   bull.push({ title: 'ADD FUNDAMENTALS',        body: 'Add catalyst notes and data for a tailored bull thesis. Technicals tell you WHEN; fundamentals tell you WHY.' })

  const bear = []
  if (broken)    bear.push({ title: 'BROKEN TRENDLINE',           body: "Never fight a broken trendline. Wait for a confirmed new higher low before any long." })
  if (volWeak)   bear.push({ title: 'VOLUME DIVERGENCE',          body: "Declining volume on bounces = distribution. Smart money is selling into strength." })
  if (epsNeg)    bear.push({ title: 'NO EARNINGS FLOOR',          body: "Negative EPS means no fundamental support. The chart IS the floor." })
  if (parabolic) bear.push({ title: 'PARABOLIC — MEAN REVERSION', body: "Near ATH after large run always faces mean reversion. Parabolas always normalize." })
  if (!bear.length) bear.push({ title: 'MACRO / SECTOR RISK',    body: `Fed policy or rotation away from ${live?.sector || sector} could pressure the stock. Always set a stop loss.` })

  const e1  = fib ? `$${fib.r500}–$${fib.r618}` : price ? `$${(price*0.93).toFixed(2)}–$${(price*0.97).toFixed(2)}` : 'Identify Fib zone'
  const sl1 = fib ? `Below $${fib.r786}`         : price ? `$${(price*0.88).toFixed(2)}` : 'Below key support'
  const t11 = fib ? `$${fib.r786}`               : price ? `$${(price*1.10).toFixed(2)}` : 'Next Fib level'
  const t12 = hi  ? `$${hi}`                     : price ? `$${(price*1.25).toFixed(2)}` : 'ATH'
  const e2  = fib ? `$${fib.r382}–$${fib.r500}`  : price ? `$${(price*1.03).toFixed(2)}–$${(price*1.07).toFixed(2)}` : 'At resistance'
  const sl2 = fib ? `Above $${fib.r236}`          : price ? `$${(price*1.10).toFixed(2)}` : 'Above resistance'
  const t21 = fib ? `$${fib.r618}`                : price ? `$${(price*0.90).toFixed(2)}` : '50% Fib'
  const t22 = fib ? `$${fib.r786}`                : price ? `$${(price*0.80).toFixed(2)}` : '61.8% Fib'

  const bullSetup = { Trigger: broken ? 'Reclaim 50 MA + volume surge' : 'Pullback to support on low volume', Confirmation: 'Close above resistance on 2× avg volume', Entry: e1, 'Stop Loss': sl1, 'Target 1': t11, 'Target 2': t12, 'Risk/Reward': 'Min 1:3', Probability: !broken && bullMA ? 'Medium-High' : 'Medium — wait for signal' }
  const bearSetup = { Trigger: broken ? 'Break below key support on volume' : 'Rejection at resistance + vol spike', Confirmation: 'Daily close below support level', Entry: e2, 'Stop Loss': sl2, 'Target 1': t21, 'Target 2': t22, 'Risk/Reward': 'Min 1:2.5', Probability: broken && volWeak ? 'Medium-High' : 'Medium — needs confirmation' }

  const callQ = overall === 'BUY THE BREAKOUT' ? '"Confirmed breakout setup — buy the CLOSE, not the candle."' : overall === 'AVOID — BROKEN CHART' ? '"Broken chart. Do not fight it. Let price find its level and base first."' : overall === 'ACCUMULATE ON DIPS' ? '"Great long-term story — but the short-term chart says wait. Let price come to YOU."' : '"Not confirmed yet. Wait for multi-factor confluence before committing capital."'
  const bodyText = `Applying CHARTSAW PPT Methodology to ${sym}: ${st.toLowerCase()} short-term conditions with a ${lt.toLowerCase()} long-term thesis. ${broken ? 'The broken uptrend is the most critical technical fact — patience until a new higher low forms.' : 'The intact trend is your primary edge.'} ${fib ? `Key decision levels: $${fib.r618} (61.8% Fib) and $${fib.r500} (50% Fib).` : 'Enter price data to unlock exact Fibonacci decision levels.'} As Gareth always says: "Discipline, probability, and patience — let the chart come to you."`

  return { ticker: sym, companyName: live?.companyName || sym, sector: live?.sector || sector, currentPrice: price ? `$${price}` : '—', change: live?.change || '0', changePct: live?.changePct || '0', verdicts: { shortTerm: st, mediumTerm: mt, longTerm: lt, overall }, stats, signals, down, up2, bull, bear, bullSetup, bearSetup, call: callQ, body: bodyText }
}
