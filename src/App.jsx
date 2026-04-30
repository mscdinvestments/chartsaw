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

function vc(t) {
  t = t || ''
  const u = t.toUpperCase()
  if (/BULL|BUY|STRONG/.test(u))            return '#2ECC71'
  if (/BEAR|SELL|SHORT|AVOID/.test(u))      return '#FF6B6B'
  if (/WAIT|NEUTRAL|WATCH|CAUTION/.test(u)) return '#F4D03F'
  return '#C9A84C'
}

function bc(t) {
  t = t || ''
  const u = t.toUpperCase()
  if (/BULL|BUY|INTACT|CONFIRM|STRONG/.test(u))       return 'bg'
  if (/BEAR|SELL|BROKEN|ALERT|DIVER|CAUTION/.test(u)) return 'br'
  if (/ZONE|CONFLUENCE/.test(u))                       return 'bo'
  return 'by'
}

function sc(c) {
  if (c === 'green')  return '#2ECC71'
  if (c === 'red')    return '#FF6B6B'
  if (c === 'gold')   return '#C9A84C'
  if (c === 'yellow') return '#F4D03F'
  return '#E8EEF4'
}

function Field({ label, children, style }) {
  return (
    <div className="field" style={style || {}}>
      <label>{label}</label>
      {children}
    </div>
  )
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;600&display=swap');
  :root{--gold:#C9A84C;--gold-light:#E8C96A;--green:#2ECC71;--red:#FF6B6B;--yellow:#F4D03F;--bg:#0C0F14;--bg2:#131820;--card:#161D26;--border:#243040;--border2:#2E3D50;--text:#E8EEF4;--text2:#A8B8C8;--muted:#607080;--radius:6px;}
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{background:var(--bg);color:var(--text);font-family:'IBM Plex Sans',sans-serif;font-size:15px;line-height:1.6;-webkit-font-smoothing:antialiased;}
  input,select,button{font-family:inherit;}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
  @keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

  .hdr{background:linear-gradient(135deg,#0C0F14 0%,#111820 60%,#0C0F14 100%);border-bottom:2px solid var(--gold);padding:18px 32px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:0 4px 24px rgba(0,0,0,0.4);}
  .hdr-logo{display:flex;align-items:center;gap:14px;}
  .hdr-icon{font-size:28px;filter:drop-shadow(0 0 10px rgba(201,168,76,0.6));}
  .hdr-name{font-family:'Bebas Neue',sans-serif;font-size:32px;letter-spacing:6px;color:var(--gold);line-height:1;}
  .hdr-sub{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-top:2px;}
  .hdr-sub span{color:var(--gold);opacity:.9;}
  .hdr-right{display:flex;flex-direction:column;align-items:flex-end;gap:6px;}
  .hdr-badge{font-size:10px;letter-spacing:2px;text-transform:uppercase;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.35);color:var(--gold);padding:4px 12px;border-radius:3px;}
  .live-pill{display:flex;align-items:center;gap:6px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--green);}
  .dot{width:7px;height:7px;background:var(--green);border-radius:50%;animation:blink 1.4s ease-in-out infinite;box-shadow:0 0 6px var(--green);}

  .inp{background:var(--card);border-bottom:1px solid var(--border);padding:24px 32px;}
  .inp-title{font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:4px;color:var(--gold);margin-bottom:16px;}
  .inp-main{display:grid;grid-template-columns:180px 1fr;gap:12px;margin-bottom:12px;}
  .inp-prices{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;}
  .inp-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:4px;}
  .field{display:flex;flex-direction:column;gap:6px;}
  .field label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--text2);font-weight:600;}
  input,select{background:var(--bg2);border:1px solid var(--border2);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:14px;padding:10px 12px;outline:none;transition:all .2s;width:100%;border-radius:var(--radius);-webkit-appearance:none;}
  input:focus,select:focus{border-color:var(--gold);background:rgba(201,168,76,0.04);box-shadow:0 0 0 3px rgba(201,168,76,0.1);}
  input::placeholder{color:var(--muted);}
  input.live{border-color:rgba(46,204,113,0.5);background:rgba(46,204,113,0.04);}
  select option{background:var(--bg2);}

  .fbtn{background:transparent;color:var(--gold);border:1px solid rgba(201,168,76,0.4);font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:2px;padding:12px 20px;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:var(--radius);width:100%;}
  .fbtn:hover:not(:disabled){background:rgba(201,168,76,0.12);border-color:var(--gold);}
  .fbtn:disabled{opacity:.35;cursor:not-allowed;}
  .rbtn{background:var(--gold);color:#000;border:none;font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:3px;padding:12px 20px;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:var(--radius);width:100%;font-weight:700;}
  .rbtn:hover:not(:disabled){background:var(--gold-light);transform:translateY(-1px);box-shadow:0 4px 16px rgba(201,168,76,0.3);}
  .rbtn:disabled{opacity:.4;cursor:not-allowed;transform:none;}

  .lstrip{display:flex;align-items:center;margin-top:14px;padding:12px 16px;background:rgba(46,204,113,0.05);border:1px solid rgba(46,204,113,0.2);border-radius:var(--radius);flex-wrap:wrap;overflow-x:auto;}
  .lsi{padding:0 16px;border-right:1px solid var(--border);flex-shrink:0;}
  .lsi:first-child{padding-left:0;} .lsi:last-child{border-right:none;}
  .lsl{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:2px;}
  .lsv{font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:600;}
  .gv{color:var(--green);} .rv{color:var(--red);} .ov{color:var(--gold);}
  .lname{font-size:12px;color:var(--text2);font-style:italic;}
  .ltag{font-size:9px;background:rgba(46,204,113,0.15);color:var(--green);border:1px solid rgba(46,204,113,0.35);padding:3px 9px;letter-spacing:2px;text-transform:uppercase;font-family:'IBM Plex Mono',monospace;margin-left:14px;border-radius:3px;flex-shrink:0;}

  .advbtn{margin-top:14px;background:none;border:none;color:var(--text2);font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;font-family:'IBM Plex Mono',monospace;padding:0;display:flex;align-items:center;gap:6px;}
  .advbtn:hover{color:var(--gold);}
  .advgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:14px;padding-top:16px;border-top:1px solid var(--border);}
  .sp3{grid-column:span 3;}

  .ms{width:14px;height:14px;border:2px solid rgba(201,168,76,.25);border-top-color:var(--gold);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;}
  .gs{width:14px;height:14px;border:2px solid rgba(0,0,0,.25);border-top-color:#000;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;}
  .bs{width:48px;height:48px;border:3px solid var(--border);border-top-color:var(--gold);border-radius:50%;animation:spin .85s linear infinite;}
  .loading{display:flex;flex-direction:column;align-items:center;padding:100px 32px;gap:18px;}
  .ld1{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:5px;color:var(--gold);animation:pulse 1.4s ease-in-out infinite;}
  .ld2{font-size:11px;letter-spacing:3px;color:var(--muted);text-transform:uppercase;}
  .err{margin:16px 32px;background:rgba(255,107,107,0.08);border:1px solid rgba(255,107,107,0.3);padding:14px 16px;font-size:13px;color:var(--red);line-height:1.6;border-radius:var(--radius);}

  .empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:100px 32px;gap:16px;text-align:center;}
  .empty-logo{font-family:'Bebas Neue',sans-serif;font-size:72px;letter-spacing:10px;color:rgba(201,168,76,0.07);}
  .empty-sub{font-size:14px;color:var(--text2);max-width:380px;line-height:1.8;}
  .steps{display:flex;gap:24px;flex-wrap:wrap;justify-content:center;margin-top:8px;}
  .step{display:flex;align-items:center;gap:8px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);}
  .snum{width:24px;height:24px;background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);color:var(--gold);font-family:'Bebas Neue',sans-serif;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:4px;}

  .res{padding:28px 32px;animation:fadeIn 0.4s ease;}
  .tkr-row{display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid var(--border);}
  .t-sym{font-family:'Bebas Neue',sans-serif;font-size:64px;color:var(--gold);letter-spacing:5px;line-height:1;}
  .t-price{font-family:'IBM Plex Mono',monospace;font-size:30px;font-weight:600;margin-left:14px;vertical-align:middle;}
  .t-chg{font-family:'IBM Plex Mono',monospace;font-size:16px;margin-left:10px;vertical-align:middle;}
  .t-name{font-size:13px;color:var(--text2);letter-spacing:1px;text-transform:uppercase;margin-top:4px;}
  .t-date{font-size:11px;color:var(--muted);letter-spacing:1px;text-align:right;}

  .vbar{background:var(--card);border:1px solid var(--border);border-top:3px solid var(--gold);padding:16px 24px;margin-bottom:24px;display:flex;align-items:center;flex-wrap:wrap;border-radius:var(--radius);box-shadow:0 2px 12px rgba(0,0,0,0.3);}
  .vi{padding:0 24px;} .vi:first-child{padding-left:0;}
  .vl{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:3px;}
  .vv{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;}
  .vd{width:1px;height:44px;background:var(--border);}

  .sec{font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:4px;color:var(--gold);border-left:3px solid var(--gold);padding-left:12px;margin:28px 0 14px;}

  .sg{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:10px;}
  .sc-card{background:var(--card);border:1px solid var(--border);padding:14px 16px;border-radius:var(--radius);}
  .sc-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:6px;}
  .sc-val{font-family:'IBM Plex Mono',monospace;font-size:18px;font-weight:600;}
  .sc-note{font-size:11px;color:var(--text2);margin-top:4px;font-style:italic;}

  .tbl{width:100%;border-collapse:collapse;}
  .tbl th{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);padding:10px 12px;text-align:left;border-bottom:2px solid var(--border);background:rgba(255,255,255,0.02);}
  .tbl td{padding:12px;border-bottom:1px solid rgba(36,48,64,0.6);font-size:13px;vertical-align:top;line-height:1.6;color:var(--text);}
  .tbl tr:last-child td{border-bottom:none;}
  .tbl tr:hover td{background:rgba(255,255,255,0.025);}
  .tbl-tool{font-size:13px;font-weight:600;color:var(--text);}
  .tbl-sub{font-size:10px;color:var(--muted);margin-top:3px;}
  .tbl-imp{color:var(--text2) !important;font-size:12px;}

  .badge{display:inline-block;padding:3px 9px;font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;font-family:'IBM Plex Mono',monospace;white-space:nowrap;border-radius:3px;}
  .br{background:rgba(255,107,107,0.15);color:var(--red);border:1px solid rgba(255,107,107,0.35);}
  .bg{background:rgba(46,204,113,0.15);color:var(--green);border:1px solid rgba(46,204,113,0.35);}
  .by{background:rgba(244,208,63,0.15);color:var(--yellow);border:1px solid rgba(244,208,63,0.35);}
  .bo{background:rgba(201,168,76,0.15);color:var(--gold);border:1px solid rgba(201,168,76,0.35);}

  .lvlg{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .lb{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;}
  .lbh{padding:10px 14px;font-size:10px;letter-spacing:2px;text-transform:uppercase;border-bottom:1px solid var(--border);font-family:'IBM Plex Mono',monospace;font-weight:600;}
  .lhr{color:var(--red);background:rgba(255,107,107,0.06);}
  .lhg{color:var(--green);background:rgba(46,204,113,0.06);}
  .lr{display:flex;align-items:center;padding:10px 14px;border-bottom:1px solid rgba(36,48,64,0.4);}
  .lr:last-child{border-bottom:none;}
  .lrt{font-size:12px;color:var(--text2);min-width:160px;}
  .lrp{font-family:'IBM Plex Mono',monospace;font-size:15px;font-weight:600;min-width:70px;text-align:right;}
  .lrn{font-size:11px;color:var(--muted);flex:1;padding-left:14px;text-align:right;}

  .tbg{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
  .thc{background:var(--card);border:1px solid var(--border);border-left:4px solid var(--gold);padding:14px 18px;margin-bottom:10px;border-radius:0 var(--radius) var(--radius) 0;}
  .rkc{background:var(--card);border:1px solid var(--border);border-left:4px solid var(--red);padding:14px 18px;margin-bottom:10px;border-radius:0 var(--radius) var(--radius) 0;}
  .tct{font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:var(--gold);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;}
  .rct{font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:var(--red);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;}
  .tcb{font-size:13px;line-height:1.75;color:var(--text2);}

  .stg{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .stc{background:var(--card);border:1px solid var(--border);padding:16px;border-radius:var(--radius);}
  .sth{font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:2px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border);}
  .shg{color:var(--green);} .shr{color:var(--red);}
  .srow{display:flex;justify-content:space-between;align-items:baseline;padding:6px 0;font-size:12px;border-bottom:1px solid rgba(36,48,64,0.35);gap:8px;}
  .srow:last-child{border-bottom:none;}
  .sk{color:var(--text2);flex-shrink:0;}
  .sv{font-family:'IBM Plex Mono',monospace;font-weight:600;text-align:right;color:var(--text);word-break:break-word;}

  .fv{background:var(--card);border:1px solid var(--border);border-left:5px solid var(--gold);padding:20px 24px;border-radius:0 var(--radius) var(--radius) 0;}
  .fvt{font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;color:var(--gold);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;line-height:1.5;}
  .fvb{font-size:14px;line-height:1.9;color:var(--text2);}

  .footer{margin-top:40px;padding:16px 20px;background:rgba(255,255,255,0.01);border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;border-radius:var(--radius);}
  .footer-brand{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:4px;color:rgba(201,168,76,0.25);}
  .footer-disc{font-size:10px;color:var(--muted);line-height:1.6;max-width:680px;}

  @media(max-width:768px){
    .hdr{padding:14px 16px;}
    .hdr-name{font-size:24px;}
    .hdr-sub,.hdr-badge{display:none;}
    .inp{padding:16px;}
    .inp-main{grid-template-columns:1fr;}
    .inp-prices{grid-template-columns:1fr;gap:8px;}
    .inp-actions{grid-template-columns:1fr;gap:8px;}
    .fbtn,.rbtn{padding:16px;font-size:17px;}
    .lstrip{flex-wrap:wrap;}
    .lsi{padding:6px 12px;border-right:none;border-bottom:1px solid var(--border);width:50%;}
    .ltag{margin:8px 0 0;width:100%;text-align:center;}
    .advgrid{grid-template-columns:1fr 1fr;}
    .sp3{grid-column:span 2;}
    .res{padding:16px;}
    .tkr-row{flex-direction:column;align-items:flex-start;}
    .t-sym{font-size:48px;}
    .t-price{font-size:22px;margin-left:0;display:block;margin-top:4px;}
    .t-chg{display:block;margin-left:0;}
    .vbar{padding:12px 14px;}
    .vi{padding:8px 10px;}
    .vd{display:none;}
    .vv{font-size:17px;}
    .sg{grid-template-columns:1fr 1fr;}
    .tbl thead{display:none;}
    .tbl tbody{display:block;}
    .tbl tr{display:block;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:10px;padding:14px;}
    .tbl td{display:block;padding:6px 0;border-bottom:none;}
    .tbl td:first-child{border-bottom:1px solid var(--border);padding-bottom:10px;margin-bottom:8px;}
    .lvlg,.tbg,.stg{grid-template-columns:1fr;}
    .lrt{min-width:110px;}
    .footer{flex-direction:column;}
    .steps{flex-direction:column;align-items:center;gap:12px;}
  }
`

export default function App() {
  const [p, setP] = useState(DEFS)
  const [adv, setAdv] = useState(false)
  const [live, setLive] = useState(null)
  const [filled, setFilled] = useState({})
  const [fetching, setFetching] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [err, setErr] = useState(null)

  const up = (k, v) => setP(x => ({ ...x, [k]: v }))

  const loadLive = async () => {
    if (!p.ticker.trim()) { setErr('Enter a ticker first.'); return }
    setFetching(true); setErr(null); setLive(null); setFilled({}); setResult(null)
    try {
      const d = await fetchLiveData(p.ticker)
      setLive(d)
      const u = {}
      const f = {}
      const map = { currentPrice: d.currentPrice, weekHigh52: d.weekHigh52, weekLow52: d.weekLow52, marketCap: d.marketCap, eps: d.eps }
      Object.entries(map).forEach(([k, v]) => { if (v) { u[k] = v; f[k] = true } })
      if (d.sector) u.sector = d.sector
      setP(x => ({ ...x, ...u }))
      setFilled(f)
    } catch (e) {
      setErr('Fetch failed: ' + e.message)
    } finally {
      setFetching(false)
    }
  }

  const run = () => {
    if (!p.ticker.trim()) return
    setRunning(true); setResult(null); setErr(null)
    setTimeout(() => { setResult(analyze(p, live)); setRunning(false) }, 900)
  }

  const a = result
  const chgPos = a && parseFloat(a.changePct) >= 0

  return (
    <>
      <style>{CSS}</style>
      <div>

        <header className="hdr">
          <div className="hdr-logo">
            <span className="hdr-icon">🪚</span>
            <div>
              <div className="hdr-name">CHARTSAW</div>
              <div className="hdr-sub">Cutting through noise &middot; <span>Soloway PPT Methodology</span></div>
            </div>
          </div>
          <div className="hdr-right">
            <div className="hdr-badge">Price &middot; Pattern &middot; Time</div>
            <div className="live-pill">
              <span className="dot" />
              {live ? (live.companyName + ' loaded') : 'Finnhub Live Data Ready'}
            </div>
          </div>
        </header>

        <div className="inp">
          <div className="inp-title">STOCK ANALYSIS</div>
          <div className="inp-main">
            <Field label="Ticker Symbol *">
              <input
                value={p.ticker}
                onChange={e => { up('ticker', e.target.value.toUpperCase()); setLive(null); setFilled({}) }}
                placeholder="e.g. HYMC"
                maxLength={10}
                onKeyDown={e => { if (e.key === 'Enter') loadLive() }}
              />
            </Field>
            <Field label="Current Price · 52-Week High · 52-Week Low">
              <div className="inp-prices">
                <input className={filled.currentPrice ? 'live' : ''} value={p.currentPrice} onChange={e => up('currentPrice', e.target.value)} placeholder="Current Price" />
                <input className={filled.weekHigh52 ? 'live' : ''} value={p.weekHigh52} onChange={e => up('weekHigh52', e.target.value)} placeholder="52W High" />
                <input className={filled.weekLow52 ? 'live' : ''} value={p.weekLow52} onChange={e => up('weekLow52', e.target.value)} placeholder="52W Low" />
              </div>
            </Field>
          </div>
          <div className="inp-actions">
            <button className="fbtn" onClick={loadLive} disabled={fetching || !p.ticker.trim()}>
              {fetching ? <><span className="ms" /> FETCHING...</> : '⬇  LOAD LIVE DATA'}
            </button>
            <button className="rbtn" onClick={run} disabled={running || !p.ticker.trim()}>
              {running ? <><span className="gs" /> ANALYZING...</> : '▶  RUN PPT ANALYSIS'}
            </button>
          </div>

          {live && (
            <div className="lstrip">
              <div className="lsi"><div className="lsl">Company</div><span className="lname">{live.companyName}</span></div>
              <div className="lsi"><div className="lsl">Price</div><span className="lsv ov">${live.currentPrice}</span></div>
              <div className="lsi">
                <div className="lsl">Change</div>
                <span className={'lsv ' + (parseFloat(live.change) >= 0 ? 'gv' : 'rv')}>
                  {parseFloat(live.change) >= 0 ? '+' : ''}{live.change} ({parseFloat(live.changePct) >= 0 ? '+' : ''}{live.changePct}%)
                </span>
              </div>
              <div className="lsi"><div className="lsl">52W High</div><span className="lsv ov">${live.weekHigh52}</span></div>
              <div className="lsi"><div className="lsl">52W Low</div><span className="lsv ov">${live.weekLow52}</span></div>
              {live.beta && <div className="lsi"><div className="lsl">Beta</div><span className="lsv">{live.beta}</span></div>}
              {live.peRatio && <div className="lsi"><div className="lsl">P/E</div><span className="lsv">{live.peRatio}</span></div>}
              {live.weekReturn52 && (
                <div className="lsi">
                  <div className="lsl">52W Return</div>
                  <span className={'lsv ' + (parseFloat(live.weekReturn52) >= 0 ? 'gv' : 'rv')}>{live.weekReturn52}%</span>
                </div>
              )}
              <span className="ltag">● LIVE</span>
            </div>
          )}

          <button className="advbtn" onClick={() => setAdv(x => !x)}>
            {adv ? '▲ HIDE' : '▼ SHOW'} ADVANCED PARAMETERS
          </button>

          {adv && (
            <div className="advgrid">
              <Field label="Sector">
                <select value={p.sector} onChange={e => up('sector', e.target.value)}>
                  {['Technology','Financials','Healthcare','Energy','Industrials','Materials','Consumer Discretionary','Consumer Staples','Utilities','Real Estate','Communication Services','Mining/Metals'].map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="MA Posture">
                <select value={p.maType} onChange={e => up('maType', e.target.value)}>
                  <option value="bullish">Bullish (above 20/50/200)</option>
                  <option value="bearish">Bearish (below 20/50)</option>
                  <option value="mixed">Mixed (above 200, below 50)</option>
                  <option value="unknown">Unknown</option>
                </select>
              </Field>
              <Field label="Volume">
                <select value={p.volume} onChange={e => up('volume', e.target.value)}>
                  <option value="confirming">Confirming Price</option>
                  <option value="declining">Declining on Bounces</option>
                  <option value="rising">Rising with Trend</option>
                  <option value="diverging">Diverging</option>
                </select>
              </Field>
              <Field label="Trendline">
                <select value={p.trend} onChange={e => up('trend', e.target.value)}>
                  <option value="intact">Uptrend Intact</option>
                  <option value="broken">Uptrend Broken</option>
                  <option value="downtrend">In Downtrend</option>
                  <option value="basing">Basing / Consolidating</option>
                </select>
              </Field>
              <Field label="Market Cap">
                <input className={filled.marketCap ? 'live' : ''} value={p.marketCap} onChange={e => up('marketCap', e.target.value)} placeholder="e.g. $3.5B" />
              </Field>
              <Field label="EPS (TTM)">
                <input className={filled.eps ? 'live' : ''} value={p.eps} onChange={e => up('eps', e.target.value)} placeholder="e.g. -0.94" />
              </Field>
              <Field label="Cash">
                <input value={p.cash} onChange={e => up('cash', e.target.value)} placeholder="e.g. $189M" />
              </Field>
              <Field label="Debt">
                <input value={p.debt} onChange={e => up('debt', e.target.value)} placeholder="e.g. None" />
              </Field>
              <Field label="Catalysts / Context Notes" style={{ gridColumn: 'span 3' }}>
                <input value={p.catalysts} onChange={e => up('catalysts', e.target.value)} placeholder="e.g. GDXJ inclusion, earnings beat, Fed meeting, PEA due Q2..." />
              </Field>
              <Field label="Timeframe">
                <select value={p.timeframe} onChange={e => up('timeframe', e.target.value)}>
                  <option value="day">Day Trade</option>
                  <option value="swing">Swing Trade</option>
                  <option value="position">Position Trade</option>
                  <option value="investor">Long-Term Investor</option>
                </select>
              </Field>
            </div>
          )}
        </div>

        {err && <div className="err">⚠ {err}</div>}

        {running && (
          <div className="loading">
            <div className="bs" />
            <div className="ld1">CHARTSAW IS CUTTING...</div>
            <div className="ld2">Fibonacci · S/R · Volume · Patterns · Confluence · Sentiment</div>
          </div>
        )}

        {!running && !a && (
          <div className="empty">
            <div className="empty-logo">🪚 CHARTSAW</div>
            <div className="empty-sub">Enter any ticker, load live market data, then run a full Gareth Soloway PPT analysis.</div>
            <div className="steps">
              {[['1','Enter Ticker'],['2','Load Live Data'],['3','Run Analysis']].map(([n, t]) => (
                <div key={n} className="step">
                  <div className="snum">{n}</div>
                  {t}
                </div>
              ))}
            </div>
          </div>
        )}

        {!running && a && (
          <div className="res">

            <div className="tkr-row">
              <div>
                <div>
                  <span className="t-sym">{a.ticker}</span>
                  <span className="t-price">{a.currentPrice}</span>
                  {a.changePct !== '0' && (
                    <span className="t-chg" style={{ color: chgPos ? 'var(--green)' : 'var(--red)' }}>
                      {chgPos ? '▲' : '▼'} {Math.abs(parseFloat(a.changePct))}%
                    </span>
                  )}
                </div>
                <div className="t-name">{a.companyName} · {a.sector}</div>
              </div>
              <div className="t-date">
                CHARTSAW · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            <div className="vbar">
              {[['Short-Term', a.verdicts.shortTerm], ['Medium-Term', a.verdicts.mediumTerm], ['Long-Term', a.verdicts.longTerm], ['Overall Call', a.verdicts.overall]].map(([label, val], i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                  {i > 0 && <div className="vd" />}
                  <div className="vi">
                    <div className="vl">{label}</div>
                    <div className="vv" style={{ color: vc(val) }}>{val}</div>
                  </div>
                </div>
              ))}
            </div>

            {a.stats.length > 0 && (
              <>
                <div className="sec">KEY STATISTICS</div>
                <div className="sg">
                  {a.stats.map((s, i) => (
                    <div key={i} className="sc-card">
                      <div className="sc-label">{s.label}</div>
                      <div className="sc-val" style={{ color: sc(s.color) }}>{s.value}</div>
                      {s.note && <div className="sc-note">{s.note}</div>}
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="sec">PPT METHODOLOGY — SIGNAL BREAKDOWN</div>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: '18%' }}>Soloway Tool</th>
                  <th style={{ width: '12%' }}>Signal</th>
                  <th style={{ width: '38%' }}>Reading</th>
                  <th style={{ width: '32%' }}>Implication</th>
                </tr>
              </thead>
              <tbody>
                {a.signals.map((s, i) => (
                  <tr key={i}>
                    <td>
                      <div className="tbl-tool">{s.tool}</div>
                      {s.sub && <div className="tbl-sub">{s.sub}</div>}
                    </td>
                    <td><span className={'badge ' + bc(s.sig)}>{s.sig}</span></td>
                    <td>{s.read}</td>
                    <td className="tbl-imp">{s.imp}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="sec">KEY PRICE LEVELS</div>
            <div className="lvlg">
              <div className="lb">
                <div className="lbh lhr">▼ DOWNSIDE / SUPPORT TARGETS</div>
                {a.down.map((l, i) => (
                  <div key={i} className="lr">
                    <div className="lrt">{l.type}</div>
                    <div className="lrp" style={{ color: 'var(--red)' }}>{l.price}</div>
                    <div className="lrn">{l.note}</div>
                  </div>
                ))}
              </div>
              <div className="lb">
                <div className="lbh lhg">▲ UPSIDE / RESISTANCE TARGETS</div>
                {a.up2.map((l, i) => (
                  <div key={i} className="lr">
                    <div className="lrt">{l.type}</div>
                    <div className="lrp" style={{ color: 'var(--green)' }}>{l.price}</div>
                    <div className="lrn">{l.note}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="tbg">
              <div>
                <div className="sec">BULL THESIS</div>
                {a.bull.map((item, i) => (
                  <div key={i} className="thc">
                    <div className="tct">{item.title}</div>
                    <div className="tcb">{item.body}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="sec">BEAR RISKS</div>
                {a.bear.map((item, i) => (
                  <div key={i} className="rkc">
                    <div className="rct">{item.title}</div>
                    <div className="tcb">{item.body}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sec">SOLOWAY-STYLE TRADE SETUPS</div>
            <div className="stg">
              <div className="stc">
                <div className="sth shg">▲ BULL SETUP — Swing Long</div>
                {Object.entries(a.bullSetup).map(([k, v]) => (
                  <div key={k} className="srow">
                    <span className="sk">{k}</span>
                    <span className="sv">{v}</span>
                  </div>
                ))}
              </div>
              <div className="stc">
                <div className="sth shr">▼ BEAR SETUP — Short / Avoid</div>
                {Object.entries(a.bearSetup).map(([k, v]) => (
                  <div key={k} className="srow">
                    <span className="sk">{k}</span>
                    <span className="sv">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sec">OVERALL VERDICT</div>
            <div className="fv">
              <div className="fvt">🎯 {a.call}</div>
              <div className="fvb">{a.body}</div>
            </div>

            <div className="footer">
              <div className="footer-brand">🪚 CHARTSAW</div>
              <div className="footer-disc">
                CHARTSAW applies Gareth Soloway's publicly documented PPT Methodology for educational and informational purposes only.
                Not financial advice. Always conduct your own due diligence. Trading involves substantial risk of loss.
              </div>
            </div>

          </div>
        )}

      </div>
    </>
  )
}
