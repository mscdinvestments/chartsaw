import { useState } from 'react'
import './index.css'
import { fetchLiveData } from './finnhub.js'
import { analyze } from './analysis.js'

const DEFS = {
  ticker: '', currentPrice: '', weekHigh52: '', weekLow52: '',
  maType: 'bearish', volume: 'declining', trend: 'broken',
  sector: 'Technology', marketCap: '', eps: '', cash: '', debt: '',
  catalysts: '', timeframe: 'swing',
}

function vc(t = '') {
  const u = t.toUpperCase()
  if (/BULL|BUY|STRONG/.test(u))       return '#2ECC71'
  if (/BEAR|SELL|SHORT|AVOID/.test(u)) return '#E74C3C'
  if (/WAIT|NEUTRAL|WATCH|CAUTION/.test(u)) return '#F4D03F'
  return '#C9A84C'
}

function bc(t = '') {
  const u = t.toUpperCase()
  if (/BULL|BUY|INTACT|CONFIRM|STRONG/.test(u)) return 'badge-green'
  if (/BEAR|SELL|BROKEN|ALERT|DIVER|CAUTION/.test(u)) return 'badge-red'
  if (/ZONE|CONFLUENCE/.test(u)) return 'badge-gold'
  return 'badge-yellow'
}

function sc(c) {
  if (c === 'green')  return '#2ECC71'
  if (c === 'red')    return '#E74C3C'
  if (c === 'gold')   return '#C9A84C'
  if (c === 'yellow') return '#F4D03F'
  return '#D4DCE8'
}

