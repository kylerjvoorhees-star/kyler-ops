'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Card from '@/app/components/Card'
import AIInsightButton from '@/app/components/AIInsightButton'

interface Task {
  id: string; title: string; description?: string; priority: number
  status: string; due_date?: string; is_blocker?: boolean; temperature?: string
  ai_priority_score?: number; ai_priority_reason?: string
}

const LABEL: React.CSSProperties = {
  fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: '#ffffff',
}

const tempColor: Record<string, string> = {
  hot: '#ff4444', warm: '#ff9900', cool: '#4499ff',
}

const PRIORITY_LABELS: Record<number, string> = { 1: 'urgent', 2: 'high', 3: 'normal', 4: 'low' }

const inputStyle: React.CSSProperties = {
  background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#ffffff',
  borderRadius: '6px', padding: '8px 10px', fontSize: '11px', outline: 'none',
}

export default function BlockersPage() {
  const [blockers, setBlockers] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)
  const [dismissing, setDismissing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', priority: 1, due_date: '', temperature: 'hot', description: '' })
  const [adding, setAdding] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/tasks?is_blocker=true').catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      setBlockers((data.tasks ?? []).filter((t: Task) => t.is_blocker && t.status !== 'done'))
    }
    setLoading(false)
  }

  async function resolve(id: string) {
    setResolving(id)
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    }).catch(() => null)
    setBlockers(b => b.filter(t => t.id !== id))
    setResolving(null)
  }

  async function dismiss(id: string) {
    setDismissing(id)
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_blocker: false }),
    }).catch(() => null)
    setBlockers(b => b.filter(t => t.id !== id))
    setDismissing(null)
  }

  async function addBlocker(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setAdding(true)
    await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        priority: form.priority,
        due_date: form.due_date || undefined,
        temperature: form.temperature,
        description: form.description || undefined,
        is_blocker: true,
      }),
    }).catch(() => null)
    setForm({ title: '', priority: 1, due_date: '', temperature: 'hot', description: '' })
    setShowForm(false); setAdding(false)
    await load()
  }

  function isOverdue(task: Task) {
    if (!task.due_date) return false
    return new Date(task.due_date + 'T23:59:59') < new Date()
  }

  const sortedBlockers = [...blockers].sort((a, b) => {
    const tempOrder: Record<string, number> = { hot: 0, warm: 1, cool: 2 }
    const tA = tempOrder[a.temperature ?? ''] ?? 3
    const tB = tempOrder[b.temperature ?? ''] ?? 3
    if (tA !== tB) return tA - tB
    return (a.priority ?? 3) - (b.priority ?? 3)
  })

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 300, color: '#ffffff', margin: 0 }}>Key Blockers</h1>
            <p style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>
              {blockers.length} active blocker{blockers.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AIInsightButton context="Key Blockers" data={{ blockers: sortedBlockers.map(t => ({ title: t.title, temperature: t.temperature, due_date: t.due_date, priority: t.priority })) }} />
            <button
              onClick={() => setShowForm(v => !v)}
              style={{ background: '#ffffff', borderRadius: '6px', padding: '7px 14px', fontSize: '11px', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              + Add Blocker
            </button>
          </div>
        </div>

        {/* Add blocker form */}
        {showForm && (
          <Card style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ff4444' }} />
              <span style={{ ...LABEL, color: '#ff5555' }}>New Blocker</span>
            </div>
            <form onSubmit={addBlocker} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="What's blocking you?"
                style={{ ...inputStyle, width: '100%' }}
              />
              <input
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description / context (optional)"
                style={{ ...inputStyle, width: '100%' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
                  style={inputStyle}>
                  <option value={1}>⚡ Urgent</option>
                  <option value={2}>↑ High</option>
                  <option value={3}>Normal</option>
                </select>
                <select value={form.temperature} onChange={e => setForm(f => ({ ...f, temperature: e.target.value }))}
                  style={inputStyle}>
                  <option value="hot">🔴 Hot</option>
                  <option value="warm">🟡 Warm</option>
                  <option value="cool">🔵 Cool</option>
                </select>
                <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                  style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" disabled={adding || !form.title.trim()}
                  style={{ background: '#ffffff', borderRadius: '6px', padding: '7px 18px', fontSize: '11px', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, opacity: adding ? 0.5 : 1 }}>
                  {adding ? 'Adding…' : 'Add Blocker ⚡'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ background: 'transparent', border: '1px solid #222', borderRadius: '6px', padding: '7px 14px', fontSize: '11px', color: '#555', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Active blockers */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff4444' }} />
            <span style={{ ...LABEL, color: '#ff5555' }}>Active Blockers</span>
            {blockers.length > 0 && (
              <span style={{ background: '#ff4444', color: '#000', borderRadius: '10px', fontSize: '10px', fontWeight: 700, padding: '1px 7px' }}>{blockers.length}</span>
            )}
          </div>

          {loading ? (
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Loading…</span>
          ) : sortedBlockers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>✓</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>No blockers. Clear runway.</div>
              <div style={{ fontSize: '11px', color: '#333', marginTop: '4px' }}>Add a blocker above if something is holding you back.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sortedBlockers.map(t => {
                const overdue = isOverdue(t)
                return (
                  <div key={t.id} style={{
                    background: '#141414', border: '1px solid #252525',
                    borderLeft: `3px solid ${tempColor[t.temperature ?? ''] ?? '#444'}`,
                    borderRadius: '8px', padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          {t.temperature && (
                            <span style={{
                              fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
                              color: tempColor[t.temperature] ?? '#888',
                              background: (tempColor[t.temperature] ?? '#888') + '22',
                              borderRadius: '3px', padding: '2px 5px',
                            }}>
                              {t.temperature.toUpperCase()}
                            </span>
                          )}
                          <span style={{
                            fontSize: '9px', fontWeight: 600,
                            color: t.priority === 1 ? '#ff4444' : t.priority === 2 ? '#ff9900' : '#555',
                            background: '#1a1a1a', borderRadius: '3px', padding: '2px 5px',
                          }}>
                            {PRIORITY_LABELS[t.priority] ?? 'normal'}
                          </span>
                          {overdue && (
                            <span style={{ fontSize: '9px', fontWeight: 700, color: '#ff4444', background: '#ff444422', borderRadius: '3px', padding: '2px 5px' }}>OVERDUE</span>
                          )}
                        </div>
                        <div style={{ fontSize: '13px', color: '#ffffff', lineHeight: 1.4 }}>{t.title}</div>
                        {t.description && (
                          <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.5, marginTop: '5px' }}>{t.description}</div>
                        )}
                      </div>
                    </div>

                    {t.due_date && (
                      <div style={{ fontSize: '10px', color: overdue ? '#ff4444' : '#444', marginBottom: '10px' }}>
                        Due {format(new Date(t.due_date + 'T12:00:00'), 'MMMM d, yyyy')}
                      </div>
                    )}

                    {t.ai_priority_reason && (
                      <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '5px', padding: '8px 10px', marginBottom: '10px' }}>
                        <div style={{ fontSize: '9px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '3px' }}>AI Note</div>
                        <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.5 }}>{t.ai_priority_reason}</div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => resolve(t.id)}
                        disabled={resolving === t.id}
                        style={{ flex: 1, background: '#222', border: '1px solid #333', borderRadius: '5px', color: '#aaa', fontSize: '11px', fontWeight: 600, padding: '6px 0', cursor: 'pointer', opacity: resolving === t.id ? 0.5 : 1 }}
                      >
                        {resolving === t.id ? '…' : '✓ Resolve'}
                      </button>
                      <button
                        onClick={() => dismiss(t.id)}
                        disabled={dismissing === t.id}
                        style={{ flex: 1, background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '5px', color: '#555', fontSize: '11px', padding: '6px 0', cursor: 'pointer', opacity: dismissing === t.id ? 0.5 : 1 }}
                      >
                        {dismissing === t.id ? '…' : 'Unblock'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
