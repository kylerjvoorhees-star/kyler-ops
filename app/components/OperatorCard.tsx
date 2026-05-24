'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from './Card'

const LABEL: React.CSSProperties = {
  fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: '#ffffff',
}

export default function OperatorCard() {
  const router = useRouter()
  const [briefing, setBriefing] = useState('')
  const [loadingBriefing, setLoadingBriefing] = useState(true)
  const [command, setCommand] = useState('')
  const [thinking, setThinking] = useState(false)
  const [confirmation, setConfirmation] = useState<{ text: string; route: string | null; isQuery: boolean; answer?: string } | null>(null)
  const [telegramConnected, setTelegramConnected] = useState(false)

  useEffect(() => {
    fetch('/api/operator/briefing')
      .then(r => r.json())
      .then(d => setBriefing(d.briefing ?? ''))
      .catch(() => setBriefing('Ready when you are.'))
      .finally(() => setLoadingBriefing(false))

    fetch('/api/operator/status')
      .then(r => r.json())
      .then(d => setTelegramConnected(d.telegramConnected ?? false))
      .catch(() => {})
  }, [])

  async function handleCommand(e: React.FormEvent) {
    e.preventDefault()
    if (!command.trim()) return
    const input = command.trim()
    setCommand('')
    setThinking(true)
    setConfirmation(null)
    try {
      const res = await fetch('/api/operator/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })
      const data = await res.json()
      setConfirmation({
        text: data.confirmation ?? 'Done.',
        route: data.route && data.route !== 'null' ? data.route : null,
        isQuery: data.action === 'general_query',
        answer: data.answer ?? data.payload?.answer,
      })
    } catch {
      setConfirmation({ text: 'Something went wrong. Try again.', route: null, isQuery: false })
    } finally {
      setThinking(false)
    }
  }

  return (
    <Card>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9933A' }} />
          <span style={LABEL}>Operator</span>
        </div>
        {telegramConnected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4caf50' }} />
            <span style={{ fontSize: '9px', color: '#4caf50', letterSpacing: '0.08em' }}>Telegram live</span>
          </div>
        )}
      </div>

      <div style={{ fontSize: '9px', color: '#C9933A', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '12px' }}>
        Natural Language Command
      </div>

      {/* Briefing */}
      <div style={{ fontSize: '12px', color: '#aaaaaa', lineHeight: 1.7, minHeight: '70px', marginBottom: '14px' }}>
        {loadingBriefing
          ? <span style={{ color: 'rgba(255,255,255,0.25)' }}>Generating briefing…</span>
          : briefing}
      </div>

      <div style={{ height: '1px', background: '#2a2a2a', margin: '0 0 14px' }} />

      {/* Command input */}
      <form onSubmit={handleCommand} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <textarea
          value={command}
          onChange={e => setCommand(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCommand(e as unknown as React.FormEvent) } }}
          placeholder="Tell Operator what to do — log a habit, add a task, capture a thought, update CRM..."
          disabled={thinking}
          rows={2}
          style={{
            width: '100%', background: '#0a0a0a',
            border: '1px solid #2a2a2a', borderRadius: '6px',
            padding: '9px 11px', fontSize: '11px', color: '#ffffff',
            outline: 'none', resize: 'none', lineHeight: 1.6,
            fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          disabled={thinking || !command.trim()}
          style={{
            background: '#C9933A', border: 'none',
            borderRadius: '6px', padding: '8px 16px',
            fontSize: '11px', color: '#000000', cursor: 'pointer', fontWeight: 700,
            opacity: thinking || !command.trim() ? 0.4 : 1,
            alignSelf: 'flex-end',
          }}
        >
          {thinking ? '◌ Thinking…' : '→ Send'}
        </button>
      </form>

      {/* Thinking indicator */}
      {thinking && (
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9933A', animation: 'pulse 1s infinite' }} />
          <span style={{ fontSize: '11px', color: '#C9933A' }}>Processing…</span>
        </div>
      )}

      {/* Confirmation */}
      {confirmation && (
        <div style={{ marginTop: '12px', padding: '12px', background: '#0d1a0d', borderRadius: '8px', border: '1px solid #1a3a1a' }}>
          {confirmation.isQuery && confirmation.answer ? (
            <>
              <div style={{ fontSize: '9px', color: '#4caf50', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Answer</div>
              <div style={{ fontSize: '12px', color: '#aaa', lineHeight: 1.7 }}>{confirmation.answer}</div>
            </>
          ) : (
            <div style={{ fontSize: '12px', color: '#4caf50', lineHeight: 1.5 }}>✓ {confirmation.text}</div>
          )}
          {confirmation.route && (
            <button
              onClick={() => router.push(confirmation.route === 'home' ? '/' : `/${confirmation.route}`)}
              style={{
                marginTop: '8px', background: 'transparent',
                border: '1px solid #2a4a2a', borderRadius: '5px',
                padding: '4px 10px', fontSize: '10px',
                color: '#4caf50', cursor: 'pointer', fontWeight: 600,
              }}
            >
              Go to {confirmation.route} →
            </button>
          )}
        </div>
      )}
    </Card>
  )
}
