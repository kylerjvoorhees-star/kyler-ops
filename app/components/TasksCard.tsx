'use client'

import { useState, useEffect } from 'react'
import Drawer from './Drawer'
import { format } from 'date-fns'

interface Task {
  id: string; title: string; description?: string; priority: number;
  status: 'pending' | 'in_progress' | 'done' | 'cancelled'
  due_date?: string; ai_priority_score?: number; ai_priority_reason?: string
  tags?: string[]; is_blocker?: boolean; temperature?: string
}

const PRIORITY_LABELS: Record<number, string> = { 1: 'urgent', 2: 'high', 3: 'normal', 4: 'low' }

export default function TasksCard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [doneTasks, setDoneTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [prioritizing, setPrioritizing] = useState(false)
  const [selected, setSelected] = useState<Task | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => { loadTasks() }, [])

  async function loadTasks() {
    setLoading(true)
    const res = await fetch('/api/tasks').catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      setTasks((data.tasks ?? []).filter((t: Task) => t.status !== 'done'))
    }
    setLoading(false)
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setAdding(true)
    await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    }).catch(() => null)
    setNewTitle(''); setAdding(false)
    await loadTasks()
  }

  async function toggleDone(task: Task) {
    setToggling(task.id)
    const next = task.status === 'done' ? 'pending' : 'done'
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    }).catch(() => null)
    await loadTasks()
    setToggling(null)
  }

  async function reprioritize() {
    setPrioritizing(true)
    await fetch('/api/tasks/prioritize', { method: 'POST' }).catch(() => null)
    await loadTasks()
    setPrioritizing(false)
  }

  async function loadHistory() {
    const res = await fetch('/api/tasks?status=done').catch(() => null)
    if (res?.ok) setDoneTasks((await res.json()).tasks ?? [])
    setShowHistory(true)
  }

  const topTasks = tasks.slice(0, 6)

  return (
    <>
      <div style={{ background: '#111111', borderRadius: '10px', padding: '18px', border: '1px solid #1a1a1a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ffffff' }} />
          <span style={{ fontSize: '10px', letterSpacing: '0.14em', color: '#ffffff', textTransform: 'uppercase', fontWeight: 700 }}>Tasks</span>
          {tasks.length > 0 && (
            <span style={{ fontSize: '9px', padding: '1px 7px', background: '#1a1a1a', color: '#555', borderRadius: '20px', fontWeight: 600 }}>{tasks.length}</span>
          )}
          <button onClick={loadHistory} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '13px' }}>↗</button>
        </div>

        {/* Task list */}
        <div style={{ marginBottom: '12px' }}>
          {loading ? (
            <span style={{ fontSize: '11px', color: '#333' }}>Loading…</span>
          ) : topTasks.length === 0 ? (
            <span style={{ fontSize: '12px', color: '#333' }}>No tasks. Add one below.</span>
          ) : topTasks.map((t, i) => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 0',
              borderBottom: i < topTasks.length - 1 ? '1px solid #1a1a1a' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flex: 1, minWidth: 0 }}>
                <button
                  onClick={() => toggleDone(t)} disabled={toggling === t.id}
                  style={{
                    width: '14px', height: '14px', borderRadius: '3px', cursor: 'pointer', flexShrink: 0,
                    border: '1px solid #333', background: 'transparent',
                  }}
                />
                <button onClick={() => setSelected(t)} style={{
                  background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer',
                  fontSize: '12px', color: '#aaaaaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                }}>
                  {t.is_blocker && <span style={{ color: '#ff4444', marginRight: '5px' }}>⚡</span>}
                  {t.title}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {t.due_date && (
                  <span style={{ fontSize: '10px', color: '#444' }}>
                    {format(new Date(t.due_date + 'T12:00:00'), 'MMM d')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: '1px', background: '#1a1a1a', marginBottom: '12px' }} />

        {/* Add task */}
        <form onSubmit={addTask} style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
          <input
            value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Add task…"
            style={{ flex: 1, background: '#0a0a0a', border: '1px solid #222', borderRadius: '6px', padding: '7px 10px', fontSize: '11px', color: '#ffffff', outline: 'none' }}
          />
          <button type="submit" disabled={adding || !newTitle.trim()}
            style={{ background: '#ffffff', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, opacity: adding ? 0.5 : 1 }}>
            Add
          </button>
        </form>

        <button onClick={reprioritize} disabled={prioritizing}
          style={{ background: 'transparent', border: '1px solid #222', borderRadius: '6px', padding: '5px 12px', fontSize: '10px', color: '#555', cursor: 'pointer', fontWeight: 600, letterSpacing: '0.05em', opacity: prioritizing ? 0.5 : 1 }}>
          {prioritizing ? 'Prioritizing…' : '✦ AI Reprioritize'}
        </button>
      </div>

      {/* Task detail drawer */}
      {selected && (
        <Drawer open={!!selected} onClose={() => setSelected(null)} title="Task Detail" dotColor="#ffffff">
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '16px', fontWeight: 300, color: '#ffffff', marginBottom: '8px' }}>{selected.title}</div>
            {selected.description && (
              <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.7 }}>{selected.description}</div>
            )}
          </div>
          <div style={{ height: '1px', background: '#1a1a1a', marginBottom: '14px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Priority', val: PRIORITY_LABELS[selected.priority] ?? 'normal' },
              { label: 'Status', val: selected.status },
              ...(selected.due_date ? [{ label: 'Due', val: format(new Date(selected.due_date + 'T12:00:00'), 'MMMM d, yyyy') }] : []),
              ...(selected.ai_priority_score != null ? [{ label: 'AI Score', val: `${selected.ai_priority_score}/10` }] : []),
              ...(selected.is_blocker ? [{ label: 'Blocker', val: 'Yes ⚡' }] : []),
            ].map(({ label, val }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', letterSpacing: '0.1em', color: '#444', textTransform: 'uppercase' }}>{label}</span>
                <span style={{ fontSize: '12px', color: '#aaaaaa' }}>{val}</span>
              </div>
            ))}
            {selected.ai_priority_reason && (
              <div style={{ background: '#0a0a0a', borderRadius: '6px', padding: '10px', border: '1px solid #1a1a1a', marginTop: '4px' }}>
                <div style={{ fontSize: '9px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>AI Reasoning</div>
                <div style={{ fontSize: '11px', color: '#888', lineHeight: 1.6 }}>{selected.ai_priority_reason}</div>
              </div>
            )}
          </div>
          <div style={{ height: '1px', background: '#1a1a1a', margin: '16px 0' }} />
          <button onClick={() => { toggleDone(selected); setSelected(null) }}
            style={{ background: '#ffffff', borderRadius: '6px', padding: '7px 18px', fontSize: '11px', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            Mark Complete
          </button>
        </Drawer>
      )}

      {/* History drawer */}
      <Drawer open={showHistory && !selected} onClose={() => setShowHistory(false)} title="Completed Tasks" dotColor="#ffffff">
        <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: '#444', textTransform: 'uppercase', marginBottom: '12px' }}>Completed</div>
        {doneTasks.length === 0 ? (
          <span style={{ fontSize: '12px', color: '#333' }}>No completed tasks yet.</span>
        ) : doneTasks.map((t, i) => (
          <div key={t.id} style={{ padding: '9px 0', borderBottom: i < doneTasks.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px', textDecoration: 'line-through' }}>{t.title}</div>
            {t.due_date && <div style={{ fontSize: '10px', color: '#444' }}>Due {format(new Date(t.due_date + 'T12:00:00'), 'MMM d')}</div>}
          </div>
        ))}
      </Drawer>
    </>
  )
}
