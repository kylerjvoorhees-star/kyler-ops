'use client'

import { useState, useEffect } from 'react'
import { CalendarDays, Plus, Loader2, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface CalEvent {
  id: string
  title: string
  start_time: string
  end_time?: string
  event_type: 'work' | 'personal' | 'health'
  notes?: string
}

const typeColors: Record<string, string> = {
  work: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
  personal: 'bg-green-500/20 border-green-500/40 text-green-300',
  health: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
}

export default function CalendarCard() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newType, setNewType] = useState<'work' | 'personal' | 'health'>('personal')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadEvents() }, [])

  async function loadEvents() {
    setLoading(true)
    const res = await fetch('/api/calendar/today').catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      setEvents(data.events ?? [])
    }
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
      body: JSON.stringify({
        title: newTitle,
        start_time: `${today}T${newTime}:00`,
        event_type: newType,
      }),
    }).catch(() => null)
    setNewTitle('')
    setNewTime('')
    setShowAdd(false)
    setSaving(false)
    await loadEvents()
  }

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-5 flex flex-col gap-4 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-2">
        <CalendarDays size={16} className="text-blue-400" />
        <span className="text-xs font-semibold tracking-widest text-white/60 uppercase">Calendar</span>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="ml-auto p-1 hover:bg-white/10 rounded-md transition-colors"
        >
          <Plus size={14} className="text-white/40" />
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addEvent} className="space-y-2">
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Event title"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500/50"
          />
          <div className="flex gap-2">
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500/50"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as 'work' | 'personal' | 'health')}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
            >
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="health">Health</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg text-sm transition-colors"
          >
            {saving ? 'Adding…' : 'Add Event'}
          </button>
        </form>
      )}

      <div className="space-y-2 max-h-52 overflow-y-auto">
        {loading ? (
          <div className="flex items-center gap-2 text-white/30 text-sm">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-white/30">No events today — clear schedule.</p>
        ) : (
          events.map((ev) => (
            <div key={ev.id} className={`flex items-start gap-3 rounded-xl border px-3 py-2 ${typeColors[ev.event_type]}`}>
              <Clock size={12} className="mt-0.5 shrink-0 opacity-60" />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{ev.title}</div>
                <div className="text-xs opacity-60">
                  {format(new Date(ev.start_time), 'h:mm a')}
                  {ev.end_time && ` – ${format(new Date(ev.end_time), 'h:mm a')}`}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
