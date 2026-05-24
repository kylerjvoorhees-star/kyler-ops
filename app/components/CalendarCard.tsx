'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Card from './Card'
import AIInsightButton from './AIInsightButton'

interface CalEvent { id: string; title: string; start_time: string; end_time?: string; event_type: string }

const LABEL: React.CSSProperties = {
  fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: '#ffffff',
}

const typeDot: Record<string, string> = {
  work: '#C9933A',
  personal: '#888',
  health: '#666',
}

export default function CalendarCard() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '',
    endTime: '',
    notes: '',
    allDay: false,
  })
  const [saving, setSaving] = useState(false)

  const today = new Date()
  const dateLabel = format(today, 'EEEE, MMM d')

  useEffect(() => { loadEvents() }, [])

  async function loadEvents() {
    setLoading(true)
    const res = await fetch('/api/calendar/today').catch(() => null)
    if (res?.ok) setEvents((await res.json()).events ?? [])
    setLoading(false)
  }

  async function addEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)

    // Try new CalDAV-aware create endpoint first
    const res = await fetch('/api/calendar/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        startDate: form.date,
        startTime: form.allDay ? undefined : form.startTime || '09:00',
        endTime: form.allDay ? undefined : form.endTime || form.startTime || '10:00',
        notes: form.notes || undefined,
        allDay: form.allDay,
      }),
    }).catch(() => null)

    if (res?.ok) {
      setForm({ title: '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '', endTime: '', notes: '', allDay: false })
      setShowAdd(false)
      await loadEvents()
    }
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    background: '#111', border: '1px solid #2a2a2a', borderRadius: '6px',
    padding: '7px 10px', fontSize: '11px', color: '#ffffff', outline: 'none', width: '100%',
  }

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9933A' }} />
        <span style={LABEL}>Calendar</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AIInsightButton context="Calendar" data={{ events: events.map(e => ({ title: e.title, start: e.start_time, type: e.event_type })), count: events.length }} />
          <button
            onClick={() => setShowAdd(v => !v)}
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
          >+</button>
        </div>
      </div>

      <div style={{ fontSize: '11px', color: '#444', marginBottom: '14px' }}>{dateLabel}</div>

      {showAdd && (
        <form onSubmit={addEvent} style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '12px', padding: '12px', background: '#0a0a0a', borderRadius: '8px', border: '1px solid #1a1a1a' }}>
          <input
            autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Event title" style={inputStyle}
          />
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            style={inputStyle} />

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#777', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.allDay} onChange={e => setForm(f => ({ ...f, allDay: e.target.checked }))} />
            All day
          </label>

          {!form.allDay && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                placeholder="Start time" style={{ ...inputStyle, flex: 1 }} />
              <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                placeholder="End time" style={{ ...inputStyle, flex: 1 }} />
            </div>
          )}

          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (optional)" style={inputStyle} />

          <button type="submit" disabled={saving || !form.title.trim()}
            style={{ background: '#C9933A', borderRadius: '6px', padding: '7px 14px', fontSize: '11px', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, opacity: saving ? 0.5 : 1 }}>
            {saving ? 'Adding…' : 'Add Event'}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0', maxHeight: '240px', overflowY: 'auto' }}>
        {loading ? (
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Loading…</span>
        ) : events.length === 0 ? (
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>Clear schedule today.</span>
        ) : events.map((ev, i) => (
          <div key={ev.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            padding: '9px 0',
            borderBottom: i < events.length - 1 ? '1px solid #1f1f1f' : 'none',
          }}>
            <div style={{ width: '3px', height: '32px', borderRadius: '2px', background: typeDot[ev.event_type] ?? '#555', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '12px', color: '#ffffff' }}>{ev.title}</div>
              <div style={{ fontSize: '10px', color: '#444', marginTop: '2px' }}>
                {format(new Date(ev.start_time), 'h:mm a')}
                {ev.end_time && ` — ${format(new Date(ev.end_time), 'h:mm a')}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
