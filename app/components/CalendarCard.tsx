'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface CalEvent { id: string; title: string; start_time: string; end_time?: string; event_type: string }

const typeColors: Record<string, string> = {
  work: '#185FA5', personal: '#1D9E75', health: '#5DCAA5',
}

export default function CalendarCard() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newType, setNewType] = useState('personal')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadEvents() }, [])

  async function loadEvents() {
    setLoading(true)
    const res = await fetch('/api/calendar/today').catch(() => null)
    if (res?.ok) setEvents((await res.json()).events ?? [])
    setLoading(false)
  }

  async function addEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || !newTime) return
    setSaving(true)
    const today = format(new Date(), 'yyyy-MM-dd')
    await fetch('/api/calendar/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, start_time: `${today}T${newTime}:00`, event_type: newType }),
    }).catch(() => null)
    setNewTitle(''); setNewTime(''); setShowAdd(false); setSaving(false)
    await loadEvents()
  }

  return (
    <div style={{ background: '#071E30', borderRadius: '8px', padding: '18px', border: '0.5px solid #0A2840' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#378ADD' }} />
        <span style={{ fontSize: '9px', letterSpacing: '0.18em', color: '#378ADD', textTransform: 'uppercase' }}>Calendar</span>
        <button
          onClick={() => setShowAdd(v => !v)}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1E4060', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
        >+</button>
      </div>

      {showAdd && (
        <form onSubmit={addEvent} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
          <input
            autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Event title"
            style={{ background: '#040F1C', border: '0.5px solid #0A2840', borderRadius: '5px', padding: '7px 10px', fontSize: '11px', color: '#7AABCC', outline: 'none', width: '100%' }}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
              style={{ flex: 1, background: '#040F1C', border: '0.5px solid #0A2840', borderRadius: '5px', padding: '7px 10px', fontSize: '11px', color: '#7AABCC', outline: 'none' }} />
            <select value={newType} onChange={e => setNewType(e.target.value)}
              style={{ background: '#040F1C', border: '0.5px solid #0A2840', borderRadius: '5px', padding: '7px 8px', fontSize: '11px', color: '#7AABCC', outline: 'none' }}>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="health">Health</option>
            </select>
          </div>
          <button type="submit" disabled={saving}
            style={{ background: '#0F6E56', borderRadius: '5px', padding: '6px 14px', fontSize: '11px', color: '#9FE1CB', border: 'none', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
            {saving ? 'Adding…' : 'Add Event'}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0', maxHeight: '200px', overflowY: 'auto' }}>
        {loading ? (
          <span style={{ fontSize: '11px', color: '#1E4060' }}>Loading…</span>
        ) : events.length === 0 ? (
          <span style={{ fontSize: '12px', color: '#1E4060' }}>Clear schedule today.</span>
        ) : events.map((ev, i) => (
          <div key={ev.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            padding: '9px 0',
            borderBottom: i < events.length - 1 ? '0.5px solid #0A2840' : 'none',
          }}>
            <div style={{ width: '3px', height: '32px', borderRadius: '2px', background: typeColors[ev.event_type] ?? '#378ADD', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '12px', color: '#7AABCC' }}>{ev.title}</div>
              <div style={{ fontSize: '10px', color: '#1E4060', marginTop: '2px' }}>
                {format(new Date(ev.start_time), 'h:mm a')}
                {ev.end_time && ` — ${format(new Date(ev.end_time), 'h:mm a')}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
