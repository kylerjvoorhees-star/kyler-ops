'use client'

import { useState, useEffect } from 'react'
import { Flame, Plus, Loader2, Check } from 'lucide-react'

interface Habit {
  id: string
  name: string
  icon?: string
  streak: number
  completedToday: boolean
}

export default function HabitsCard() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [newHabit, setNewHabit] = useState('')
  const [adding, setAdding] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => { loadHabits() }, [])

  async function loadHabits() {
    setLoading(true)
    const res = await fetch('/api/habits').catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      setHabits(data.habits ?? [])
    }
    setLoading(false)
  }

  async function toggle(id: string) {
    setToggling(id)
    await fetch(`/api/habits/${id}/complete`, { method: 'PATCH' }).catch(() => null)
    setHabits((prev) =>
      prev.map((h) => h.id === id ? { ...h, completedToday: !h.completedToday, streak: h.completedToday ? Math.max(0, h.streak - 1) : h.streak + 1 } : h)
    )
    setToggling(null)
  }

  async function addHabit(e: React.FormEvent) {
    e.preventDefault()
    if (!newHabit.trim()) return
    setAdding(true)
    await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newHabit }),
    }).catch(() => null)
    setNewHabit('')
    setShowInput(false)
    setAdding(false)
    await loadHabits()
  }

  const done = habits.filter((h) => h.completedToday).length
  const total = habits.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const circumference = 2 * Math.PI * 22

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-5 flex flex-col gap-4 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-2">
        <Flame size={16} className="text-orange-400" />
        <span className="text-xs font-semibold tracking-widest text-white/60 uppercase">Habits</span>
        <button onClick={() => setShowInput((v) => !v)} className="ml-auto p-1 hover:bg-white/10 rounded-md transition-colors">
          <Plus size={14} className="text-white/40" />
        </button>
      </div>

      {total > 0 && (
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
              <circle
                cx="30" cy="30" r="22" fill="none" stroke="#fb923c"
                strokeWidth="5" strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct / 100)}
                strokeLinecap="round" className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">{pct}%</div>
          </div>
          <div>
            <div className="text-lg font-bold">{done}<span className="text-white/30 text-sm font-normal">/{total}</span></div>
            <div className="text-xs text-white/40">habits completed</div>
          </div>
        </div>
      )}

      {showInput && (
        <form onSubmit={addHabit} className="flex gap-2">
          <input
            autoFocus type="text" value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="New habit name"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500/50"
          />
          <button type="submit" disabled={adding} className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 rounded-lg text-sm transition-colors">
            {adding ? <Loader2 size={14} className="animate-spin" /> : 'Add'}
          </button>
        </form>
      )}

      <div className="space-y-2 max-h-44 overflow-y-auto">
        {loading ? (
          <div className="flex items-center gap-2 text-white/30 text-sm">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : habits.length === 0 ? (
          <p className="text-sm text-white/30">No habits yet — add one to track.</p>
        ) : (
          habits.map((h) => (
            <div key={h.id} className="flex items-center gap-3 py-1">
              <button
                onClick={() => toggle(h.id)}
                disabled={toggling === h.id}
                className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                  h.completedToday
                    ? 'bg-orange-500 border-orange-500'
                    : 'border-white/20 hover:border-orange-400'
                }`}
              >
                {h.completedToday && <Check size={12} strokeWidth={3} />}
              </button>
              <span className={`text-sm flex-1 ${h.completedToday ? 'line-through text-white/30' : ''}`}>{h.name}</span>
              <div className="flex items-center gap-1 text-xs text-orange-400">
                <Flame size={11} />
                {h.streak}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
