'use client'

import { useState, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import Card from './Card'
import AIInsightButton from './AIInsightButton'

interface Habit { id: string; name: string; streak: number; completedToday: boolean }

const LABEL: React.CSSProperties = {
  fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: '#ffffff',
}

function HabitHeatmap({ habitId, completions }: { habitId: string; completions: { date: string; habit_id: string }[] }) {
  const days = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'))
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gap: '3px', marginTop: '8px' }}>
      {days.map(day => {
        const filled = completions.some(c => c.habit_id === habitId && c.date === day)
        return (
          <div key={day} title={day} style={{
            width: '100%', aspectRatio: '1',
            background: filled ? '#C9933A' : '#1a1a1a',
            borderRadius: '2px',
          }} />
        )
      })}
    </div>
  )
}

export default function HabitsCard() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [newHabit, setNewHabit] = useState('')
  const [adding, setAdding] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [completions, setCompletions] = useState<{ date: string; habit_id: string }[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => { loadHabits() }, [])

  async function loadHabits() {
    setLoading(true)
    const res = await fetch('/api/habits').catch(() => null)
    if (res?.ok) setHabits((await res.json()).habits ?? [])
    setLoading(false)
  }

  async function loadHistory() {
    if (historyLoaded) return
    const res = await fetch('/api/habits/history').catch(() => null)
    if (res?.ok) setCompletions((await res.json()).completions ?? [])
    setHistoryLoaded(true)
  }

  function toggleExpand(id: string) {
    if (expanded === id) { setExpanded(null) } else {
      setExpanded(id)
      loadHistory()
    }
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

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    await fetch(`/api/habits/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    }).catch(() => null)
    setHabits(prev => prev.map(h => h.id === id ? { ...h, name: editName } : h))
    setEditingId(null)
  }

  async function deleteHabit(id: string) {
    setDeleting(id)
    await fetch(`/api/habits/${id}`, { method: 'DELETE' }).catch(() => null)
    setHabits(prev => prev.filter(h => h.id !== id))
    if (expanded === id) setExpanded(null)
    setDeleting(null)
  }

  const done = habits.filter(h => h.completedToday).length
  const total = habits.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9933A' }} />
        <span style={LABEL}>Habits</span>
        {total > 0 && (
          <span style={{ fontSize: '11px', color: '#aaa', marginLeft: '4px' }}>{done}/{total}</span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AIInsightButton context="Habits" data={{ habits: habits.map(h => ({ name: h.name, streak: h.streak, completedToday: h.completedToday })), done, total, pct }} />
          <button onClick={() => setShowInput(v => !v)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>+</button>
        </div>
      </div>

      {total > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ height: '2px', background: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#C9933A', borderRadius: '2px', transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ fontSize: '9px', color: '#555', marginTop: '3px', letterSpacing: '0.1em' }}>{pct}% COMPLETE</div>
        </div>
      )}

      {showInput && (
        <form onSubmit={addHabit} style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
          <input
            autoFocus value={newHabit} onChange={e => setNewHabit(e.target.value)} placeholder="New habit name"
            style={{ flex: 1, background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '7px 10px', fontSize: '11px', color: '#ffffff', outline: 'none' }}
          />
          <button type="submit" disabled={adding}
            style={{ background: '#ffffff', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, opacity: adding ? 0.5 : 1 }}>
            Add
          </button>
        </form>
      )}

      <div>
        {loading ? (
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Loading…</span>
        ) : habits.length === 0 ? (
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>No habits yet — add one to track.</span>
        ) : habits.map((h, i) => (
          <div key={h.id} style={{ borderBottom: i < habits.length - 1 ? '1px solid #1f1f1f' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '9px 0', gap: '9px' }}>
              <button
                onClick={() => toggle(h.id)} disabled={toggling === h.id}
                style={{
                  width: '14px', height: '14px', borderRadius: '3px', cursor: 'pointer',
                  border: h.completedToday ? 'none' : '1px solid #333',
                  background: h.completedToday ? '#C9933A' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                {h.completedToday && <span style={{ color: '#000', fontSize: '9px', lineHeight: 1 }}>✓</span>}
              </button>

              {editingId === h.id ? (
                <input
                  autoFocus value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onBlur={() => saveEdit(h.id)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(h.id); if (e.key === 'Escape') setEditingId(null) }}
                  style={{ flex: 1, background: '#0a0a0a', border: '1px solid #333', borderRadius: '4px', padding: '3px 7px', fontSize: '12px', color: '#fff', outline: 'none' }}
                />
              ) : (
                <span
                  style={{ flex: 1, fontSize: '12px', color: h.completedToday ? '#555' : '#aaaaaa', textDecoration: h.completedToday ? 'line-through' : 'none', cursor: 'pointer' }}
                  onClick={() => toggleExpand(h.id)}
                >
                  {h.name}
                </span>
              )}

              <span style={{ fontSize: '10px', color: '#555', flexShrink: 0 }}>
                {h.streak > 0 ? `${h.streak}d` : '—'}
              </span>

              <button
                onClick={() => toggleExpand(h.id)}
                style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '10px', padding: '0 2px', flexShrink: 0 }}
              >
                {expanded === h.id ? '▲' : '▼'}
              </button>
            </div>

            {expanded === h.id && (
              <div style={{ padding: '8px 0 12px 22px' }}>
                <div style={{ fontSize: '10px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>30-day history</div>
                <HabitHeatmap habitId={h.id} completions={completions} />
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => { setEditingId(h.id); setEditName(h.name) }}
                    style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '5px', padding: '4px 10px', fontSize: '10px', color: '#aaa', cursor: 'pointer' }}
                  >Edit</button>
                  <button
                    onClick={() => deleteHabit(h.id)}
                    disabled={deleting === h.id}
                    style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '5px', padding: '4px 10px', fontSize: '10px', color: '#555', cursor: 'pointer' }}
                  >Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
