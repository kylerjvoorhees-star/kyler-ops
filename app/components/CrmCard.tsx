'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface Contact { id: string; name: string; relationship_type: string; last_contact_date?: string; contact_frequency_days: number; notes?: string; days_overdue?: number }

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
    if (res?.ok) setContacts((await res.json()).contacts ?? [])
    setLoading(false)
  }

  async function logInteraction() {
    if (!selected) return
    setLogging(true)
    await fetch(`/api/crm/contacts/${selected.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'log_interaction', notes: logNote }),
    }).catch(() => null)
    setLogNote(''); setSelected(null); setLogging(false)
    await loadContacts()
  }

  const filtered = contacts.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div style={{ background: '#111111', borderRadius: '10px', padding: '18px', border: '1px solid #1a1a1a' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ffffff' }} />
        <span style={{ fontSize: '10px', letterSpacing: '0.14em', color: '#ffffff', textTransform: 'uppercase', fontWeight: 700 }}>CRM</span>
      </div>

      <input
        value={query} onChange={e => setQuery(e.target.value)} placeholder="Search contacts…"
        style={{ width: '100%', background: '#0a0a0a', border: '1px solid #222', borderRadius: '6px', padding: '7px 10px', fontSize: '11px', color: '#ffffff', outline: 'none', marginBottom: '12px' }}
      />

      {selected && (
        <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#ffffff' }}>{selected.name}</span>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '16px' }}>×</button>
          </div>
          {selected.notes && <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>{selected.notes}</div>}
          <div style={{ display: 'flex', gap: '6px' }}>
            <input value={logNote} onChange={e => setLogNote(e.target.value)} placeholder="Note…"
              style={{ flex: 1, background: '#111', border: '1px solid #222', borderRadius: '6px', padding: '5px 8px', fontSize: '11px', color: '#ffffff', outline: 'none' }} />
            <button onClick={logInteraction} disabled={logging}
              style={{ background: '#ffffff', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, opacity: logging ? 0.5 : 1 }}>
              Log
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '200px', overflowY: 'auto' }}>
        {loading ? (
          <span style={{ fontSize: '11px', color: '#333' }}>Loading…</span>
        ) : filtered.length === 0 ? (
          <span style={{ fontSize: '12px', color: '#333' }}>No contacts yet.</span>
        ) : filtered.slice(0, 6).map((c, i) => {
          const overdue = (c.days_overdue ?? 0) > 0
          return (
            <button key={c.id} onClick={() => setSelected(c)} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              borderBottom: i < Math.min(filtered.length, 6) - 1 ? '1px solid #1a1a1a' : 'none',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', color: '#aaa', flexShrink: 0, fontWeight: 600,
              }}>
                {c.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', color: '#aaaaaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                <div style={{ fontSize: '10px', color: '#444', marginTop: '1px' }}>{c.relationship_type}</div>
              </div>
              <div style={{ fontSize: '10px', color: overdue ? '#ff4444' : '#444', flexShrink: 0 }}>
                {c.last_contact_date
                  ? formatDistanceToNow(new Date(c.last_contact_date), { addSuffix: true })
                  : 'never'}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
