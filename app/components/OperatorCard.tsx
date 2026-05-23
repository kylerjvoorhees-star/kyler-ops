'use client'

import { useState, useEffect } from 'react'

export default function OperatorCard() {
  const [briefing, setBriefing] = useState('')
  const [loadingBriefing, setLoadingBriefing] = useState(true)
  const [command, setCommand] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [log, setLog] = useState<{ id: string; text: string; result: string; ts: string }[]>([])

  useEffect(() => {
    fetch('/api/operator/briefing')
      .then(r => r.json())
      .then(d => setBriefing(d.briefing ?? ''))
      .catch(() => setBriefing('Good morning, Kyler.'))
      .finally(() => setLoadingBriefing(false))
  }, [])

  async function handleCommand(e: React.FormEvent) {
    e.preventDefault()
    if (!command.trim()) return
    setSubmitting(true)
    const text = command
    setCommand('')
    try {
      const res = await fetch('/api/operator/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: text }),
      })
      const data = await res.json()
      setLog(prev => [{
        id: Date.now().toString(), text,
        result: data.result ?? 'Done.',
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }, ...prev].slice(0, 5))
    } catch {
      setLog(prev => [{ id: Date.now().toString(), text, result: 'Error.', ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...prev].slice(0, 5))
    } finally { setSubmitting(false) }
  }

  return (
    <div style={{ background: '#111111', borderRadius: '10px', padding: '18px', border: '1px solid #1a1a1a' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ffffff' }} />
        <span style={{ fontSize: '10px', letterSpacing: '0.14em', color: '#ffffff', textTransform: 'uppercase', fontWeight: 700 }}>
          Operator
        </span>
      </div>

      {/* Briefing */}
      <div style={{ fontSize: '12px', color: '#aaaaaa', lineHeight: 1.7, minHeight: '80px', marginBottom: '14px' }}>
        {loadingBriefing
          ? <span style={{ color: '#333' }}>Generating briefing…</span>
          : briefing}
      </div>

      <div style={{ height: '1px', background: '#1a1a1a', margin: '12px 0' }} />

      {/* Command input */}
      <form onSubmit={handleCommand} style={{ display: 'flex', gap: '7px' }}>
        <input
          value={command}
          onChange={e => setCommand(e.target.value)}
          placeholder="Give me a command…"
          disabled={submitting}
          style={{
            flex: 1, background: '#0a0a0a', border: '1px solid #222',
            borderRadius: '6px', padding: '8px 10px', fontSize: '11px',
            color: '#ffffff', outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={submitting || !command.trim()}
          style={{
            background: '#ffffff', border: 'none',
            borderRadius: '6px', padding: '7px 13px',
            fontSize: '11px', color: '#000000', cursor: 'pointer', fontWeight: 700,
            opacity: submitting || !command.trim() ? 0.3 : 1,
          }}
        >
          {submitting ? '…' : '→'}
        </button>
      </form>

      {/* Command log */}
      {log.length > 0 && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {log.map(entry => (
            <div key={entry.id} style={{
              background: '#0a0a0a', borderRadius: '6px', padding: '7px 10px',
              border: '1px solid #1a1a1a',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '10px', color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                  {entry.text}
                </span>
                <span style={{ fontSize: '10px', color: '#333' }}>{entry.ts}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#aaaaaa' }}>{entry.result}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
