'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface Milestone { id: string; title: string; completed: boolean; due_date?: string }
interface Goal {
  id: string; title: string; category?: string; target_date?: string
  progress: number; status: string; milestones?: Milestone[]
}

const CATEGORY_COLORS: Record<string, string> = {
  health: '#5DCAA5', career: '#378ADD', finance: '#1D9E75',
  relationships: '#EF9F27', personal: '#185FA5',
}

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
    <div style={{ background: '#071E30', borderRadius: '8px', padding: '18px', border: '0.5px solid #0A2840' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1D9E75' }} />
        <span style={{ fontSize: '9px', letterSpacing: '0.18em', color: '#378ADD', textTransform: 'uppercase' }}>Goals</span>
        <button onClick={() => setShowAdd(v => !v)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1E4060', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>+</button>
      </div>

      {showAdd && (
        <form onSubmit={addGoal} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Goal title"
            style={{ background: '#040F1C', border: '0.5px solid #0A2840', borderRadius: '5px', padding: '7px 10px', fontSize: '11px', color: '#7AABCC', outline: 'none', width: '100%' }} autoFocus />
          <div style={{ display: 'flex', gap: '6px' }}>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              style={{ flex: 1, background: '#040F1C', border: '0.5px solid #0A2840', borderRadius: '5px', padding: '7px 8px', fontSize: '11px', color: '#7AABCC', outline: 'none' }}>
              {['health', 'career', 'finance', 'relationships', 'personal'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })}
              style={{ flex: 1, background: '#040F1C', border: '0.5px solid #0A2840', borderRadius: '5px', padding: '7px 8px', fontSize: '11px', color: form.target_date ? '#7AABCC' : '#1E4060', outline: 'none' }} />
          </div>
          <button type="submit" disabled={adding}
            style={{ background: '#0F6E56', borderRadius: '5px', padding: '6px 14px', fontSize: '11px', color: '#9FE1CB', border: 'none', cursor: 'pointer', opacity: adding ? 0.5 : 1 }}>
            Add Goal
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0', maxHeight: '280px', overflowY: 'auto' }}>
        {loading ? (
          <span style={{ fontSize: '11px', color: '#1E4060' }}>Loading…</span>
        ) : goals.length === 0 ? (
          <span style={{ fontSize: '12px', color: '#1E4060' }}>No goals yet. Add one to start tracking.</span>
        ) : goals.map((g, i) => (
          <div key={g.id} style={{ borderBottom: i < goals.length - 1 ? '0.5px solid #0A2840' : 'none' }}>
            <button onClick={() => toggleExpand(g.id)} style={{
              display: 'flex', flexDirection: 'column', gap: '7px', padding: '10px 0',
              background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: '12px', color: '#7AABCC' }}>{g.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {g.category && (
                    <span style={{
                      fontSize: '9px', padding: '2px 7px', borderRadius: '20px',
                      background: '#040F1C', color: CATEGORY_COLORS[g.category] ?? '#378ADD',
                      border: `0.5px solid ${CATEGORY_COLORS[g.category] ?? '#378ADD'}22`,
                    }}>{g.category}</span>
                  )}
                  {g.target_date && (
                    <span style={{ fontSize: '10px', color: '#1E4060' }}>
                      {format(new Date(g.target_date + 'T12:00:00'), 'MMM d')}
                    </span>
                  )}
                  <span style={{ fontSize: '10px', color: expanded === g.id ? '#378ADD' : '#1E4060' }}>
                    {expanded === g.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ width: '100%', height: '3px', background: '#0A2840', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${g.progress}%`, background: '#1D9E75', borderRadius: '2px', transition: 'width 0.4s' }} />
              </div>
              <div style={{ fontSize: '10px', color: '#1E4060' }}>{g.progress}%</div>
            </button>

            {/* Expanded milestones */}
            {expanded === g.id && (
              <div style={{ paddingBottom: '12px', paddingLeft: '8px' }}>
                {(g.milestones ?? []).map(m => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 0', borderBottom: '0.5px solid #0A2840',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <button onClick={() => toggleMilestone(g.id, m.id)} style={{
                        width: '13px', height: '13px', borderRadius: '3px', cursor: 'pointer',
                        border: m.completed ? '1px solid #185FA5' : '0.5px solid #0A2840',
                        background: m.completed ? '#0C2E50' : 'transparent', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {m.completed && <div style={{ width: '5px', height: '5px', background: '#5DCAA5', borderRadius: '1px' }} />}
                      </button>
                      <span style={{ fontSize: '11px', color: m.completed ? '#1E4060' : '#7AABCC', textDecoration: m.completed ? 'line-through' : 'none' }}>{m.title}</span>
                    </div>
                    {m.due_date && <span style={{ fontSize: '10px', color: '#0E2030' }}>{format(new Date(m.due_date + 'T12:00:00'), 'MMM d')}</span>}
                  </div>
                ))}

                {/* Progress slider */}
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '10px', color: '#1E4060' }}>Progress</span>
                  <input type="range" min="0" max="100" value={g.progress}
                    onChange={e => updateProgress(g.id, parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: '#1D9E75' }} />
                  <span style={{ fontSize: '10px', color: '#5DCAA5' }}>{g.progress}%</span>
                </div>

                {/* Add milestone */}
                <form onSubmit={e => addMilestone(g.id, e)} style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <input value={newMilestone} onChange={e => setNewMilestone(e.target.value)} placeholder="+ Add milestone"
                    style={{ flex: 1, background: '#040F1C', border: '0.5px solid #0A2840', borderRadius: '5px', padding: '5px 8px', fontSize: '11px', color: '#7AABCC', outline: 'none' }} />
                  <button type="submit" disabled={addingMilestone}
                    style={{ background: '#0C2E50', border: '0.5px solid #185FA5', borderRadius: '5px', padding: '5px 10px', fontSize: '11px', color: '#378ADD', cursor: 'pointer' }}>
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
