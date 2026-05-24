'use client'

import { useState, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import Card from '@/app/components/Card'
import AIInsightButton from '@/app/components/AIInsightButton'

interface Habit { id: string; name: string; streak: number; completedToday: boolean }

const LABEL: React.CSSProperties = {
  fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: '#ffffff',
}

const inputStyle: React.CSSProperties = {
  background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#ffffff',
  borderRadius: '6px', padding: '8px 10px', fontSize: '11px', outline: 'none',
}

function HabitGrid({ habitId, completions }: { habitId: string; completions: { date: string; habit_id: string }[] }) {
  const days = Array.from({ length: 14 }, (_, i) => format(subDays(new Date(), 13 - i), 'yyyy-MM-dd'))
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: '4px' }}>
      {days.map(day => {
        const filled = completions.some(c => c.habit_id === habitId && c.date === day)
        const isToday = day === format(new Date(), 'yyyy-MM-dd')
        return (
          <div key={day} title={day} style={{
            width: '100%', aspectRatio: '1',
            background: filled ? '#C9933A' : '#1a1a1a',
            borderRadius: '3px',
            outline: isToday ? '1px solid #555' : 'none',
          }} />
        )
      })}
    </div>
  )
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [completions, setCompletions] = useState<{ date: string; habit_id: string }[]>([])
  const [toggling, setToggling] = useState<string | null>(null)
  const [newHabit, setNewHabit] = useState('')
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [hRes, cRes] = await Promise.all([
      fetch('/api/habits').catch(() => null),
      fetch('/api/habits/history').catch(() => null),
    ])
    if (hRes?.ok) setHabits((await hRes.json()).habits ?? [])
    if (cRes?.ok) setCompletions((await cRes.json()).completions ?? [])
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
    setNewHabit(''); setShowForm(false); setAdding(false)
    await load()
  }

  async function deleteHabit(id: string) {
    setDeleting(id)
    await fetch(`/api/habits/${id}`, { method: 'DELETE' }).catch(() => null)
    setHabits(prev => prev.filter(h => h.id !== id))
    setDeleting(null)
  }

  const done = habits.filter(h => h.completedToday).length
  const total = habits.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  // Compute streaks
  const today = format(new Date(), 'yyyy-MM-dd')
  const allDates = Array.from(new Set(completions.map(c => c.date))).sort().reverse()
  let currentStreak = 0
  let check = new Date()
  for (const d of allDates) {
    const checkStr = format(check, 'yyyy-MM-dd')
    if (d === checkStr) {
      currentStreak++
      check = new Date(check.getTime() - 86400000)
    } else break
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 300, color: '#ffffff', margin: 0 }}>Habits</h1>
            <p style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>
              {format(new Date(), 'EEEE, MMMM d')} · {done}/{total} complete
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AIInsightButton context="Habits" data={{ habits: habits.map(h => ({ name: h.name, streak: h.streak, completedToday: h.completedToday })), done, total }} />
            <button
              onClick={() => setShowForm(v => !v)}
              style={{ background: '#ffffff', borderRadius: '6px', padding: '7px 14px', fontSize: '11px', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              + Add Habit
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: "Today's Progress", value: `${done}/${total}` },
            { label: 'Current Streak', value: `${currentStreak}d` },
            { label: 'Completion', value: `${pct}%` },
          ].map(stat => (
            <Card key={stat.label} padding="16px">
              <div style={{ fontSize: '24px', fontWeight: 300, color: '#ffffff', marginBottom: '4px' }}>{stat.value}</div>
              <div style={{ fontSize: '10px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Add habit form */}
        {showForm && (
          <Card style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9933A' }} />
              <span style={LABEL}>New Habit</span>
            </div>
            <form onSubmit={addHabit} style={{ display: 'flex', gap: '8px' }}>
              <input
                autoFocus value={newHabit} onChange={e => setNewHabit(e.target.value)}
                placeholder="Habit name (e.g. Morning workout, Read 20 min)"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button type="submit" disabled={adding || !newHabit.trim()}
                style={{ background: '#ffffff', borderRadius: '6px', padding: '8px 18px', fontSize: '11px', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, opacity: adding ? 0.5 : 1 }}>
                {adding ? 'Adding…' : 'Add'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ background: 'transparent', border: '1px solid #222', borderRadius: '6px', padding: '8px 12px', fontSize: '11px', color: '#555', cursor: 'pointer' }}>
                Cancel
              </button>
            </form>
          </Card>
        )}

        {/* Today's habits */}
        <Card style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9933A' }} />
            <span style={LABEL}>Today</span>
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ height: '4px', background: '#1a1a1a', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: '#C9933A', borderRadius: '4px', transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )}

          {loading ? (
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Loading…</span>
          ) : habits.length === 0 ? (
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>No habits yet. Add one above.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {habits.map((h, i) => (
                <div key={h.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0',
                  borderBottom: i < habits.length - 1 ? '1px solid #1a1a1a' : 'none',
                }}>
                  <button
                    onClick={() => toggle(h.id)}
                    disabled={toggling === h.id}
                    style={{
                      width: '20px', height: '20px', borderRadius: '5px', cursor: 'pointer', flexShrink: 0,
                      border: h.completedToday ? 'none' : '1px solid #333',
                      background: h.completedToday ? '#C9933A' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {h.completedToday && <span style={{ color: '#000', fontSize: '11px', lineHeight: 1 }}>✓</span>}
                  </button>
                  <span style={{ flex: 1, fontSize: '13px', color: h.completedToday ? '#555' : '#aaaaaa', textDecoration: h.completedToday ? 'line-through' : 'none' }}>
                    {h.name}
                  </span>
                  <span style={{ fontSize: '11px', color: '#555', flexShrink: 0 }}>
                    {h.streak > 0 ? `${h.streak}d streak` : '—'}
                  </span>
                  <button
                    onClick={() => deleteHabit(h.id)}
                    disabled={deleting === h.id}
                    style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '12px', flexShrink: 0 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 14-day streak grids */}
        {habits.length > 0 && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9933A' }} />
              <span style={LABEL}>14-Day History</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ width: '10px', height: '10px', background: '#C9933A', borderRadius: '2px' }} />
                <span style={{ fontSize: '10px', color: '#444' }}>done</span>
                <div style={{ width: '10px', height: '10px', background: '#1a1a1a', borderRadius: '2px' }} />
                <span style={{ fontSize: '10px', color: '#444' }}>missed</span>
              </div>
            </div>

            {/* Date labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: '4px', marginBottom: '8px', paddingLeft: '0' }}>
              {Array.from({ length: 14 }, (_, i) => {
                const d = subDays(new Date(), 13 - i)
                return (
                  <div key={i} style={{ textAlign: 'center', fontSize: '8px', color: '#333' }}>
                    {format(d, 'd')}
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {habits.map(h => (
                <div key={h.id}>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>{h.name}</div>
                  <HabitGrid habitId={h.id} completions={completions} />
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
