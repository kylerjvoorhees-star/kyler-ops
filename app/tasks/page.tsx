'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Card from '@/app/components/Card'
import AIInsightButton from '@/app/components/AIInsightButton'

interface Task {
  id: string; title: string; description?: string; priority: number;
  status: 'pending' | 'in_progress' | 'done' | 'cancelled'
  due_date?: string; ai_priority_score?: number; ai_priority_reason?: string
  tags?: string[]; is_blocker?: boolean; temperature?: string
}

interface FocusItem { id: string; title: string; reason: string }

type Filter = 'all' | 'in_progress' | 'overdue' | 'blockers'

const PRIORITY_LABELS: Record<number, string> = { 1: 'urgent', 2: 'high', 3: 'normal', 4: 'low' }
const PRIORITY_COLORS: Record<number, string> = { 1: '#ff4444', 2: '#ff9900', 3: '#aaaaaa', 4: '#444444' }

const LABEL: React.CSSProperties = {
  fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: '#ffffff',
}

const inputStyle: React.CSSProperties = {
  background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#ffffff',
  borderRadius: '6px', padding: '8px 10px', fontSize: '11px', outline: 'none',
}

function isOverdue(task: Task) {
  if (!task.due_date) return false
  return new Date(task.due_date + 'T23:59:59') < new Date()
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [doneTasks, setDoneTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [focus, setFocus] = useState<FocusItem[]>([])
  const [focusLoading, setFocusLoading] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', priority: 3, due_date: '', is_blocker: false })
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [prioritizing, setPrioritizing] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [active, done] = await Promise.all([
      fetch('/api/tasks').catch(() => null),
      fetch('/api/tasks?status=done').catch(() => null),
    ])
    if (active?.ok) setTasks((await active.json()).tasks ?? [])
    if (done?.ok) setDoneTasks((await done.json()).tasks ?? [])
    setLoading(false)
  }

  async function toggleStatus(task: Task, next: Task['status']) {
    setToggling(task.id)
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    }).catch(() => null)
    await load()
    setToggling(null)
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setAdding(true)
    await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: form.title, priority: form.priority, due_date: form.due_date || undefined, is_blocker: form.is_blocker }),
    }).catch(() => null)
    setForm({ title: '', priority: 3, due_date: '', is_blocker: false })
    setShowForm(false); setAdding(false)
    await load()
  }

  async function getAIFocus() {
    setFocusLoading(true)
    const res = await fetch('/api/tasks/focus', { method: 'POST' }).catch(() => null)
    if (res?.ok) setFocus((await res.json()).focus ?? [])
    setFocusLoading(false)
  }

  async function reprioritize() {
    setPrioritizing(true)
    await fetch('/api/tasks/prioritize', { method: 'POST' }).catch(() => null)
    await load()
    setPrioritizing(false)
  }

  const filteredTasks = tasks.filter(t => {
    if (filter === 'in_progress') return t.status === 'in_progress'
    if (filter === 'overdue') return isOverdue(t)
    if (filter === 'blockers') return t.is_blocker
    return true
  })

  const focusIds = new Set(focus.map(f => f.id))

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'blockers', label: 'Blockers' },
  ]

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 300, color: '#ffffff', margin: 0 }}>Tasks</h1>
            <p style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>
              {tasks.length} active · {doneTasks.length} completed
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AIInsightButton context="Tasks" data={{ tasks: tasks.map(t => ({ title: t.title, priority: t.priority, due_date: t.due_date, is_blocker: t.is_blocker })) }} />
            <button
              onClick={reprioritize} disabled={prioritizing}
              style={{
                background: 'transparent', border: '1px solid #222', borderRadius: '6px',
                padding: '7px 14px', fontSize: '11px', color: '#555',
                cursor: 'pointer', opacity: prioritizing ? 0.5 : 1,
              }}
            >
              {prioritizing ? 'Prioritizing…' : '✦ AI Reprioritize'}
            </button>
            <button
              onClick={() => setShowForm(v => !v)}
              style={{ background: '#ffffff', borderRadius: '6px', padding: '7px 14px', fontSize: '11px', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              + Add Task
            </button>
          </div>
        </div>

        {/* AI Focus */}
        <Card style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9933A' }} />
            <span style={LABEL}>Today&apos;s Focus</span>
            <button
              onClick={getAIFocus} disabled={focusLoading}
              style={{
                marginLeft: 'auto', background: '#C9933A', border: 'none',
                borderRadius: '6px', padding: '6px 14px', fontSize: '11px',
                color: '#000', cursor: 'pointer', fontWeight: 700,
                opacity: focusLoading ? 0.5 : 1,
              }}
            >
              {focusLoading ? 'Thinking…' : '✦ What should I focus on?'}
            </button>
          </div>

          {focus.length === 0 && !focusLoading && (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
              Click the button above to get AI-powered focus recommendations for today.
            </p>
          )}

          {focusLoading && (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Analyzing your task list…</p>
          )}

          {focus.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {focus.map((item, i) => (
                <div key={item.id} style={{
                  background: '#0a0a0a', border: '1px solid rgba(201,147,58,0.3)',
                  borderLeft: '3px solid #C9933A', borderRadius: '6px', padding: '10px 14px',
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                }}>
                  <span style={{ fontSize: '10px', color: '#C9933A', fontWeight: 700, flexShrink: 0, marginTop: '2px' }}>#{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', color: '#ffffff', marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.5 }}>{item.reason}</div>
                  </div>
                  <button
                    onClick={() => toggleStatus({ id: item.id, status: 'pending' } as Task, 'in_progress')}
                    style={{
                      background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '5px',
                      padding: '4px 10px', fontSize: '10px', color: '#555', cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    Start →
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Add task form */}
        {showForm && (
          <Card style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9933A' }} />
              <span style={LABEL}>New Task</span>
            </div>
            <form onSubmit={addTask} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Task title"
                style={{ ...inputStyle, width: '100%' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
                  style={{ ...inputStyle, flex: 1 }}
                >
                  <option value={1}>Urgent</option>
                  <option value={2}>High</option>
                  <option value={3}>Normal</option>
                  <option value={4}>Low</option>
                </select>
                <input
                  type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#666', cursor: 'pointer' }}>
                <input
                  type="checkbox" checked={form.is_blocker}
                  onChange={e => setForm(f => ({ ...f, is_blocker: e.target.checked }))}
                />
                Mark as blocker ⚡
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" disabled={adding || !form.title.trim()}
                  style={{ background: '#ffffff', borderRadius: '6px', padding: '7px 18px', fontSize: '11px', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, opacity: adding ? 0.5 : 1 }}>
                  {adding ? 'Adding…' : 'Add Task'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ background: 'transparent', border: '1px solid #222', borderRadius: '6px', padding: '7px 14px', fontSize: '11px', color: '#555', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Task list */}
        <Card style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9933A' }} />
            <span style={LABEL}>Active Tasks</span>
            <span style={{ fontSize: '10px', color: '#444', marginLeft: '4px' }}>{filteredTasks.length}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  style={{
                    background: filter === f.key ? '#C9933A' : 'transparent',
                    border: `1px solid ${filter === f.key ? '#C9933A' : '#222'}`,
                    borderRadius: '4px', padding: '3px 8px', fontSize: '10px',
                    color: filter === f.key ? '#000' : '#555',
                    cursor: 'pointer', fontWeight: filter === f.key ? 700 : 400,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Loading…</span>
          ) : filteredTasks.length === 0 ? (
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
              {filter === 'all' ? 'No active tasks.' : `No ${filter.replace('_', ' ')} tasks.`}
            </span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredTasks.map((task, i) => {
                const overdue = isOverdue(task)
                const isFocused = focusIds.has(task.id)
                return (
                  <div key={task.id} style={{ borderBottom: i < filteredTasks.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 0',
                      background: isFocused ? 'rgba(201,147,58,0.04)' : 'transparent',
                    }}>
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleStatus(task, 'done')}
                        disabled={toggling === task.id}
                        style={{
                          width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                          border: '1px solid #333', background: task.status === 'in_progress' ? '#1a1a1a' : 'transparent',
                          cursor: 'pointer',
                        }}
                      />

                      {/* Title */}
                      <button
                        onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
                        style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', flex: 1, minWidth: 0 }}
                      >
                        <div style={{ fontSize: '12px', color: '#aaaaaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.is_blocker && <span style={{ color: '#ff4444', marginRight: '5px' }}>⚡</span>}
                          {isFocused && <span style={{ color: '#C9933A', marginRight: '5px' }}>★</span>}
                          {task.title}
                        </div>
                      </button>

                      {/* Meta */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {task.status === 'in_progress' && (
                          <span style={{ fontSize: '9px', background: '#1a2a1a', color: '#4a9', borderRadius: '3px', padding: '2px 5px', fontWeight: 700 }}>ACTIVE</span>
                        )}
                        <span style={{ fontSize: '10px', color: PRIORITY_COLORS[task.priority] ?? '#444', fontWeight: 600 }}>
                          {PRIORITY_LABELS[task.priority] ?? ''}
                        </span>
                        {task.due_date && (
                          <span style={{ fontSize: '10px', color: overdue ? '#ff4444' : '#444' }}>
                            {overdue ? '!' : ''}{format(new Date(task.due_date + 'T12:00:00'), 'MMM d')}
                          </span>
                        )}
                        {task.ai_priority_score != null && (
                          <span style={{ fontSize: '10px', color: '#333' }}>{task.ai_priority_score.toFixed(0)}/10</span>
                        )}
                      </div>
                    </div>

                    {/* Expanded */}
                    {expandedId === task.id && (
                      <div style={{ padding: '0 0 12px 26px' }}>
                        {task.description && (
                          <p style={{ fontSize: '12px', color: '#666', lineHeight: 1.7, margin: '0 0 10px' }}>{task.description}</p>
                        )}
                        {task.ai_priority_reason && (
                          <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '8px 12px', marginBottom: '10px' }}>
                            <div style={{ fontSize: '9px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>AI Reasoning</div>
                            <div style={{ fontSize: '11px', color: '#777', lineHeight: 1.6 }}>{task.ai_priority_reason}</div>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => toggleStatus(task, task.status === 'in_progress' ? 'pending' : 'in_progress')}
                            style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '5px', padding: '4px 10px', fontSize: '10px', color: '#aaa', cursor: 'pointer' }}
                          >
                            {task.status === 'in_progress' ? 'Pause' : '→ Start'}
                          </button>
                          <button
                            onClick={() => { toggleStatus(task, 'done'); setExpandedId(null) }}
                            style={{ background: '#ffffff', border: 'none', borderRadius: '5px', padding: '4px 10px', fontSize: '10px', color: '#000', cursor: 'pointer', fontWeight: 700 }}
                          >
                            ✓ Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Completed */}
        <Card>
          <button
            onClick={() => setShowDone(v => !v)}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#333' }} />
            <span style={{ ...LABEL, color: '#444' }}>Completed</span>
            <span style={{ fontSize: '10px', color: '#333', marginLeft: '4px' }}>{doneTasks.length}</span>
            <span style={{ fontSize: '10px', color: '#333', marginLeft: 'auto' }}>{showDone ? '▲' : '▼'}</span>
          </button>

          {showDone && (
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '0' }}>
              {doneTasks.length === 0 ? (
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>No completed tasks.</span>
              ) : doneTasks.map((t, i) => (
                <div key={t.id} style={{ padding: '8px 0', borderBottom: i < doneTasks.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                  <div style={{ fontSize: '12px', color: '#444', textDecoration: 'line-through' }}>{t.title}</div>
                  {t.due_date && <div style={{ fontSize: '10px', color: '#333', marginTop: '2px' }}>Due {format(new Date(t.due_date + 'T12:00:00'), 'MMM d')}</div>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
