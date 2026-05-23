'use client'

import { useState, useEffect } from 'react'
import Drawer from './Drawer'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { format } from 'date-fns'

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
      <div style={{ background: '#071E30', borderRadius: '8px', padding: '18px', border: '0.5px solid #0A2840' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1D9E75' }} />
          <span style={{ fontSize: '9px', letterSpacing: '0.18em', color: '#378ADD', textTransform: 'uppercase' }}>Finance Pulse</span>
          <span style={{ fontSize: '10px', color: '#1E4060', marginLeft: '4px' }}>
            {format(new Date(), 'MMM yyyy')}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setShowHistory(true)} style={{ background: 'none', border: 'none', color: '#1E4060', cursor: 'pointer', fontSize: '12px' }}>↗</button>
            <button onClick={() => setShowAdd(v => !v)} style={{ background: 'none', border: 'none', color: '#1E4060', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>+</button>
          </div>
        </div>

        {showAdd && (
          <form onSubmit={addEntry} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '6px', marginBottom: '14px' }}>
            <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              style={{ background: '#040F1C', border: '0.5px solid #0A2840', borderRadius: '5px', padding: '7px 10px', fontSize: '11px', color: '#7AABCC', outline: 'none' }} />
            <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
              style={{ background: '#040F1C', border: '0.5px solid #0A2840', borderRadius: '5px', padding: '7px 10px', fontSize: '11px', color: '#7AABCC', outline: 'none' }} />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'income' | 'expense' })}
              style={{ background: '#040F1C', border: '0.5px solid #0A2840', borderRadius: '5px', padding: '7px 8px', fontSize: '11px', color: '#7AABCC', outline: 'none' }}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <button type="submit" disabled={saving}
              style={{ background: '#0F6E56', borderRadius: '5px', padding: '6px 12px', fontSize: '11px', color: '#9FE1CB', border: 'none', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
              Log
            </button>
          </form>
        )}

        {loading ? (
          <span style={{ fontSize: '11px', color: '#1E4060' }}>Loading…</span>
        ) : summary ? (
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'INCOME', val: summary.income, color: '#5DCAA5' },
                { label: 'EXPENSES', val: summary.expenses, color: '#D85A30' },
                { label: 'NET', val: summary.net, color: summary.net >= 0 ? '#5DCAA5' : '#D85A30' },
                { label: 'SAVINGS', val: `${summary.savings_rate}%`, color: '#378ADD', raw: true },
              ].map(({ label, val, color, raw }) => (
                <div key={label} style={{ background: '#040F1C', borderRadius: '5px', padding: '10px', border: '0.5px solid #0A2840' }}>
                  <div style={{ fontSize: '16px', fontWeight: 300, color }}>{raw ? val : fmt(val as number)}</div>
                  <div style={{ fontSize: '9px', letterSpacing: '0.08em', color: '#1E4060', textTransform: 'uppercase', marginTop: '3px' }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ height: '100px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.daily} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#1E4060' }} tickFormatter={v => format(new Date(v + 'T12:00:00'), 'd')} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: '#071E30', border: '0.5px solid #0A2840', borderRadius: '5px', fontSize: '11px' }}
                    formatter={(v) => [fmt(Number(v ?? 0)), 'Net']}
                    labelFormatter={l => format(new Date(l + 'T12:00:00'), 'MMM d')} />
                  <ReferenceLine y={0} stroke="#0A2840" />
                  <Area type="monotone" dataKey="net" stroke="#1D9E75" strokeWidth={1.5} fill="url(#netGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <span style={{ fontSize: '12px', color: '#1E4060' }}>No financial data yet. Log a transaction to begin.</span>
        )}
      </div>

      <Drawer open={showHistory} onClose={() => setShowHistory(false)} title="Finance History" dotColor="#1D9E75">
        {summary && (
          <>
            <div style={{ fontSize: '9px', letterSpacing: '0.08em', color: '#1E4060', textTransform: 'uppercase', marginBottom: '12px' }}>Daily Net — This Month</div>
            <div style={{ height: '140px', marginBottom: '16px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.daily} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#1E4060' }} tickFormatter={d => format(new Date(d + 'T12:00:00'), 'd')} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: '#071E30', border: '0.5px solid #0A2840', borderRadius: '5px', fontSize: '11px' }}
                    formatter={(v) => [fmt(Number(v ?? 0)), 'Net']} />
                  <Bar dataKey="net" fill="#185FA5" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              {[{ label: 'MTD Income', val: summary.income, color: '#5DCAA5' }, { label: 'MTD Expenses', val: summary.expenses, color: '#D85A30' }].map(({ label, val, color }) => (
                <div key={label}>
                  <div style={{ fontSize: '16px', fontWeight: 300, color }}>{fmt(val)}</div>
                  <div style={{ fontSize: '9px', color: '#1E4060', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </Drawer>
    </>
  )
}
