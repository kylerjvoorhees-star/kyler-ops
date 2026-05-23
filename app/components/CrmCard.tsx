'use client'

import { useState, useEffect } from 'react'
import Drawer from './Drawer'
import { formatDistanceToNow, format } from 'date-fns'

interface Contact { id: string; name: string; relationship_type: string; last_contact_date?: string; contact_frequency_days: number; notes?: string; days_overdue?: number }
interface Interaction { id: string; contact_id: string; interaction_date: string; notes: string }

const typeColor: Record<string, string> = { friend: '#1D9E75', family: '#5DCAA5', professional: '#378ADD', lead: '#EF9F27' }

export default function CrmCard() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Contact | null>(null)
  const [logNote, setLogNote] = useState('')
  const [logging, setLogging] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [interactions, setInteractions] = useState<Interaction[]>([])

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

  async function loadHistory() {
    const res = await fetch('/api/crm/history').catch(() => null)
    if (res?.ok) setInteractions((await res.json()).interactions ?? [])
    setShowHistory(true)
  }

  const filtered = contacts.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <>
      <div style={{ background: '#071E30', borderRadius: '8px', padding: '18px', border: '0.5px solid #0A2840' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#378ADD' }} />
          <span style={{ fontSize: '9px', letterSpacing: '0.18em', color: '#378ADD', textTransform: 'uppercase' }}>CRM</span>
          <button onClick={loadHistory} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1E4060', cursor: 'pointer', fontSize: '12px' }}>↗</button>
        </div>

        <input
          value={query} onChange={e => setQuery(e.target.value)} placeholder="Search contacts…"
          style={{ width: '100%', background: '#040F1C', border: '0.5px solid #0A2840', borderRadius: '5px', padding: '7px 10px', fontSize: '11px', color: '#7AABCC', outline: 'none', marginBottom: '12px' }}
        />

        {selected && (
          <div style={{ background: '#040F1C', border: '0.5px solid #0A2840', borderRadius: '5px', padding: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#7AABCC' }}>{selected.name}</span>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#1E4060', cursor: 'pointer', fontSize: '14px' }}>×</button>
            </div>
            {selected.notes && <div style={{ fontSize: '11px', color: '#1E4060', marginBottom: '8px' }}>{selected.notes}</div>}
            <div style={{ display: 'flex', gap: '6px' }}>
              <input value={logNote} onChange={e => setLogNote(e.target.value)} placeholder="Note…"
                style={{ flex: 1, background: '#071E30', border: '0.5px solid #0A2840', borderRadius: '5px', padding: '5px 8px', fontSize: '11px', color: '#7AABCC', outline: 'none' }} />
              <button onClick={logInteraction} disabled={logging}
                style={{ background: '#0F6E56', borderRadius: '5px', padding: '5px 10px', fontSize: '11px', color: '#9FE1CB', border: 'none', cursor: 'pointer', opacity: logging ? 0.5 : 1 }}>
                Log
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '180px', overflowY: 'auto' }}>
          {loading ? (
            <span style={{ fontSize: '11px', color: '#1E4060' }}>Loading…</span>
          ) : filtered.length === 0 ? (
            <span style={{ fontSize: '12px', color: '#1E4060' }}>No contacts yet.</span>
          ) : filtered.slice(0, 5).map((c, i) => {
            const overdue = (c.days_overdue ?? 0) > 0
            return (
              <button key={c.id} onClick={() => setSelected(c)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                borderBottom: i < Math.min(filtered.length, 5) - 1 ? '0.5px solid #0A2840' : 'none',
              }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: '#0A2840', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', color: typeColor[c.relationship_type] ?? '#378ADD', flexShrink: 0,
                }}>
                  {c.name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', color: '#7AABCC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div style={{ fontSize: '10px', color: typeColor[c.relationship_type] ?? '#1E4060', marginTop: '1px' }}>{c.relationship_type}</div>
                </div>
                <div style={{ fontSize: '10px', color: overdue ? '#D85A30' : '#1E4060', flexShrink: 0 }}>
                  {c.last_contact_date
                    ? formatDistanceToNow(new Date(c.last_contact_date), { addSuffix: true })
                    : 'never'}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <Drawer open={showHistory} onClose={() => setShowHistory(false)} title="CRM History" dotColor="#378ADD">
        <div style={{ fontSize: '9px', letterSpacing: '0.08em', color: '#1E4060', textTransform: 'uppercase', marginBottom: '14px' }}>Interaction Log</div>
        {interactions.length === 0 ? (
          <span style={{ fontSize: '12px', color: '#1E4060' }}>No interactions logged yet.</span>
        ) : interactions.map((item, i) => (
          <div key={item.id} style={{ padding: '10px 0', borderBottom: i < interactions.length - 1 ? '0.5px solid #0A2840' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '12px', color: '#7AABCC' }}>
                {contacts.find(c => c.id === item.contact_id)?.name ?? 'Contact'}
              </span>
              <span style={{ fontSize: '10px', color: '#1E4060' }}>{format(new Date(item.interaction_date), 'MMM d')}</span>
            </div>
            {item.notes && <div style={{ fontSize: '11px', color: '#1E4060' }}>{item.notes}</div>}
          </div>
        ))}
      </Drawer>
    </>
  )
}
