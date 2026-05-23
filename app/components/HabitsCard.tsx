'use client'

import { useState, useEffect } from 'react'
import Drawer from './Drawer'
import { format, subDays } from 'date-fns'

interface Habit { id: string; name: string; streak: number; completedToday: boolean }

export default function HabitsCard() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [newHabit, setNewHabit] = useState('')
  const [adding, setAdding] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [historyData, setHistoryData] = useState<{ date: string; habit_id: string }[]>([])

  useEffect(() => { loadHabits() }, [])

  async function loadHabits() {
    setLoading(true)
    const res = await fetch('/api/habits').catch(() => null)
    if (res?.ok) setHabits((await res.json()).habits ?? [])
    setLoading(false)
  }

  async function toggle(id: string) {
    setToggling(id)
    await fetch(`/api/habits/${id}/complete`, { method: 'PATCH' }).catch(() => null)
    setHabits(prev => prev.map(h => h.id === id
      ? { ...h, completedToday: !h.completedToday, streak: h.completedToday ? Math.max(0, h.streak - 1) : h.streak + 1 }
      : h))
    setToggling(null)
  }

  async function addHabit(e: React.FormEvent) {
    e.preventDefault()
    if (!newHabit.trim()) return
    setAdding(true)
    await fetch('/api/habits', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newHabit }),
    }).catch(() => null)
    setNewHabit(''); setShowInput(false); setAdding(false)
    await loadHabits()
  }

  async function loadHistory() {
    const res = await fetch('/api/habits/history').catch(() => null)
    if (res?.ok) setHistoryData((await res.json()).completions ?? [])
    setShowHistory(true)
  }

  const done = habits.filter(h => h.completedToday).length
  const total = habits.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  // 30-day heatmap dates
  const days30 = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'))

  return (
    <>
      <div style={{ background: '#071E30', borderRadius: '8px', padding: '18px', border: '0.5px solid #0A2840' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1D9E75' }} />
          <span style={{ fontSize: '9px', letterSpacing: '0.18em', color: '#378ADD', textTransform: 'uppercase' }}>Habits</span>
          {total > 0 && (
            <span style={{ fontSize: '10px', color: '#5DCAA5', marginLeft: '4px' }}>{done}/{total}</span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={loadHistory} style={{ background: 'none', border: 'none', color: '#1E4060', cursor: 'pointer', fontSize: '12px' }}>↗</button>
            <button onClick={() => setShowInput(v => !v)} style={{ background: 'none', border: 'none', color: '#1E4060', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>+</button>
          </div>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ height: '3px', background: '#0A2840', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: '#1D9E75', borderRadius: '2px', transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ fontSize: '9px', color: '#1E4060', marginTop: '4px', letterSpacing: '0.08em' }}>{pct}% COMPLETE</div>
          </div>
        )}

        {showInput && (
          <form onSubmit={addHabit} style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            <input
              autoFocus value={newHabit} onChange={e => setNewHabit(e.target.value)} placeholder="New habit name"
              style={{ flex: 1, background: '#040F1C', border: '0.5px solid #0A2840', borderRadius: '5px', padding: '7px 10px', fontSize: '11px', color: '#7AABCC', outline: 'none' }}
            />
            <button type="submit" disabled={adding}
              style={{ background: '#0F6E56', borderRadius: '5px', padding: '6px 12px', fontSize: '11px', color: '#9FE1CB', border: 'none', cursor: 'pointer', opacity: adding ? 0.5 : 1 }}>
              Add
            </button>
          </form>
        )}

        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {loading ? (
            <span style={{ fontSize: '11px', color: '#1E4060' }}>Loading…</span>
          ) : habits.length === 0 ? (
            <span style={{ fontSize: '12px', color: '#1E4060' }}>No habits yet — add one to track.</span>
          ) : habits.map((h, i) => (
            <div key={h.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 0',
              borderBottom: i < habits.length - 1 ? '0.5px solid #0A2840' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <button
                  onClick={() => toggle(h.id)} disabled={toggling === h.id}
                  style={{
                    width: '13px', height: '13px', borderRadius: '3px', cursor: 'pointer',
                    border: h.completedToday ? '1px solid #185FA5' : '0.5px solid #0A2840',
                    background: h.completedToday ? '#0C2E50' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                >
                  {h.completedToday && <div style={{ width: '5px', height: '5px', background: '#5DCAA5', borderRadius: '1px' }} />}
                </button>
                <span style={{ fontSize: '12px', color: h.completedToday ? '#7AABCC' : '#1E4060' }}>{h.name}</span>
              </div>
              <span style={{ fontSize: '10px', color: h.completedToday ? '#378ADD' : '#0E2030' }}>
                {h.streak > 0 ? `${h.streak}d` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Drawer open={showHistory} onClose={() => setShowHistory(false)} title="Habits History" dotColor="#1D9E75">
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '9px', letterSpacing: '0.08em', color: '#1E4060', textTransform: 'uppercase', marginBottom: '10px' }}>Last 30 Days</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px' }}>
            {days30.map(day => {
              const completed = historyData.filter(c => c.date === day).length
              const total = habits.length
              const filled = completed > 0
              return (
                <div key={day} title={`${day}: ${completed}/${total}`} style={{
                  width: '100%', aspectRatio: '1',
                  background: filled ? '#0C2E50' : '#040F1C',
                  borderRadius: '2px',
                  border: `0.5px solid ${filled ? '#185FA5' : '#0A2840'}`,
                }} />
              )
            })}
          </div>
        </div>
        <div style={{ height: '0.5px', background: '#0A2840', marginBottom: '14px' }} />
        {habits.map(h => (
          <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #0A2840' }}>
            <span style={{ fontSize: '12px', color: '#7AABCC' }}>{h.name}</span>
            <span style={{ fontSize: '10px', color: '#378ADD' }}>{h.streak}d streak</span>
          </div>
        ))}
      </Drawer>
    </>
  )
}
