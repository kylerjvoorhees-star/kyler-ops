'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow, format } from 'date-fns'

const TABS = ['PEOPLE', 'TASKS', 'CAPTURES'] as const
type Tab = typeof TABS[number]

interface Contact {
  id: string; name: string; relationship_type: string
  last_contact_date?: string; contact_frequency_days: number
  notes?: string; days_overdue?: number
}

interface Task {
  id: string; title: string; status: string; priority: number
  due_date?: string; is_blocker?: boolean; temperature?: string
  parent_task_id?: string; ai_priority_score?: number
}

interface Capture {
  id: string; content: string; source: string; tags: string[]; created_at: string
}

const relColors: Record<string, string> = {
  friend: '#aaa', family: '#ccc', professional: '#888', lead: '#666',
}

const tempColors: Record<string, string> = { hot: '#ff4444', warm: '#ff9900', cool: '#4499ff' }

// ── PEOPLE TAB ─────────────────────────────────────────────────────────────
function PeopleTab() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Contact | null>(null)
  const [logNote, setLogNote] = useState('')
  const [logging, setLogging] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', relationship_type: 'friend', contact_frequency_days: '14', notes: '' })
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/crm/contacts').catch(() => null)
    if (res?.ok) setContacts((await res.json()).contacts ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function logInteraction() {
    if (!selected) return
    setLogging(true)
    await fetch(`/api/crm/contacts/${selected.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'log_interaction', notes: logNote }),
    }).catch(() => null)
    setLogNote(''); setSelected(null); setLogging(false)
    load()
  }

  async function addContact(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm.name.trim()) return
    setAdding(true)
    await fetch('/api/crm/contacts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...addForm, contact_frequency_days: parseInt(addForm.contact_frequency_days) }),
    }).catch(() => null)
    setAddForm({ name: '', relationship_type: 'friend', contact_frequency_days: '14', notes: '' })
    setShowAdd(false); setAdding(false)
    load()
  }

  const filtered = contacts.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
  const overdue = filtered.filter(c => (c.days_overdue ?? 0) > 0)
  const current = filtered.filter(c => (c.days_overdue ?? 0) <= 0)

  const S: React.CSSProperties = {
    background: '#0a0a0a', border: '1px solid #222', borderRadius: '6px',
    padding: '7px 10px', fontSize: '11px', color: '#fff', outline: 'none',
  }

  return (
    <div>
      {/* Search + Add */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search people…"
          style={{ flex: 1, ...S }} />
        <button onClick={() => setShowAdd(v => !v)}
          style={{ background: '#ffffff', border: 'none', borderRadius: '6px', padding: '7px 16px', fontSize: '11px', color: '#000', cursor: 'pointer', fontWeight: 700 }}>
          + Add
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addContact} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} placeholder="Name" autoFocus style={{ flex: 2, ...S }} />
            <select value={addForm.relationship_type} onChange={e => setAddForm({ ...addForm, relationship_type: e.target.value })} style={{ flex: 1, ...S }}>
              {['friend', 'family', 'professional', 'lead'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input type="number" value={addForm.contact_frequency_days} onChange={e => setAddForm({ ...addForm, contact_frequency_days: e.target.value })} placeholder="Freq days" style={{ width: '80px', ...S }} />
          </div>
          <input value={addForm.notes} onChange={e => setAddForm({ ...addForm, notes: e.target.value })} placeholder="Notes (optional)" style={{ ...S }} />
          <button type="submit" disabled={adding} style={{ background: '#fff', border: 'none', borderRadius: '6px', padding: '7px', fontSize: '11px', color: '#000', cursor: 'pointer', fontWeight: 700, opacity: adding ? 0.5 : 1 }}>
            Add Contact
          </button>
        </form>
      )}

      {selected && (
        <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 300, color: '#fff' }}>{selected.name}</div>
              <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{selected.relationship_type} · every {selected.contact_frequency_days}d</div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '20px' }}>×</button>
          </div>
          {selected.notes && <div style={{ fontSize: '12px', color: '#555', marginBottom: '10px', lineHeight: 1.6 }}>{selected.notes}</div>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={logNote} onChange={e => setLogNote(e.target.value)} placeholder="Log interaction note…"
              style={{ flex: 1, ...S }} />
            <button onClick={logInteraction} disabled={logging}
              style={{ background: '#fff', borderRadius: '6px', padding: '7px 14px', fontSize: '11px', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, opacity: logging ? 0.5 : 1 }}>
              {logging ? '…' : 'Log'}
            </button>
          </div>
        </div>
      )}

      {loading ? <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>Loading…</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {overdue.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', color: '#ff4444', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px' }}>
                Overdue ({overdue.length})
              </div>
              <ContactList contacts={overdue} onSelect={setSelected} selected={selected} />
            </div>
          )}
          {current.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', color: '#444', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px' }}>
                Current
              </div>
              <ContactList contacts={current} onSelect={setSelected} selected={selected} />
            </div>
          )}
          {filtered.length === 0 && <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px' }}>No contacts found.</div>}
        </div>
      )}
    </div>
  )
}

function ContactList({ contacts, onSelect, selected }: { contacts: Contact[]; onSelect: (c: Contact) => void; selected: Contact | null }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
      {contacts.map(c => {
        const overdue = (c.days_overdue ?? 0) > 0
        const isSelected = selected?.id === c.id
        return (
          <button key={c.id} onClick={() => onSelect(c)} style={{
            background: isSelected ? '#1a1a1a' : '#111', border: `1px solid ${isSelected ? '#333' : '#1a1a1a'}`,
            borderRadius: '10px', padding: '14px', cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: relColors[c.relationship_type] ?? '#aaa', fontWeight: 700, flexShrink: 0 }}>
                {c.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>{c.relationship_type}</div>
                <div style={{ fontSize: '10px', color: overdue ? '#ff4444' : '#444', marginTop: '4px' }}>
                  {c.last_contact_date ? formatDistanceToNow(new Date(c.last_contact_date), { addSuffix: true }) : 'never'}
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── TASKS TAB ──────────────────────────────────────────────────────────────
function TasksTab() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [subtasks, setSubtasks] = useState<Record<string, Task[]>>({})
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState(3)
  const [newDue, setNewDue] = useState('')
  const [newIsBlocker, setNewIsBlocker] = useState(false)
  const [newTemp, setNewTemp] = useState('')
  const [adding, setAdding] = useState(false)
  const [newSub, setNewSub] = useState<Record<string, string>>({})
  const [prioritizing, setPrioritizing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/tasks').catch(() => null)
    if (res?.ok) setTasks((await res.json()).tasks ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function loadSubtasks(parentId: string) {
    const res = await fetch(`/api/tasks?parent_id=${parentId}`).catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      setSubtasks(prev => ({ ...prev, [parentId]: data.tasks ?? [] }))
    }
  }

  async function toggleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    await loadSubtasks(id)
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setAdding(true)
    await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, priority: newPriority, due_date: newDue || undefined, is_blocker: newIsBlocker, temperature: newTemp || undefined }),
    }).catch(() => null)
    setNewTitle(''); setNewDue(''); setNewIsBlocker(false); setNewTemp('')
    setAdding(false); load()
  }

  async function addSubtask(parentId: string) {
    const title = newSub[parentId]?.trim()
    if (!title) return
    await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, parent_task_id: parentId, priority: 3 }),
    }).catch(() => null)
    setNewSub(prev => ({ ...prev, [parentId]: '' }))
    loadSubtasks(parentId)
  }

  async function toggleDone(id: string) {
    await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'done' }) }).catch(() => null)
    load()
  }

  async function reprioritize() {
    setPrioritizing(true)
    await fetch('/api/tasks/prioritize', { method: 'POST' }).catch(() => null)
    load()
    setPrioritizing(false)
  }

  const rootTasks = tasks.filter(t => !t.parent_task_id)

  const S: React.CSSProperties = { background: '#0a0a0a', border: '1px solid #222', borderRadius: '6px', padding: '7px 10px', fontSize: '11px', color: '#fff', outline: 'none' }

  return (
    <div>
      {/* Add task form */}
      <form onSubmit={addTask} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="New task…" style={{ flex: 1, ...S }} />
          <select value={newPriority} onChange={e => setNewPriority(parseInt(e.target.value))} style={{ ...S, width: '90px' }}>
            <option value={1}>Urgent</option>
            <option value={2}>High</option>
            <option value={3}>Normal</option>
            <option value={4}>Low</option>
          </select>
          <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)} style={{ ...S, width: '130px', color: newDue ? '#fff' : '#444' }} />
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: '#555' }}>
            <input type="checkbox" checked={newIsBlocker} onChange={e => setNewIsBlocker(e.target.checked)} style={{ accentColor: '#ff4444' }} />
            Blocker
          </label>
          <select value={newTemp} onChange={e => setNewTemp(e.target.value)} style={{ ...S, width: '90px' }}>
            <option value="">Temp</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cool">Cool</option>
          </select>
          <button type="submit" disabled={adding || !newTitle.trim()} style={{ marginLeft: 'auto', background: '#fff', border: 'none', borderRadius: '6px', padding: '7px 16px', fontSize: '11px', color: '#000', cursor: 'pointer', fontWeight: 700, opacity: adding ? 0.5 : 1 }}>
            Add Task
          </button>
        </div>
      </form>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <button onClick={reprioritize} disabled={prioritizing} style={{ background: 'transparent', border: '1px solid #222', borderRadius: '6px', padding: '5px 14px', fontSize: '10px', color: '#555', cursor: 'pointer', fontWeight: 600, letterSpacing: '0.05em' }}>
          {prioritizing ? 'Prioritizing…' : '✦ AI Reprioritize'}
        </button>
      </div>

      {loading ? <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>Loading…</div> : rootTasks.length === 0 ? (
        <div style={{ color: '#333', fontSize: '12px' }}>No tasks. Add one above.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {rootTasks.map((t, i) => (
            <div key={t.id} style={{ borderBottom: i < rootTasks.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0' }}>
                {/* Done checkbox */}
                <button onClick={() => toggleDone(t.id)} style={{ width: '15px', height: '15px', borderRadius: '3px', border: '1px solid #333', background: 'transparent', cursor: 'pointer', flexShrink: 0 }} />
                {/* Blocker */}
                {t.is_blocker && <span style={{ color: '#ff4444', fontSize: '11px', flexShrink: 0 }}>⚡</span>}
                {/* Temp badge */}
                {t.temperature && (
                  <span style={{ fontSize: '9px', fontWeight: 700, color: tempColors[t.temperature] ?? '#888', background: (tempColors[t.temperature] ?? '#888') + '22', borderRadius: '3px', padding: '1px 5px', flexShrink: 0 }}>
                    {t.temperature.toUpperCase()}
                  </span>
                )}
                {/* Title */}
                <span style={{ flex: 1, fontSize: '13px', color: '#aaa' }}>{t.title}</span>
                {/* Due */}
                {t.due_date && (
                  <span style={{ fontSize: '10px', color: '#444', flexShrink: 0 }}>
                    {format(new Date(t.due_date + 'T12:00:00'), 'MMM d')}
                  </span>
                )}
                {/* Expand */}
                <button onClick={() => toggleExpand(t.id)} style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '10px', padding: '0 4px' }}>
                  {expandedId === t.id ? '▲' : '▼'}
                </button>
              </div>

              {/* Subtasks */}
              {expandedId === t.id && (
                <div style={{ paddingLeft: '25px', paddingBottom: '12px' }}>
                  {(subtasks[t.id] ?? []).map(sub => (
                    <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: '1px solid #1a1a1a' }}>
                      <button onClick={() => toggleDone(sub.id)} style={{ width: '12px', height: '12px', borderRadius: '2px', border: '1px solid #2a2a2a', background: 'transparent', cursor: 'pointer', flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: '#666' }}>{sub.title}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    <input
                      value={newSub[t.id] ?? ''} onChange={e => setNewSub(prev => ({ ...prev, [t.id]: e.target.value }))}
                      placeholder="+ Subtask"
                      style={{ flex: 1, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '5px', padding: '5px 8px', fontSize: '11px', color: '#fff', outline: 'none' }}
                    />
                    <button onClick={() => addSubtask(t.id)} style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '5px', padding: '5px 10px', fontSize: '10px', color: '#aaa', cursor: 'pointer' }}>
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── CAPTURES TAB ───────────────────────────────────────────────────────────
function CapturesTab() {
  const [captures, setCaptures] = useState<Capture[]>([])
  const [loading, setLoading] = useState(true)
  const [newContent, setNewContent] = useState('')
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/captures').catch(() => null)
    if (res?.ok) setCaptures((await res.json()).captures ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function addCapture(e: React.FormEvent) {
    e.preventDefault()
    if (!newContent.trim()) return
    setAdding(true)
    await fetch('/api/captures', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent }),
    }).catch(() => null)
    setNewContent(''); setAdding(false); load()
  }

  async function deleteCapture(id: string) {
    await fetch(`/api/captures/${id}`, { method: 'DELETE' }).catch(() => null)
    setCaptures(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div>
      <form onSubmit={addCapture} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <textarea
          value={newContent} onChange={e => setNewContent(e.target.value)}
          placeholder="Capture a thought, link, idea…"
          rows={2}
          style={{ flex: 1, background: '#0a0a0a', border: '1px solid #222', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', color: '#fff', outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
        />
        <button type="submit" disabled={adding || !newContent.trim()}
          style={{ background: '#fff', border: 'none', borderRadius: '6px', padding: '0 18px', fontSize: '11px', color: '#000', cursor: 'pointer', fontWeight: 700, opacity: adding ? 0.5 : 1, flexShrink: 0 }}>
          Save
        </button>
      </form>

      {loading ? <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>Loading…</div> : captures.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px' }}>No captures yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {captures.map(c => (
            <div key={c.id} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '12px 14px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: '#aaa', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{c.content}</div>
                <div style={{ fontSize: '10px', color: '#333', marginTop: '6px' }}>
                  {format(new Date(c.created_at), 'MMM d, h:mm a')}
                </div>
              </div>
              <button onClick={() => deleteCapture(c.id)} style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '14px', padding: '0', flexShrink: 0 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── PAGE ───────────────────────────────────────────────────────────────────
export default function CrmPage() {
  const [tab, setTab] = useState<Tab>('PEOPLE')

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 300, color: '#ffffff', margin: 0 }}>CRM</h1>
        <p style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>People, tasks, and captures</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '24px', borderBottom: '1px solid #1a1a1a', paddingBottom: '0' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '8px 16px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
            color: tab === t ? '#C9933A' : '#444',
            borderBottom: `2px solid ${tab === t ? '#C9933A' : 'transparent'}`,
            marginBottom: '-1px',
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'PEOPLE' && <PeopleTab />}
      {tab === 'TASKS' && <TasksTab />}
      {tab === 'CAPTURES' && <CapturesTab />}
    </div>
  )
}
