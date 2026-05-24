'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, startOfDay, endOfDay, addMonths } from 'date-fns'
import Card from '@/app/components/Card'
import AIInsightButton from '@/app/components/AIInsightButton'

interface CalEvent {
  id: string; title: string; start_time: string; end_time?: string
  event_type: string; notes?: string
}

const LABEL: React.CSSProperties = {
  fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: '#ffffff',
}

const typeDot: Record<string, string> = {
  work: '#C9933A', personal: '#888', health: '#666',
}

const inputStyle: React.CSSProperties = {
  background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#ffffff',
  borderRadius: '6px', padding: '8px 10px', fontSize: '11px', outline: 'none',
}

function formatTime(iso: string) {
  try { return format(new Date(iso), 'h:mm a') } catch { return '' }
}

export default function CalendarPage() {
  const [allEvents, setAllEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '', endTime: '', notes: '', allDay: false, event_type: 'personal',
  })

  const today = format(new Date(), 'yyyy-MM-dd')
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    // Fetch next 30 days of events
    const since = new Date()
    const until = addMonths(since, 1)
    const res = await fetch('/api/calendar/events?' + new URLSearchParams({
      since: startOfDay(since).toISOString(),
      until: endOfDay(until).toISOString(),
    })).catch(() => null)

    if (res?.ok) {
      const data = await res.json()
      setAllEvents(data.events ?? [])
    } else {
      // Try the today endpoint as fallback
      const todayRes = await fetch('/api/calendar/today').catch(() => null)
      if (todayRes?.ok) setAllEvents((await todayRes.json()).events ?? [])
    }
    setLoading(false)
  }

  async function addEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)

    const res = await fetch('/api/calendar/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
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
      setForm({ title: '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '', endTime: '', notes: '', allDay: false, event_type: 'personal' })
      setShowForm(false)
      await load()
    }
    setSaving(false)
  }

  // Group events by date
  function eventsForDay(day: Date): CalEvent[] {
    const dateStr = format(day, 'yyyy-MM-dd')
    return allEvents.filter(ev => {
      try { return format(new Date(ev.start_time), 'yyyy-MM-dd') === dateStr } catch { return false }
    }).sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  // Upcoming events (next 30 days, sorted)
  const upcoming = [...allEvents].sort((a, b) => a.start_time.localeCompare(b.start_time))

  // Today's events
  const todayEvents = eventsForDay(new Date())

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 300, color: '#ffffff', margin: 0 }}>Calendar</h1>
            <p style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AIInsightButton context="Calendar" data={{ events: upcoming.slice(0, 10).map(e => ({ title: e.title, date: e.start_time, type: e.event_type })) }} />
            <button
              onClick={() => setShowForm(v => !v)}
              style={{ background: '#C9933A', borderRadius: '6px', padding: '7px 14px', fontSize: '11px', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              + Add Event
            </button>
          </div>
        </div>

        {/* Add event form */}
        {showForm && (
          <Card style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9933A' }} />
              <span style={LABEL}>New Event</span>
            </div>
            <form onSubmit={addEvent} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Event title" style={{ ...inputStyle, width: '100%' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  style={{ ...inputStyle, flex: 1 }} />
                <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}
                  style={{ ...inputStyle, flex: 1 }}>
                  <option value="personal">Personal</option>
                  <option value="work">Work</option>
                  <option value="health">Health</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#666', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.allDay} onChange={e => setForm(f => ({ ...f, allDay: e.target.checked }))} />
                All day
              </label>
              {!form.allDay && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    placeholder="Start" style={{ ...inputStyle, flex: 1 }} />
                  <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    placeholder="End" style={{ ...inputStyle, flex: 1 }} />
                </div>
              )}
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notes (optional)" style={{ ...inputStyle, width: '100%' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" disabled={saving || !form.title.trim()}
                  style={{ background: '#C9933A', borderRadius: '6px', padding: '7px 18px', fontSize: '11px', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, opacity: saving ? 0.5 : 1 }}>
                  {saving ? 'Adding…' : 'Add Event'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ background: 'transparent', border: '1px solid #222', borderRadius: '6px', padding: '7px 14px', fontSize: '11px', color: '#555', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Today */}
        {todayEvents.length > 0 && (
          <Card style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9933A' }} />
              <span style={LABEL}>Today</span>
              <span style={{ fontSize: '11px', color: '#444', marginLeft: '4px' }}>{todayEvents.length} event{todayEvents.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {todayEvents.map((ev, i) => (
                <div key={ev.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0',
                  borderBottom: i < todayEvents.length - 1 ? '1px solid #1a1a1a' : 'none',
                }}>
                  <div style={{ width: '3px', height: '28px', background: typeDot[ev.event_type] ?? '#555', borderRadius: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', color: '#ffffff' }}>{ev.title}</div>
                    {!ev.title.startsWith('(all day)') && (
                      <div style={{ fontSize: '10px', color: '#444', marginTop: '2px' }}>
                        {formatTime(ev.start_time)}{ev.end_time ? ` — ${formatTime(ev.end_time)}` : ''}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '9px', color: '#444', background: '#1a1a1a', borderRadius: '3px', padding: '2px 6px' }}>{ev.event_type}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Week view */}
        <Card style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9933A' }} />
            <span style={LABEL}>This Week</span>
            <span style={{ fontSize: '11px', color: '#444', marginLeft: '4px' }}>
              {format(weekStart, 'MMM d')} — {format(addDays(weekStart, 6), 'MMM d')}
            </span>
          </div>

          {loading ? (
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Loading…</span>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {weekDays.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd')
                const isToday = dayStr === today
                const dayEvents = eventsForDay(day)
                return (
                  <div key={dayStr} style={{
                    border: isToday ? '1px solid #C9933A' : '1px solid #1a1a1a',
                    borderRadius: '8px', padding: '8px 6px', minHeight: '90px',
                    background: isToday ? 'rgba(201,147,58,0.04)' : 'transparent',
                  }}>
                    <div style={{ fontSize: '9px', color: isToday ? '#C9933A' : '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>
                      {format(day, 'EEE')}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 300, color: isToday ? '#C9933A' : '#666', marginBottom: '6px' }}>
                      {format(day, 'd')}
                    </div>
                    {dayEvents.map(ev => (
                      <div key={ev.id} style={{
                        fontSize: '9px', color: '#aaaaaa', background: '#1a1a1a',
                        borderRadius: '3px', padding: '2px 4px', marginBottom: '3px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        borderLeft: `2px solid ${typeDot[ev.event_type] ?? '#555'}`,
                      }}>
                        {ev.title}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Upcoming list */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9933A' }} />
            <span style={LABEL}>Upcoming 30 Days</span>
            <span style={{ fontSize: '10px', color: '#444', marginLeft: '4px' }}>{upcoming.length} events</span>
          </div>

          {upcoming.length === 0 ? (
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>No upcoming events.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {upcoming.map((ev, i) => (
                <div key={ev.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 0',
                  borderBottom: i < upcoming.length - 1 ? '1px solid #1a1a1a' : 'none',
                }}>
                  <div style={{ width: '3px', height: '32px', background: typeDot[ev.event_type] ?? '#555', borderRadius: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                    <div style={{ fontSize: '10px', color: '#444', marginTop: '2px' }}>
                      {format(new Date(ev.start_time), 'EEE, MMM d')}
                      {' · '}
                      {formatTime(ev.start_time)}
                      {ev.end_time && ` — ${formatTime(ev.end_time)}`}
                    </div>
                  </div>
                  <span style={{ fontSize: '9px', color: '#444', background: '#1a1a1a', borderRadius: '3px', padding: '2px 6px', flexShrink: 0 }}>{ev.event_type}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
