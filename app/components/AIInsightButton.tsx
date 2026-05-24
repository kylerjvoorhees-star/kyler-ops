'use client'

import { useState } from 'react'

interface AIInsightButtonProps {
  context: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
}

export default function AIInsightButton({ context, data }: AIInsightButtonProps) {
  const [loading, setLoading] = useState(false)
  const [insight, setInsight] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  async function getInsight() {
    if (open && insight) { setOpen(false); return }
    setLoading(true)
    setOpen(true)
    try {
      const res = await fetch('/api/ai/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, data }),
      })
      const d = await res.json()
      setInsight(d.insight ?? 'No insight available.')
    } catch {
      setInsight('Could not load insight.')
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={getInsight}
        title="AI Insight"
        style={{
          background: 'none', border: 'none',
          color: loading ? '#555' : '#C9933A',
          cursor: 'pointer', fontSize: '13px', padding: '0 2px',
          lineHeight: 1, transition: 'color 0.15s',
        }}
      >
        ✦
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '24px', zIndex: 50,
          background: '#1a1a1a', border: '1px solid #C9933A',
          borderRadius: '8px', padding: '12px 14px',
          fontSize: '12px', color: '#aaaaaa', lineHeight: 1.7,
          width: '260px', boxShadow: '0 4px 20px rgba(0,0,0,0.9)',
        }}>
          <div style={{ fontSize: '9px', color: '#C9933A', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '7px' }}>
            AI INSIGHT
          </div>
          {loading ? (
            <span style={{ color: '#555' }}>Analyzing…</span>
          ) : insight}
          <button
            onClick={() => setOpen(false)}
            style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '12px', lineHeight: 1 }}
          >✕</button>
        </div>
      )}
    </div>
  )
}
