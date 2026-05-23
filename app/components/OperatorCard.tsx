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
    <div style={{ background: '#071E30', borderRadius: '8px', padding: '18px', border: '0.5px solid #0A2840' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#378ADD' }} />
        <span style={{ fontSize: '9px', letterSpacing: '0.18em', color: '#378ADD', textTransform: 'uppercase' }}>
          Operator
        </span>
      </div>

      {/* Briefing */}
      <div style={{ fontSize: '12px', color: '#7AABCC', lineHeight: 1.7, minHeight: '72px', marginBottom: '14px' }}>
        {loadingBriefing
          ? <span style={{ color: '#1E4060' }}>Generating briefing…</span>
          : briefing}
      </div>

      <div style={{ height: '0.5px', background: '#0A2840', margin: '12px 0' }} />

      {/* Command input */}
      <form onSubmit={handleCommand} style={{ display: 'flex', gap: '7px' }}>
        <input
          value={command}
          onChange={e => setCommand(e.target.value)}
          placeholder="Give me a command…"
          disabled={submitting}
          style={{
            flex: 1, background: '#040F1C', border: '0.5px solid #0A2840',
            borderRadius: '5px', padding: '7px 10px', fontSize: '11px',
            color: '#7AABCC', outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={submitting || !command.trim()}
          style={{
            background: '#0C2E50', border: '0.5px solid #185FA5',
            borderRadius: '5px', padding: '6px 12px',
            fontSize: '11px', color: '#378ADD', cursor: 'pointer',
            opacity: submitting || !command.trim() ? 0.4 : 1,
          }}
        >
          {submitting ? '…' : '→'}
        </button>
      </form>

      {/* Command log */}
      {log.length > 0 && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {log.map(entry => (
            <div key={entry.id} style={{
              background: '#040F1C', borderRadius: '5px', padding: '7px 10px',
              border: '0.5px solid #0A2840',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '10px', color: '#1E4060', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                  {entry.text}
                </span>
                <span style={{ fontSize: '10px', color: '#0E2030' }}>{entry.ts}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#7AABCC' }}>{entry.result}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
