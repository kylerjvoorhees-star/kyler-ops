'use client'

import { useState, useEffect } from 'react'
import { Users, Search, Loader2, MessageCircle, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Contact {
  id: string
  name: string
  relationship_type: string
  last_contact_date?: string
  contact_frequency_days: number
  notes?: string
  days_overdue?: number
}

export default function CrmCard() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Contact | null>(null)
  const [logNote, setLogNote] = useState('')
  const [logging, setLogging] = useState(false)

  useEffect(() => { loadContacts() }, [])

  async function loadContacts() {
    setLoading(true)
    const res = await fetch('/api/crm/contacts').catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      setContacts(data.contacts ?? [])
    }
    setLoading(false)
  }

  async function logInteraction() {
    if (!selected) return
    setLogging(true)
    await fetch(`/api/crm/contacts/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'log_interaction', notes: logNote }),
    }).catch(() => null)
    setLogNote('')
    setSelected(null)
    setLogging(false)
    await loadContacts()
  }

  const typeColors: Record<string, string> = {
    friend: 'text-green-400',
    family: 'text-pink-400',
    professional: 'text-blue-400',
    lead: 'text-yellow-400',
  }

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-5 flex flex-col gap-4 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-2">
        <Users size={16} className="text-green-400" />
        <span className="text-xs font-semibold tracking-widest text-white/60 uppercase">CRM</span>
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts…"
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-green-500/50"
        />
      </div>

      {selected && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{selected.name}</span>
            <button onClick={() => setSelected(null)}><X size={14} className="text-white/40" /></button>
          </div>
          {selected.notes && <p className="text-xs text-white/50">{selected.notes}</p>}
          <div className="flex gap-2">
            <input
              type="text"
              value={logNote}
              onChange={(e) => setLogNote(e.target.value)}
              placeholder="Interaction note…"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none"
            />
            <button
              onClick={logInteraction}
              disabled={logging}
              className="px-2 py-1 bg-green-600 hover:bg-green-500 disabled:opacity-40 rounded-lg text-xs transition-colors"
            >
              {logging ? <Loader2 size={12} className="animate-spin" /> : 'Log'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {loading ? (
          <div className="flex items-center gap-2 text-white/30 text-sm">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-white/30">No contacts yet.</p>
        ) : (
          filtered.slice(0, 5).map((c) => {
            const overdue = c.days_overdue && c.days_overdue > 0
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className="w-full flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium shrink-0">
                  {c.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{c.name}</div>
                  <div className={`text-xs ${typeColors[c.relationship_type] ?? 'text-white/40'}`}>
                    {c.relationship_type}
                  </div>
                </div>
                <div className={`text-xs shrink-0 ${overdue ? 'text-red-400' : 'text-white/30'}`}>
                  {c.last_contact_date
                    ? formatDistanceToNow(new Date(c.last_contact_date), { addSuffix: true })
                    : 'never'}
                </div>
                <MessageCircle size={12} className="text-white/20 shrink-0" />
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