export default function App() {
  const [p, setP]           = useState(DEFS)
  const [adv, setAdv]       = useState(false)
  const [live, setLive]     = useState(null)
  const [filled, setFilled] = useState({})
  const [fetching, setFetching] = useState(false)
  const [running, setRunning]   = useState(false)
  const [result, setResult]     = useState(null)
  const [err, setErr]           = useState(null)

  const up = (k, v) => setP(x => ({ ...x, [k]: v }))

  const loadLive = async () => {
    if (!p.ticker.trim()) { setErr('Enter a ticker first.'); return }
    setFetching(true); setErr(null); setLive(null); setFilled({}); setResult(null)
    try {
      const d = await fetchLiveData(p.ticker)
      setLive(d)
      const u = {}, f = {}
      const map = { currentPrice: d.currentPrice, weekHigh52: d.weekHigh52, weekLow52: d.weekLow52, marketCap: d.marketCap, eps: d.eps }
      Object.entries(map).forEach(([k, v]) => { if (v) { u[k] = v; f[k] = true } })
      if (d.sector) u.sector = d.sector
      setP(x => ({ ...x, ...u }))
      setFilled(f)
    } catch (e) {
      setErr(`Fetch failed: ${e.message}`)
    } finally {
      setFetching(false)
    }
  }

  const run = () => {
    if (!p.ticker.trim()) return
    setRunning(true); setResult(null); setErr(null)
    setTimeout(() => {
      setResult(analyze(p, live))
      setRunning(false)
    }, 900)
  }

  const a = result

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── HEADER ── */}
      <header style={{
        background: 'linear-gradient(160deg,#080A0C 0%,#0D1420 55%,#080A0C 100%)',
        borderBottom: '2px solid var(--gold)',
        padding: '16px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg,transparent,transparent 60px,rgba(201,168,76,0.018) 60px,rgba(201,168,76,0.018) 61px)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <span style={{ fontSize: 28, filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.5))' }}>🪚</span>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 34, letterSpacing: 6, color: 'var(--gold)', lineHeight: 1, textShadow: '0 0 20px rgba(201,168,76,0.25)' }}>CHARTSAW</div>
            <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--muted)' }}>
              Cutting through noise · <span style={{ color: 'var(--gold)', opacity: 0.8 }}>Soloway PPT Methodology</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: 'var(--gold)', padding: '3px 10px' }}>
            Price · Pattern · Time
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--green)' }}>
            <span style={{ width: 6, height: 6, background: 'var(--green)', borderRadius: '50%', display: 'inline-block', animation: 'blink 1.4s ease-in-out infinite' }} />
            {live ? `${live.companyName} loaded` : 'Finnhub Live Data Ready'}
          </div>
        </div>
      </header>

      {/* ── INPUT PANEL ── */}
      <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', padding: '18px 28px' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 4, color: 'var(--gold)', marginBottom: 12 }}>STOCK ANALYSIS</div>

        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: 10, alignItems: 'end' }}>
          {/* Ticker */}
          <Field label="Ticker Symbol *">
            <input
              value={p.ticker}
              onChange={e => { up('ticker', e.target.value.toUpperCase()); setLive(null); setFilled({}); }}
              placeholder="e.g. HYMC"
              maxLength={10}
              onKeyDown={e => e.key === 'Enter' && loadLive()}
              style={inputStyle()}
            />
          </Field>

          {/* Price trio */}
          <Field label="Current Price · 52W High · 52W Low">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[['currentPrice','Price'],['weekHigh52','52W High'],['weekLow52','52W Low']].map(([k, ph]) => (
                <input key={k} value={p[k]} onChange={e => up(k, e.target.value)}
                  placeholder={ph} style={inputStyle(filled[k])} />
              ))}
            </div>
          </Field>

          {/* Buttons */}
          <Field label=" ">
            <div style={{ display: 'flex', gap: 8, height: 38 }}>
              <button onClick={loadLive} disabled={fetching || !p.ticker.trim()} style={fetchBtnStyle(fetching || !p.ticker.trim())}>
                {fetching ? <><Spin color="var(--gold)" />FETCHING…</> : '⬇ LIVE DATA'}
              </button>
              <button onClick={run} disabled={running || !p.ticker.trim()} style={runBtnStyle(running || !p.ticker.trim())}>
                {running ? <><Spin color="#000" />…</> : '▶ ANALYZE'}
              </button>
            </div>
          </Field>
        </div>

        {/* Live strip */}
        {live && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 11, padding: '9px 13px', background: 'rgba(46,204,113,0.04)', border: '1px solid rgba(46,204,113,0.2)', flexWrap: 'wrap' }}>
            {[
              ['Company', <span style={{ fontSize: 10, color: '#8090A0', fontStyle: 'italic' }}>{live.companyName}</span>],
              ['Price', <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>${live.currentPrice}</span>],
              ['Change', <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 600, color: parseFloat(live.change) >= 0 ? 'var(--green)' : 'var(--red)' }}>{parseFloat(live.change) >= 0 ? '+' : ''}{live.change} ({parseFloat(live.changePct) >= 0 ? '+' : ''}{live.changePct}%)</span>],
              ['52W High', <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>${live.weekHigh52}</span>],
              ['52W Low',  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>${live.weekLow52}</span>],
              live.beta     && ['Beta',     <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 600 }}>{live.beta}</span>],
              live.peRatio  && ['P/E',      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 600 }}>{live.peRatio}</span>],
              live.weekReturn52 && ['52W Return', <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 600, color: parseFloat(live.weekReturn52) >= 0 ? 'var(--green)' : 'var(--red)' }}>{live.weekReturn52}%</span>],
            ].filter(Boolean).map(([label, val], i) => (
              <div key={label} style={{ padding: '0 14px', borderRight: '1px solid var(--border)', ...(i === 0 ? { paddingLeft: 0 } : {}) }}>
                <div style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</div>
                {val}
              </div>
            ))}
            <span style={{ fontSize: 8, background: 'rgba(46,204,113,0.15)', color: 'var(--green)', border: '1px solid rgba(46,204,113,0.3)', padding: '2px 7px', letterSpacing: 2, textTransform: 'uppercase', fontFamily: "'IBM Plex Mono',monospace", marginLeft: 12 }}>● LIVE</span>
          </div>
        )}

        {/* Advanced params toggle */}
        <button onClick={() => setAdv(x => !x)} style={{ marginTop: 10, background: 'none', border: 'none', color: 'var(--muted)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'IBM Plex Mono',monospace", padding: 0 }}>
          {adv ? '▲ HIDE' : '▼ SHOW'} ADVANCED PARAMETERS
        </button>

        {adv && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9, marginTop: 11, paddingTop: 13, borderTop: '1px solid var(--border)' }}>
            {[
              ['Sector','sector','sel',['Technology','Financials','Healthcare','Energy','Industrials','Materials','Consumer Discretionary','Consumer Staples','Utilities','Real Estate','Communication Services','Mining/Metals']],
              ['MA Posture','maType','sel',[['bullish','Bullish (above 20/50/200)'],['bearish','Bearish (below 20/50)'],['mixed','Mixed (above 200, below 50)'],['unknown','Unknown']]],
              ['Volume','volume','sel',[['confirming','Confirming Price'],['declining','Declining on Bounces'],['rising','Rising with Trend'],['diverging','Diverging']]],
              ['Trendline','trend','sel',[['intact','Uptrend Intact'],['broken','Uptrend Broken'],['downtrend','In Downtrend'],['basing','Basing / Consolidating']]],
              ['Market Cap','marketCap','txt','e.g. $3.5B'],
              ['EPS (TTM)','eps','txt','e.g. -0.94'],
              ['Cash','cash','txt','e.g. $189M'],
              ['Debt','debt','txt','e.g. None'],
            ].map(([label, key, type, opts]) => (
              <Field key={key} label={label}>
                {type === 'sel'
                  ? <select value={p[key]} onChange={e => up(key, e.target.value)} style={inputStyle()}>
                      {opts.map(o => Array.isArray(o)
                        ? <option key={o[0]} value={o[0]}>{o[1]}</option>
                        : <option key={o}>{o}</option>)}
                    </select>
                  : <input value={p[key]} onChange={e => up(key, e.target.value)} placeholder={opts} style={inputStyle(filled[key])} />}
              </Field>
            ))}
            <Field label="Catalysts / Context Notes" style={{ gridColumn: 'span 3' }}>
              <input value={p.catalysts} onChange={e => up('catalysts', e.target.value)}
                placeholder="e.g. GDXJ inclusion, earnings beat, Fed meeting, insider buying, PEA due Q2..."
                style={inputStyle()} />
            </Field>
            <Field label="Timeframe">
              <select value={p.timeframe} onChange={e => up('timeframe', e.target.value)} style={inputStyle()}>
                <option value="day">Day Trade</option>
                <option value="swing">Swing Trade</option>
                <option value="position">Position Trade</option>
                <option value="investor">Long-Term Investor</option>
              </select>
            </Field>
          </div>
        )}
      </div>

      {/* Error */}
      {err && (
        <div style={{ margin: '12px 28px', background: 'rgba(231,76,60,0.07)', border: '1px solid rgba(231,76,60,0.3)', padding: '12px 14px', fontSize: 12, color: 'var(--red)', lineHeight: 1.6 }}>
          ⚠ {err}
        </div>
      )}

      {/* Loading */}
      {running && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 28px', gap: 14 }}>
          <BigSpin />
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 4, color: 'var(--gold)', animation: 'pulse 1.4s ease-in-out infinite' }}>CHARTSAW IS CUTTING…</div>
          <div style={{ fontSize: 9, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>Fibonacci · S/R · Volume · Patterns · Confluence · Sentiment</div>
        </div>
      )}

      {/* Empty state */}
      {!running && !a && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 28px', gap: 14, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 64, letterSpacing: 10, color: 'rgba(201,168,76,0.08)' }}>🪚 CHARTSAW</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 340, lineHeight: 1.8 }}>
            Enter any ticker, load live market data, then run a full Gareth Soloway PPT analysis — Fibonacci levels, support/resistance, patterns, trade setups, and more.
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 }}>
            {[['1','Enter Ticker'],['2','⬇ Load Live Data'],['3','▶ Analyze']].map(([n, t]) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)' }}>
                <div style={{ width: 20, height: 20, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: 'var(--gold)', fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</div>
                {t}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RESULTS ── */}
      {!running && a && (
        <div style={{ padding: '22px 28px' }}>

          {/* Ticker header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <div>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 56, color: 'var(--gold)', letterSpacing: 5, lineHeight: 1 }}>{a.ticker}</span>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 26, fontWeight: 600, marginLeft: 12, verticalAlign: 'middle' }}>{a.currentPrice}</span>
              {a.changePct !== '0' && (
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, marginLeft: 8, verticalAlign: 'middle', color: parseFloat(a.changePct) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {parseFloat(a.changePct) >= 0 ? '▲' : '▼'} {Math.abs(parseFloat(a.changePct))}%
                </span>
              )}
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 3 }}>{a.companyName} · {a.sector}</div>
            </div>
            <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: 1, textAlign: 'right' }}>
              CHARTSAW · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          {/* Verdict bar */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderTop: '2px solid var(--gold)', padding: '13px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            {[['Short-Term', a.verdicts.shortTerm],['Medium-Term', a.verdicts.mediumTerm],['Long-Term', a.verdicts.longTerm],['Overall Call', a.verdicts.overall]].map(([label, val], i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <div style={{ width: 1, height: 40, background: 'var(--border)' }} />}
                <div style={{ padding: i === 0 ? '0 20px 0 0' : '0 20px' }}>
                  <div style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</div>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 19, letterSpacing: 2, marginTop: 2, color: vc(val) }}>{val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          {a.stats.length > 0 && <>
            <SecTitle>KEY STATISTICS</SecTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 8 }}>
              {a.stats.map((s, i) => (
                <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: 11 }}>
                  <div style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 14, fontWeight: 600, color: sc(s.color) }}>{s.value}</div>
                  {s.note && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, fontStyle: 'italic' }}>{s.note}</div>}
                </div>
              ))}
            </div>
          </>}

          {/* Signal table */}
          <SecTitle>PPT METHODOLOGY — SIGNAL BREAKDOWN</SecTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4 }}>
            <thead>
              <tr>
                {[['Tool','17%'],['Signal','11%'],['Reading','38%'],['Implication','34%']].map(([h, w]) => (
                  <th key={h} style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', padding: '7px 10px', textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.015)', width: w }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {a.signals.map((s, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.008)' }}>
                  <td style={tdStyle()}>
                    <strong style={{ fontSize: 11 }}>{s.tool}</strong>
                    {s.sub && <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>{s.sub}</div>}
                  </td>
                  <td style={tdStyle()}><Badge type={bc(s.sig)}>{s.sig}</Badge></td>
                  <td style={tdStyle()}>{s.read}</td>
                  <td style={{ ...tdStyle(), color: 'var(--muted)' }}>{s.imp}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Price levels */}
          <SecTitle>KEY PRICE LEVELS</SecTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['▼ DOWNSIDE / SUPPORT TARGETS', a.down, 'var(--red)', '#E74C3C'],
              ['▲ UPSIDE / RESISTANCE TARGETS', a.up2,  'var(--green)', '#2ECC71'],
            ].map(([title, levels, hdrColor, priceColor]) => (
              <div key={title} style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div style={{ padding: '7px 12px', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', borderBottom: '1px solid var(--border)', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600, color: hdrColor }}>{title}</div>
                {levels.map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: i < levels.length - 1 ? '1px solid rgba(26,32,48,0.4)' : 'none' }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', minWidth: 148 }}>{l.type}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 600, minWidth: 64, textAlign: 'right', color: priceColor }}>{l.price}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', flex: 1, paddingLeft: 12, textAlign: 'right' }}>{l.note}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Bull / Bear */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              ['BULL THESIS', a.bull, 'var(--gold)', 'thc'],
              ['BEAR RISKS',  a.bear, 'var(--red)',  'rkc'],
            ].map(([title, items, color]) => (
              <div key={title}>
                <SecTitle>{title}</SecTitle>
                {items.map((item, i) => (
                  <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: `3px solid ${color}`, padding: '11px 14px', marginBottom: 8 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, fontWeight: 600, color, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 11, lineHeight: 1.7 }}>{item.body}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Trade setups */}
          <SecTitle>SOLOWAY-STYLE TRADE SETUPS</SecTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['▲ BULL SETUP — Swing Long',    a.bullSetup, 'var(--green)'],
              ['▼ BEAR SETUP — Short / Avoid', a.bearSetup, 'var(--red)'],
            ].map(([title, setup, color]) => (
              <div key={title} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: 13 }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 2, color, marginBottom: 9, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>{title}</div>
                {Object.entries(setup).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11, borderBottom: '1px solid rgba(26,32,48,0.3)' }}>
                    <span style={{ color: 'var(--muted)' }}>{k}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600, textAlign: 'right', maxWidth: '58%', wordBreak: 'break-word' }}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Final verdict */}
          <SecTitle>OVERALL VERDICT</SecTitle>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: '4px solid var(--gold)', padding: '15px 18px', marginTop: 5 }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 600, color: 'var(--gold)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>🎯 {a.call}</div>
            <div style={{ fontSize: 12, lineHeight: 1.85 }}>{a.body}</div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 32, padding: '12px 14px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 4, color: 'rgba(201,168,76,0.3)' }}>🪚 CHARTSAW</div>
            <div style={{ fontSize: 9, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 700 }}>
              CHARTSAW applies Gareth Soloway's publicly documented PPT Methodology for educational and informational purposes only. This does NOT represent Gareth Soloway's actual views. Not financial advice. Always conduct your own due diligence. Trading involves substantial risk of loss.
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.15} }
        @keyframes pulse { 0%,100%{opacity:.25} 50%{opacity:1} }
        @keyframes spin  { to{transform:rotate(360deg)} }
        input,select { appearance: none; -webkit-appearance: none; }
        @media (max-width: 700px) {
          header { padding: 14px 16px !important; }
          header h1 { font-size: 26px !important; }
          .inp-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

// ── HELPERS ──────────────────────────────────────────────────

function Field({ label, children, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      <label style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</label>
      {children}
    </div>
  )
}

function SecTitle({ children }) {
  return (
    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 4, color: 'var(--gold)', borderLeft: '3px solid var(--gold)', paddingLeft: 10, margin: '24px 0 12px' }}>
      {children}
    </div>
  )
}

