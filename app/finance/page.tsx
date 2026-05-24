'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import AIInsightButton from '@/app/components/AIInsightButton'

interface Snapshot {
  id: string; snapshot_date: string; net_worth: number
  assets: Record<string, number>; liabilities: Record<string, number>; notes?: string
}

interface Analysis {
  period?: string; income?: number; expenses?: number; net?: number
  categories?: { name: string; amount: number }[]
  subscriptions?: { name: string; amount: number }[]
  insight?: string; raw_summary?: string
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const fmtK = (n: number) => {
  if (Math.abs(n) >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(0)}K`
  return fmt(n)
}

export default function FinancePage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddSnapshot, setShowAddSnapshot] = useState(false)
  const [snapForm, setSnapForm] = useState({ net_worth: '', assets: '', liabilities: '', notes: '' })
  const [savingSnap, setSavingSnap] = useState(false)

  // PDF analysis
  const fileRef = useRef<HTMLInputElement>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [pdfName, setPdfName] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/finance/snapshots').catch(() => null)
    if (res?.ok) setSnapshots((await res.json()).snapshots ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveSnapshot(e: React.FormEvent) {
    e.preventDefault()
    const nw = parseFloat(snapForm.net_worth)
    if (isNaN(nw)) return
    setSavingSnap(true)

    // Parse assets/liabilities as simple key:value pairs
    const parseKV = (s: string): Record<string, number> => {
      const obj: Record<string, number> = {}
      s.split('\n').forEach(line => {
        const [k, v] = line.split(':').map(x => x.trim())
        if (k && v && !isNaN(parseFloat(v))) obj[k] = parseFloat(v)
      })
      return obj
    }

    await fetch('/api/finance/snapshots', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        net_worth: nw,
        assets: parseKV(snapForm.assets),
        liabilities: parseKV(snapForm.liabilities),
        notes: snapForm.notes || undefined,
      }),
    }).catch(() => null)

    setSnapForm({ net_worth: '', assets: '', liabilities: '', notes: '' })
    setShowAddSnapshot(false); setSavingSnap(false)
    load()
  }

  async function analyzeStatement(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfName(file.name)
    setAnalyzing(true)
    setAnalysis(null)
    const fd = new FormData(); fd.append('pdf', file)
    try {
      const res = await fetch('/api/finance/analyze-statement', { method: 'POST', body: fd })
      const data = await res.json()
      setAnalysis(data.analysis ?? null)
    } catch { /* ignore */ }
    setAnalyzing(false)
  }

  const latest = snapshots[0]
  const previous = snapshots[1]
  const delta = latest && previous ? latest.net_worth - previous.net_worth : null
  const chartData = [...snapshots].reverse().map(s => ({ date: s.snapshot_date, net_worth: s.net_worth }))

  const S: React.CSSProperties = {
    background: '#0a0a0a', border: '1px solid #222', borderRadius: '6px',
    padding: '8px 10px', fontSize: '11px', color: '#fff', outline: 'none', width: '100%',
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 300, color: '#ffffff', margin: 0 }}>Finance</h1>
          <p style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>Net worth tracking & statement analysis</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => fileRef.current?.click()}
            style={{ background: 'transparent', border: '1px solid #222', borderRadius: '6px', padding: '7px 14px', fontSize: '11px', color: '#555', cursor: 'pointer', fontWeight: 600 }}>
            {analyzing ? 'Analyzing…' : '✦ Analyze Statement'}
          </button>
          <input ref={fileRef} type="file" accept=".pdf" onChange={analyzeStatement} style={{ display: 'none' }} />
          <button onClick={() => setShowAddSnapshot(v => !v)}
            style={{ background: '#ffffff', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '11px', color: '#000', cursor: 'pointer', fontWeight: 700 }}>
            + Snapshot
          </button>
        </div>
      </div>

      {/* Add snapshot form */}
      {showAddSnapshot && (
        <form onSubmit={saveSnapshot} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '10px', color: '#444', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>New Snapshot</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: '#555', display: 'block', marginBottom: '4px' }}>Net Worth ($)</label>
              <input value={snapForm.net_worth} onChange={e => setSnapForm({ ...snapForm, net_worth: e.target.value })} placeholder="250000" type="number" style={S} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: '#555', display: 'block', marginBottom: '4px' }}>Notes</label>
              <input value={snapForm.notes} onChange={e => setSnapForm({ ...snapForm, notes: e.target.value })} placeholder="Optional note" style={S} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: '#555', display: 'block', marginBottom: '4px' }}>Assets (name: amount, one per line)</label>
              <textarea value={snapForm.assets} onChange={e => setSnapForm({ ...snapForm, assets: e.target.value })} placeholder={"Checking: 15000\nSavings: 40000\n401k: 90000"} rows={4} style={{ ...S, resize: 'vertical' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: '#555', display: 'block', marginBottom: '4px' }}>Liabilities (name: amount, one per line)</label>
              <textarea value={snapForm.liabilities} onChange={e => setSnapForm({ ...snapForm, liabilities: e.target.value })} placeholder={"Student loans: 25000\nCredit card: 3000"} rows={4} style={{ ...S, resize: 'vertical' }} />
            </div>
          </div>
          <button type="submit" disabled={savingSnap} style={{ background: '#fff', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '11px', color: '#000', cursor: 'pointer', fontWeight: 700, opacity: savingSnap ? 0.5 : 1 }}>
            Save Snapshot
          </button>
        </form>
      )}

      {/* AI Statement Analysis */}
      {(analyzing || analysis) && (
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid #C9933A', borderBottom: '3px solid #C9933A', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9933A' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', color: '#ffffff', textTransform: 'uppercase' }}>Statement Analysis</span>
            {pdfName && <span style={{ fontSize: '10px', color: '#444' }}>— {pdfName}</span>}
          </div>

          {analyzing ? (
            <div style={{ fontSize: '12px', color: '#444' }}>Parsing PDF and analyzing with Claude…</div>
          ) : analysis ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                {/* Summary stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  {[
                    { label: 'Income', val: analysis.income },
                    { label: 'Expenses', val: analysis.expenses },
                    { label: 'Net', val: analysis.net },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ background: '#0a0a0a', borderRadius: '8px', padding: '10px', border: '1px solid #1a1a1a' }}>
                      <div style={{ fontSize: '14px', fontWeight: 300, color: '#fff' }}>{val != null ? fmt(val) : '—'}</div>
                      <div style={{ fontSize: '9px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '3px' }}>{label}</div>
                    </div>
                  ))}
                </div>

                {analysis.insight && (
                  <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '9px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '5px', fontWeight: 700 }}>Key Insight</div>
                    <div style={{ fontSize: '12px', color: '#aaa', lineHeight: 1.6 }}>{analysis.insight}</div>
                  </div>
                )}

                {analysis.raw_summary && (
                  <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.7 }}>{analysis.raw_summary}</div>
                )}
              </div>

              <div>
                {analysis.categories && analysis.categories.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '10px', color: '#444', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px' }}>Top Categories</div>
                    {analysis.categories.map((c, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a1a' }}>
                        <span style={{ fontSize: '12px', color: '#aaa' }}>{c.name}</span>
                        <span style={{ fontSize: '12px', color: '#fff' }}>{fmt(c.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {analysis.subscriptions && analysis.subscriptions.length > 0 && (
                  <div>
                    <div style={{ fontSize: '10px', color: '#444', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px' }}>Subscriptions</div>
                    {analysis.subscriptions.map((s, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a1a' }}>
                        <span style={{ fontSize: '12px', color: '#aaa' }}>{s.name}</span>
                        <span style={{ fontSize: '12px', color: '#fff' }}>{fmt(s.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Net Worth Hero */}
      {loading ? (
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>Loading…</div>
      ) : snapshots.length === 0 ? (
        <div style={{ color: '#444', fontSize: '14px', textAlign: 'center', padding: '60px 0' }}>
          No snapshots yet. Click &ldquo;+ Snapshot&rdquo; to add your first net worth entry.
        </div>
      ) : (
        <>
          {/* Hero */}
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid #C9933A', borderBottom: '3px solid #C9933A', borderRadius: '12px', padding: '28px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Net Worth</div>
                  <AIInsightButton context="Net Worth" data={{ latest: latest?.net_worth, delta, snapshots: snapshots.slice(0, 6).map(s => ({ date: s.snapshot_date, net_worth: s.net_worth })) }} />
                </div>
                <div style={{ fontSize: '48px', fontWeight: 200, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  {fmtK(latest.net_worth)}
                </div>
                {delta != null && (
                  <div style={{ fontSize: '13px', color: delta >= 0 ? '#aaaaaa' : '#666', marginTop: '4px' }}>
                    {delta >= 0 ? '+' : ''}{fmt(delta)} vs last snapshot
                  </div>
                )}
                {latest.notes && (
                  <div style={{ fontSize: '11px', color: '#333', marginTop: '6px' }}>{latest.notes}</div>
                )}
              </div>

              {/* Sparkline */}
              <div style={{ width: '280px', height: '80px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: '6px', fontSize: '11px' }}
                      formatter={(v) => [fmtK(Number(v)), 'Net Worth']}
                      labelFormatter={l => format(new Date(l + 'T12:00:00'), 'MMM d, yyyy')}
                    />
                    <Area type="monotone" dataKey="net_worth" stroke="#ffffff" strokeWidth={1.5} fill="url(#nwGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Latest breakdown */}
          {(Object.keys(latest.assets ?? {}).length > 0 || Object.keys(latest.liabilities ?? {}).length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {/* Assets */}
              <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontSize: '10px', color: '#444', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '12px' }}>Assets</div>
                {Object.entries(latest.assets ?? {}).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #1a1a1a' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>{k}</span>
                    <span style={{ fontSize: '12px', color: '#ffffff' }}>{fmt(v)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0' }}>
                  <span style={{ fontSize: '11px', color: '#555', fontWeight: 700 }}>Total</span>
                  <span style={{ fontSize: '14px', color: '#ffffff', fontWeight: 300 }}>
                    {fmt(Object.values(latest.assets ?? {}).reduce((a, b) => a + b, 0))}
                  </span>
                </div>
              </div>

              {/* Liabilities */}
              <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '18px' }}>
                <div style={{ fontSize: '10px', color: '#444', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '12px' }}>Liabilities</div>
                {Object.keys(latest.liabilities ?? {}).length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#333' }}>No liabilities.</div>
                ) : Object.entries(latest.liabilities ?? {}).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #1a1a1a' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>{k}</span>
                    <span style={{ fontSize: '12px', color: '#ffffff' }}>{fmt(v)}</span>
                  </div>
                ))}
                {Object.keys(latest.liabilities ?? {}).length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0' }}>
                    <span style={{ fontSize: '11px', color: '#555', fontWeight: 700 }}>Total</span>
                    <span style={{ fontSize: '14px', color: '#ffffff', fontWeight: 300 }}>
                      {fmt(Object.values(latest.liabilities ?? {}).reduce((a, b) => a + b, 0))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Snapshot history table */}
          <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '18px' }}>
            <div style={{ fontSize: '10px', color: '#444', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '14px' }}>Snapshot History</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '0' }}>
              {['Date', 'Net Worth', 'Change', 'Notes'].map(h => (
                <div key={h} style={{ fontSize: '9px', color: '#333', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 0 8px', borderBottom: '1px solid #1a1a1a', fontWeight: 700 }}>{h}</div>
              ))}
              {snapshots.map((snap, i) => {
                const prev = snapshots[i + 1]
                const d = prev ? snap.net_worth - prev.net_worth : null
                return [
                  <div key={snap.id + 'date'} style={{ fontSize: '12px', color: '#888', padding: '10px 0', borderBottom: i < snapshots.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                    {format(new Date(snap.snapshot_date + 'T12:00:00'), 'MMM d, yyyy')}
                  </div>,
                  <div key={snap.id + 'nw'} style={{ fontSize: '13px', color: '#ffffff', fontWeight: 300, padding: '10px 0', borderBottom: i < snapshots.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                    {fmtK(snap.net_worth)}
                  </div>,
                  <div key={snap.id + 'delta'} style={{ fontSize: '12px', color: d != null ? (d >= 0 ? '#aaa' : '#666') : '#333', padding: '10px 0', borderBottom: i < snapshots.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                    {d != null ? `${d >= 0 ? '+' : ''}${fmtK(d)}` : '—'}
                  </div>,
                  <div key={snap.id + 'notes'} style={{ fontSize: '11px', color: '#444', padding: '10px 0', borderBottom: i < snapshots.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                    {snap.notes ?? ''}
                  </div>,
                ]
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
