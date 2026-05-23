'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Plus, Loader2, DollarSign } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { format, startOfMonth, eachDayOfInterval, endOfDay } from 'date-fns'

interface Summary {
  income: number
  expenses: number
  net: number
  savings_rate: number
  daily: { date: string; net: number }[]
}

export default function FinanceCard() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', category: '', type: 'expense' as 'income' | 'expense' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadSummary() }, [])

  async function loadSummary() {
    setLoading(true)
    const res = await fetch('/api/finance').catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      setSummary(data)
    }
    setLoading(false)
  }

  async function addEntry(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || !form.description) return
    setSaving(true)
    await fetch('/api/finance/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    }).catch(() => null)
    setForm({ description: '', amount: '', category: '', type: 'expense' })
    setShowAdd(false)
    setSaving(false)
    await loadSummary()
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  const chartData = summary?.daily ?? []

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-5 flex flex-col gap-4 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-2">
        <TrendingUp size={16} className="text-yellow-400" />
        <span className="text-xs font-semibold tracking-widest text-white/60 uppercase">Finance Pulse</span>
        <span className="text-xs text-white/30 ml-1">{format(new Date(), 'MMMM yyyy')}</span>
        <button onClick={() => setShowAdd((v) => !v)} className="ml-auto p-1 hover:bg-white/10 rounded-md transition-colors">
          <Plus size={14} className="text-white/40" />
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addEntry} className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <input type="text" placeholder="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="col-span-2 md:col-span-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
          <input type="number" placeholder="Amount" value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
          <input type="text" placeholder="Category" value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
          <div className="flex gap-2">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'income' | 'expense' })}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm focus:outline-none">
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <button type="submit" disabled={saving}
              className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 rounded-lg text-sm transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : 'Log'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-white/30 text-sm">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2 grid grid-cols-2 gap-3">
            {[
              { label: 'Income', value: summary.income, color: 'text-green-400' },
              { label: 'Expenses', value: summary.expenses, color: 'text-red-400' },
              { label: 'Net', value: summary.net, color: summary.net >= 0 ? 'text-green-400' : 'text-red-400' },
              { label: 'Savings Rate', value: `${summary.savings_rate}%`, color: 'text-yellow-400', raw: true },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/3 rounded-xl p-3">
                <div className={`text-lg font-bold ${stat.color}`}>
                  {stat.raw ? stat.value : fmt(stat.value as number)}
                </div>
                <div className="text-xs text-white/40">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="md:col-span-3 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} tickFormatter={(v) => format(new Date(v + 'T12:00:00'), 'd')} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'rgba(10,10,15,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [fmt(Number(v ?? 0)), 'Net']}
                  labelFormatter={(l) => format(new Date(l + 'T12:00:00'), 'MMM d')}
                />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                <Area type="monotone" dataKey="net" stroke="#facc15" strokeWidth={1.5} fill="url(#netGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <p className="text-sm text-white/30">No financial data yet. Log a transaction to get started.</p>
      )}
    </div>
  )
}
