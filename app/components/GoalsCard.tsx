'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface Milestone { id: string; title: string; completed: boolean; due_date?: string }
interface Goal {
  id: string; title: string; category?: string; target_date?: string
  progress: number; status: string; milestones?: Milestone[]
}

const CATEGORIES = ['health', 'career', 'finance', 'relationships', 'personal']

export default function GoalsCard() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'personal', target_date: '' })
  const [adding, setAdding] = useState(false)
  const [newMilestone, setNewMilestone] = useState('')
  const [addingMilestone, setAddingMilestone] = useState(false)

  useEffect(() => { loadGoals() }, [])

  async function loadGoals() {
    setLoading(true)
    const res = await fetch('/api/goals').catch(() => null)
    if (res?.ok) setGoals((await res.json()).goals ?? [])
    setLoading(false)
  }

  async function loadMilestones(goalId: string) {
    const res = await fetch(`/api/goals/${goalId}/milestones`).catch(() => null)
    if (res?.ok) {
      const { milestones } = await res.json()
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, milestones } : g))
    }
  }

  async function toggleExpand(goalId: string) {
    if (expanded === goalId) { setExpanded(null); return }
    setExpanded(goalId)
    await loadMilestones(goalId)
  }

  async function addGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setAdding(true)
    await fetch('/api/goals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).catch(() => null)
    setForm({ title: '', category: 'personal', target_date: '' })
    setShowAdd(false); setAdding(false)
    await loadGoals()
  }

  async function toggleMilestone(goalId: string, milestoneId: string) {
    await fetch(`/api/goals/${goalId}/milestones/${milestoneId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggle: true }),
    }).catch(() => null)
    await loadMilestones(goalId)
  }

  async function addMilestone(goalId: string, e: React.FormEvent) {
    e.preventDefault()
    if (!newMilestone.trim()) return
    setAddingMilestone(true)
    await fetch(`/api/goals/${goalId}/milestones`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newMilestone }),
    }).catch(() => null)
    setNewMilestone(''); setAddingMilestone(false)
    await loadMilestones(goalId)
  }

  async function updateProgress(goalId: string, progress: number) {
    await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress }),
    }).catch(() => null)
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, progress } : g))
  }

  return (
    <div style={{ background: '#111111', borderRadius: '10px', padding: '18px', border: '1px solid #1a1a1a' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ffffff' }} />
        <span style={{ fontSize: '10px', letterSpacing: '0.14em', color: '#ffffff', textTransform: 'uppercase', fontWeight: 700 }}>Goals</span>
        <button onClick={() => setShowAdd(v => !v)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>+</button>
      </div>

      {showAdd && (
        <form onSubmit={addGoal} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', background: '#0a0a0a', padding: '12px', borderRadius: '8px', border: '1px solid #1a1a1a' }}>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Goal title"
            style={{ background: '#111', border: '1px solid #222', borderRadius: '6px', padding: '7px 10px', fontSize: '11px', color: '#ffffff', outline: 'none', width: '100%' }} autoFocus />
          <div style={{ display: 'flex', gap: '6px' }}>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              style={{ flex: 1, background: '#111', border: '1px solid #222', borderRadius: '6px', padding: '7px 8px', fontSize: '11px', color: '#ffffff', outline: 'none' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })}
              style={{ flex: 1, background: '#111', border: '1px solid #222', borderRadius: '6px', padding: '7px 8px', fontSize: '11px', color: form.target_date ? '#ffffff' : '#444', outline: 'none' }} />
          </div>
          <button type="submit" disabled={adding}
            style={{ background: '#ffffff', borderRadius: '6px', padding: '6px 14px', fontSize: '11px', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, opacity: adding ? 0.5 : 1 }}>
            Add Goal
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <span style={{ fontSize: '11px', color: '#333' }}>Loading…</span>
        ) : goals.length === 0 ? (
          <span style={{ fontSize: '12px', color: '#333' }}>No goals yet. Add one to start tracking.</span>
        ) : goals.map((g, i) => (
          <div key={g.id} style={{ borderBottom: i < goals.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
            <button onClick={() => toggleExpand(g.id)} style={{
              display: 'flex', flexDirection: 'column', gap: '7px', padding: '10px 0',
              background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: '12px', color: '#aaaaaa' }}>{g.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {g.category && (
                    <span style={{
                      fontSize: '9px', padding: '2px 7px', borderRadius: '20px',
                      background: '#1a1a1a', color: '#555', fontWeight: 600, letterSpacing: '0.08em',
                    }}>{g.category}</span>
                  )}
                  {g.target_date && (
                    <span style={{ fontSize: '10px', color: '#444' }}>
                      {format(new Date(g.target_date + 'T12:00:00'), 'MMM d')}
                    </span>
                  )}
                  <span style={{ fontSize: '10px', color: '#333' }}>{expanded === g.id ? '▲' : '▼'}</span>
                </div>
              </div>
              <div style={{ width: '100%', height: '2px', background: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${g.progress}%`, background: '#ffffff', borderRadius: '2px', transition: 'width 0.4s' }} />
              </div>
              <div style={{ fontSize: '10px', color: '#444' }}>{g.progress}%</div>
            </button>

            {/* Expanded milestones */}
            {expanded === g.id && (
              <div style={{ paddingBottom: '12px', paddingLeft: '8px' }}>
                {(g.milestones ?? []).map(m => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 0', borderBottom: '1px solid #1a1a1a',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <button onClick={() => toggleMilestone(g.id, m.id)} style={{
                        width: '14px', height: '14px', borderRadius: '3px', cursor: 'pointer',
                        border: m.completed ? 'none' : '1px solid #333',
                        background: m.completed ? '#ffffff' : 'transparent', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {m.completed && <span style={{ color: '#000', fontSize: '9px' }}>✓</span>}
                      </button>
                      <span style={{ fontSize: '11px', color: m.completed ? '#444' : '#aaa', textDecoration: m.completed ? 'line-through' : 'none' }}>{m.title}</span>
                    </div>
                    {m.due_date && <span style={{ fontSize: '10px', color: '#444' }}>{format(new Date(m.due_date + 'T12:00:00'), 'MMM d')}</span>}
                  </div>
                ))}

                {/* Progress slider */}
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '10px', color: '#444' }}>Progress</span>
                  <input type="range" min="0" max="100" value={g.progress}
                    onChange={e => updateProgress(g.id, parseInt(e.target.value))}
                    style={{ flex: 1 }} />
                  <span style={{ fontSize: '10px', color: '#aaa' }}>{g.progress}%</span>
                </div>

                {/* Add milestone */}
                <form onSubmit={e => addMilestone(g.id, e)} style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <input value={newMilestone} onChange={e => setNewMilestone(e.target.value)} placeholder="+ Add milestone"
                    style={{ flex: 1, background: '#0a0a0a', border: '1px solid #222', borderRadius: '6px', padding: '5px 8px', fontSize: '11px', color: '#ffffff', outline: 'none' }} />
                  <button type="submit" disabled={addingMilestone}
                    style={{ background: '#ffffff', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', color: '#000', cursor: 'pointer', fontWeight: 700 }}>
                    Add
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