function Badge({ type, children }) {
  const styles = {
    'badge-red':    { background: 'rgba(231,76,60,0.14)',  color: '#E74C3C', border: '1px solid rgba(231,76,60,0.3)' },
    'badge-green':  { background: 'rgba(46,204,113,0.14)', color: '#2ECC71', border: '1px solid rgba(46,204,113,0.3)' },
    'badge-yellow': { background: 'rgba(244,208,63,0.14)', color: '#F4D03F', border: '1px solid rgba(244,208,63,0.3)' },
    'badge-gold':   { background: 'rgba(201,168,76,0.14)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' },
  }
  return (
    <span style={{ display: 'inline-block', padding: '2px 7px', fontSize: 8, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: "'IBM Plex Mono',monospace", whiteSpace: 'nowrap', ...styles[type] }}>
      {children}
    </span>
  )
}

function Spin({ color }) {
  return <span style={{ width: 12, height: 12, border: `2px solid rgba(0,0,0,0.2)`, borderTopColor: color, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', marginRight: 6 }} />
}

function BigSpin() {
  return <div style={{ width: 42, height: 42, border: '2px solid var(--border)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.85s linear infinite' }} />
}

function inputStyle(live = false) {
  return {
    background: live ? 'rgba(46,204,113,0.03)' : 'var(--bg)',
    border: live ? '1px solid rgba(46,204,113,0.5)' : '1px solid var(--border)',
    color: 'var(--text)',
    fontFamily: "'IBM Plex Mono',monospace",
    fontSize: 13,
    padding: '8px 10px',
    outline: 'none',
    width: '100%',
  }
}

function fetchBtnStyle(disabled) {
  return {
    flex: 1, background: 'transparent', color: 'var(--gold)',
    border: '1px solid rgba(201,168,76,0.35)',
    fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: 2,
    padding: '0 14px', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.35 : 1, transition: 'all .2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
    whiteSpace: 'nowrap',
  }
}

function runBtnStyle(disabled) {
  return {
    flex: 1.6, background: 'var(--gold)', color: '#000', border: 'none',
    fontFamily: "'Bebas Neue',sans-serif", fontSize: 15, letterSpacing: 3,
    padding: '0 18px', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1, transition: 'background .2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    whiteSpace: 'nowrap',
  }
}

function tdStyle() {
  return { padding: '10px', borderBottom: '1px solid rgba(26,32,48,0.5)', fontSize: 11, verticalAlign: 'top', lineHeight: 1.55 }
}
