'use client'
import { useState, useEffect, useCallback } from 'react'

interface Task {
  id: string
  title: string
  description?: string
  priority: number
  status: string
  due_date?: string
  is_blocker?: boolean
  temperature?: string
  ai_priority_score?: number
}

const tempColor: Record<string, string> = {
  hot: '#ff4444',
  warm: '#ff9900',
  cool: '#4499ff',
}

export default function KeyBlockersCard() {
  const [blockers, setBlockers] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks?is_blocker=true')
      const d = await res.json()
      setBlockers((d.tasks ?? []).filter((t: Task) => t.is_blocker && t.status !== 'done'))
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const dismiss = async (id: string) => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_blocker: false }),
    })
    setBlockers(b => b.filter(t => t.id !== id))
  }

  const done = async (id: string) => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    })
    setBlockers(b => b.filter(t => t.id !== id))
  }

  const card: React.CSSProperties = {
    background: '#111111',
    border: '1px solid #1a1a1a',
    borderRadius: '10px',
    padding: '16px',
  }

  return (
    <div style={card}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff4444' }} />
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', color: '#ff4444', textTransform: 'uppercase' }}>
          Key Blockers
        </span>
        {blockers.length > 0 && (
          <span style={{
            marginLeft: 'auto', background: '#ff4444', color: '#000', borderRadius: '10px',
            fontSize: '10px', fontWeight: 700, padding: '1px 7px',
          }}>{blockers.length}</span>
        )}
      </div>

      {loading && <div style={{ color: '#444', fontSize: '12px' }}>Loading…</div>}

      {!loading && blockers.length === 0 && (
        <div style={{ color: '#444', fontSize: '12px', textAlign: 'center', padding: '16px 0' }}>
          No blockers. Clear runway.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {blockers.map(t => (
          <div key={t.id} style={{
            background: '#191919',
            border: '1px solid #252525',
            borderRadius: '7px',
            padding: '10px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              {t.temperature && (
                <span style={{
                  fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
                  color: tempColor[t.temperature] ?? '#888',
                  background: (tempColor[t.temperature] ?? '#888') + '22',
                  borderRadius: '3px', padding: '2px 5px', flexShrink: 0, marginTop: '1px',
                }}>
                  {t.temperature.toUpperCase()}
                </span>
              )}
              <span style={{ fontSize: '12px', color: '#ffffff', lineHeight: 1.4, flex: 1 }}>{t.title}</span>
            </div>
            {t.due_date && (
              <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>
                Due {new Date(t.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            )}
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              <button onClick={() => done(t.id)} style={{
                flex: 1, background: '#222', border: '1px solid #333', borderRadius: '5px',
                color: '#aaa', fontSize: '10px', fontWeight: 600, padding: '4px 0', cursor: 'pointer',
              }}>✓ Done</button>
              <button onClick={() => dismiss(t.id)} style={{
                flex: 1, background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '5px',
                color: '#555', fontSize: '10px', padding: '4px 0', cursor: 'pointer',
              }}>Unblock</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
