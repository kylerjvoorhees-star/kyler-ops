'use client'

import { useState, useEffect } from 'react'
import Drawer from './Drawer'
import { format } from 'date-fns'

interface Task {
  id: string; title: string; description?: string; priority: number;
  status: 'pending' | 'in_progress' | 'done' | 'cancelled'
  due_date?: string; ai_priority_score?: number; ai_priority_reason?: string; tags?: string[]
}

const PRIORITY_COLORS: Record<number, string> = { 1: '#D85A30', 2: '#EF9F27', 3: '#378ADD', 4: '#1E4060' }
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

  const pending = tasks.filter(t => t.status !== 'done').length
  const topTasks = [...tasks].sort((a, b) => (b.ai_priority_score ?? 0) - (a.ai_priority_score ?? 0)).slice(0, 5)

  return (
    <>
      <div style={{ background: '#071E30', borderRadius: '8px', padding: '18px', border: '0.5px solid #0A2840' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#378ADD' }} />
          <span style={{ fontSize: '9px', letterSpacing: '0.18em', color: '#378ADD', textTransform: 'uppercase' }}>Tasks</span>
          {pending > 0 && (
            <span style={{ fontSize: '9px', padding: '1px 6px', background: '#0A2840', color: '#1E4060', borderRadius: '20px' }}>{pending}</span>
          )}
          <button onClick={loadHistory} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1E4060', cursor: 'pointer', fontSize: '12px' }}>↗</button>
        </div>

        {/* Task list */}
        <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '12px' }}>
          {loading ? (
            <span style={{ fontSize: '11px', color: '#1E4060' }}>Loading…</span>
          ) : topTasks.length === 0 ? (
            <span style={{ fontSize: '12px', color: '#1E4060' }}>No tasks yet. Add one below.</span>
          ) : topTasks.map((t, i) => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 0',
              borderBottom: i < topTasks.length - 1 ? '0.5px solid #0A2840' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flex: 1, minWidth: 0 }}>
                <button
                  onClick={() => toggleDone(t)} disabled={toggling === t.id}
                  style={{
                    width: '13px', height: '13px', borderRadius: '3px', cursor: 'pointer', flexShrink: 0,
                    border: '0.5px solid #0A2840', background: 'transparent',
                  }}
                />
                <button onClick={() => setSelected(t)} style={{
                  background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer',
                  fontSize: '12px', color: '#7AABCC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                }}>
                  {t.title}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: PRIORITY_COLORS[t.priority] ?? '#378ADD' }} />
                {t.due_date && (
                  <span style={{ fontSize: '10px', color: '#1E4060' }}>
                    {format(new Date(t.due_date + 'T12:00:00'), 'MMM d')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: '0.5px', background: '#0A2840', marginBottom: '12px' }} />

        {/* Add task */}
        <form onSubmit={addTask} style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
          <input
            value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="+ Add task…"
            style={{ flex: 1, background: '#040F1C', border: '0.5px solid #0A2840', borderRadius: '5px', padding: '7px 10px', fontSize: '11px', color: '#7AABCC', outline: 'none' }}
          />
          <button type="submit" disabled={adding || !newTitle.trim()}
            style={{ background: '#0F6E56', borderRadius: '5px', padding: '6px 12px', fontSize: '11px', color: '#9FE1CB', border: 'none', cursor: 'pointer', opacity: adding ? 0.5 : 1 }}>
            Add
          </button>
        </form>

        <button onClick={reprioritize} disabled={prioritizing}
          style={{ background: '#0C2E50', border: '0.5px solid #185FA5', borderRadius: '5px', padding: '5px 12px', fontSize: '11px', color: '#378ADD', cursor: 'pointer', opacity: prioritizing ? 0.6 : 1 }}>
          {prioritizing ? 'Prioritizing…' : '✦ AI Reprioritize'}
        </button>
      </div>

      {/* Task detail drawer */}
      {selected && (
        <Drawer open={!!selected} onClose={() => setSelected(null)} title="Task Detail" dotColor="#378ADD">
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '16px', fontWeight: 300, color: '#7AABCC', marginBottom: '8px' }}>{selected.title}</div>
            {selected.description && (
              <div style={{ fontSize: '12px', color: '#1E4060', lineHeight: 1.7 }}>{selected.description}</div>
            )}
          </div>
          <div style={{ height: '0.5px', background: '#0A2840', marginBottom: '14px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Priority', val: PRIORITY_LABELS[selected.priority] ?? 'normal', color: PRIORITY_COLORS[selected.priority] },
              { label: 'Status', val: selected.status },
              ...(selected.due_date ? [{ label: 'Due', val: format(new Date(selected.due_date + 'T12:00:00'), 'MMMM d, yyyy') }] : []),
              ...(selected.ai_priority_score != null ? [{ label: 'AI Score', val: `${selected.ai_priority_score}/10` }] : []),
            ].map(({ label, val, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', letterSpacing: '0.08em', color: '#1E4060', textTransform: 'uppercase' }}>{label}</span>
                <span style={{ fontSize: '12px', color: color ?? '#7AABCC' }}>{val}</span>
              </div>
            ))}
            {selected.ai_priority_reason && (
              <div style={{ background: '#040F1C', borderRadius: '5px', padding: '10px', border: '0.5px solid #0A2840' }}>
                <div style={{ fontSize: '9px', color: '#378ADD', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>AI Reasoning</div>
                <div style={{ fontSize: '11px', color: '#1E4060', lineHeight: 1.6 }}>{selected.ai_priority_reason}</div>
              </div>
            )}
          </div>
          <div style={{ height: '0.5px', background: '#0A2840', margin: '16px 0' }} />
          <button onClick={() => { toggleDone(selected); setSelected(null) }}
            style={{ background: '#0F6E56', borderRadius: '5px', padding: '6px 16px', fontSize: '11px', color: '#9FE1CB', border: 'none', cursor: 'pointer' }}>
            Mark Complete
          </button>
        </Drawer>
      )}

      {/* History drawer */}
      <Drawer open={showHistory && !selected} onClose={() => setShowHistory(false)} title="Tasks History" dotColor="#378ADD">
        <div style={{ fontSize: '9px', letterSpacing: '0.08em', color: '#1E4060', textTransform: 'uppercase', marginBottom: '12px' }}>Completed Tasks</div>
        {doneTasks.length === 0 ? (
          <span style={{ fontSize: '12px', color: '#1E4060' }}>No completed tasks yet.</span>
        ) : doneTasks.map((t, i) => (
          <div key={t.id} style={{ padding: '9px 0', borderBottom: i < doneTasks.length - 1 ? '0.5px solid #0A2840' : 'none' }}>
            <div style={{ fontSize: '12px', color: '#7AABCC', marginBottom: '2px' }}>{t.title}</div>
            {t.due_date && <div style={{ fontSize: '10px', color: '#1E4060' }}>Due {format(new Date(t.due_date + 'T12:00:00'), 'MMM d')}</div>}
          </div>
        ))}
      </Drawer>
    </>
  )
}
