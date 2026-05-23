'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { format } from 'date-fns'
import Drawer from './Drawer'

interface Summary { income: number; expenses: number; net: number; savings_rate: number; daily: { date: string; net: number }[] }

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export default function FinanceCard() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', category: '', type: 'expense' as 'income' | 'expense' })
  const [saving, setSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => { loadSummary() }, [])

  async function loadSummary() {
    setLoading(true)
    const res = await fetch('/api/finance').catch(() => null)
    if (res?.ok) setSummary(await res.json())
    setLoading(false)
  }

  async function addEntry(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || !form.description) return
    setSaving(true)
    await fetch('/api/finance/entries', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    }).catch(() => null)
    setForm({ description: '', amount: '', category: '', type: 'expense' })
    setShowAdd(false); setSaving(false)
    await loadSummary()
  }

  return (
    <>
      <div style={{ background: '#111111', borderRadius: '10px', padding: '18px', border: '1px solid #1a1a1a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ffffff' }} />
          <span style={{ fontSize: '10px', letterSpacing: '0.14em', color: '#ffffff', textTransform: 'uppercase', fontWeight: 700 }}>Finance Pulse</span>
          <span style={{ fontSize: '10px', color: '#444', marginLeft: '4px' }}>
            {format(new Date(), 'MMM yyyy')}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setShowHistory(true)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '13px' }}>↗</button>
            <button onClick={() => setShowAdd(v => !v)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>+</button>
          </div>
        </div>

        {showAdd && (
          <form onSubmit={addEntry} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '6px', marginBottom: '14px' }}>
            <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '6px', padding: '7px 10px', fontSize: '11px', color: '#fff', outline: 'none' }} />
            <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
              style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '6px', padding: '7px 10px', fontSize: '11px', color: '#fff', outline: 'none' }} />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'income' | 'expense' })}
              style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '6px', padding: '7px 8px', fontSize: '11px', color: '#fff', outline: 'none' }}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <button type="submit" disabled={saving}
              style={{ background: '#ffffff', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, opacity: saving ? 0.5 : 1 }}>
              Log
            </button>
          </form>
        )}

        {loading ? (
          <span style={{ fontSize: '11px', color: '#333' }}>Loading…</span>
        ) : summary ? (
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: 'INCOME', val: summary.income, pos: true },
                { label: 'EXPENSES', val: summary.expenses, pos: false },
                { label: 'NET', val: summary.net, pos: summary.net >= 0 },
                { label: 'SAVINGS', val: `${summary.savings_rate}%`, raw: true },
              ].map(({ label, val, pos, raw }) => (
                <div key={label} style={{ background: '#0a0a0a', borderRadius: '7px', padding: '10px', border: '1px solid #1a1a1a' }}>
                  <div style={{ fontSize: '16px', fontWeight: 300, color: raw ? '#aaa' : pos ? '#ffffff' : '#888' }}>{raw ? val : fmt(val as number)}</div>
                  <div style={{ fontSize: '9px', letterSpacing: '0.1em', color: '#444', textTransform: 'uppercase', marginTop: '3px' }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ height: '100px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.daily} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#444' }} tickFormatter={v => format(new Date(v + 'T12:00:00'), 'd')} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: '6px', fontSize: '11px' }}
                    formatter={(v) => [fmt(Number(v ?? 0)), 'Net']}
                    labelFormatter={l => format(new Date(l + 'T12:00:00'), 'MMM d')} />
                  <ReferenceLine y={0} stroke="#222" />
                  <Area type="monotone" dataKey="net" stroke="#ffffff" strokeWidth={1.5} fill="url(#netGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <span style={{ fontSize: '12px', color: '#333' }}>No financial data yet. Log a transaction to begin.</span>
        )}
      </div>

      <Drawer open={showHistory} onClose={() => setShowHistory(false)} title="Finance History" dotColor="#ffffff">
        {summary && (
          <>
            <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: '#444', textTransform: 'uppercase', marginBottom: '12px' }}>Daily Net — This Month</div>
            <div style={{ height: '140px', marginBottom: '16px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.daily} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#444' }} tickFormatter={d => format(new Date(d + 'T12:00:00'), 'd')} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: '6px', fontSize: '11px' }}
                    formatter={(v) => [fmt(Number(v ?? 0)), 'Net']} />
                  <Bar dataKey="net" fill="#ffffff" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              {[{ label: 'MTD Income', val: summary.income }, { label: 'MTD Expenses', val: summary.expenses }].map(({ label, val }) => (
                <div key={label}>
                  <div style={{ fontSize: '16px', fontWeight: 300, color: '#ffffff' }}>{fmt(val)}</div>
                  <div style={{ fontSize: '9px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </Drawer>
    </>
  )
}
