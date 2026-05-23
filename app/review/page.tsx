'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns'

interface Review {
  id: string; week_start: string; week_end: string; content: string
  highlights: string[]; focus_next_week: string; generated_at: string
}

const SECTIONS = [
  { key: 'wins', label: 'WINS', placeholder: 'What went well this week?' },
  { key: 'misses', label: 'MISSES', placeholder: "What didn't go as planned?" },
  { key: 'patterns', label: 'PATTERNS', placeholder: 'What patterns do you notice?' },
  { key: 'focus', label: 'NEXT WEEK FOCUS', placeholder: "What's the #1 thing to focus on next week?" },
]

function useAutoSave<T>(data: T, save: (d: T) => Promise<void>, delay = 2000) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => save(data), delay)
    return () => { if (timer.current) clearTimeout(timer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)])
}

export default function ReviewPage() {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [fields, setFields] = useState({
    wins: '', misses: '', patterns: '', focus: '', highlights: '', free_notes: ''
  })

  const [pastReviews, setPastReviews] = useState<Review[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const [currRes, histRes] = await Promise.all([
      fetch('/api/weekly-review').catch(() => null),
      fetch('/api/weekly-review/history').catch(() => null),
    ])
    if (currRes?.ok) {
      const data = await currRes.json()
      if (data.review) {
        setReview(data.review)
        // Parse structured content back into fields
        const content = data.review.content ?? ''
        const parseSection = (label: string) => {
          const regex = new RegExp(`${label}:?\\s*([\\s\\S]*?)(?=WINS:|MISSES:|PATTERNS:|NEXT WEEK FOCUS:|$)`, 'i')
          const match = content.match(regex)
          return match ? match[1].trim() : ''
        }
        setFields({
          wins: parseSection('WINS'),
          misses: parseSection('MISSES'),
          patterns: parseSection('PATTERNS'),
          focus: parseSection('NEXT WEEK FOCUS'),
          highlights: (data.review.highlights ?? []).join('\n'),
          free_notes: '',
        })
      }
    }
    if (histRes?.ok) {
      const data = await histRes.json()
      setPastReviews(data.reviews ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveFields(f: typeof fields) {
    setSaving(true)
    const content = [
      `WINS:\n${f.wins}`,
      `\nMISSES:\n${f.misses}`,
      `\nPATTERNS:\n${f.patterns}`,
      `\nNEXT WEEK FOCUS:\n${f.focus}`,
    ].join('\n')
    const highlights = f.highlights.split('\n').filter(Boolean)
    await fetch('/api/weekly-review/save', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        week_start: format(weekStart, 'yyyy-MM-dd'),
        week_end: format(weekEnd, 'yyyy-MM-dd'),
        content, highlights,
        focus_next_week: f.focus,
      }),
    }).catch(() => null)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  useAutoSave(fields, saveFields)

  async function generate() {
    setGenerating(true)
    const res = await fetch('/api/weekly-review/generate', { method: 'POST' }).catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      if (data.review) {
        setReview(data.review)
        const content = data.review.content ?? ''
        const parseSection = (label: string) => {
          const regex = new RegExp(`${label}:?\\s*([\\s\\S]*?)(?=WINS:|MISSES:|PATTERNS:|NEXT WEEK FOCUS:|$)`, 'i')
          const match = content.match(regex)
          return match ? match[1].trim() : ''
        }
        setFields(prev => ({
          ...prev,
          wins: parseSection('WINS') || prev.wins,
          misses: parseSection('MISSES') || prev.misses,
          patterns: parseSection('PATTERNS') || prev.patterns,
          focus: parseSection('NEXT WEEK FOCUS') || prev.focus,
          highlights: (data.review.highlights ?? []).join('\n') || prev.highlights,
        }))
      }
    }
    setGenerating(false)
  }

  const S: React.CSSProperties = {
    background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '6px',
    padding: '10px 12px', fontSize: '12px', color: '#aaa', outline: 'none',
    resize: 'vertical', width: '100%', lineHeight: 1.7,
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 300, color: '#ffffff', margin: 0 }}>Weekly Review</h1>
          <p style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>
            {format(weekStart, 'MMM d')} — {format(weekEnd, 'MMM d, yyyy')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {saving && <span style={{ fontSize: '10px', color: '#333' }}>Saving…</span>}
          {saved && !saving && <span style={{ fontSize: '10px', color: '#555' }}>Saved ✓</span>}
          <button onClick={generate} disabled={generating}
            style={{ background: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '11px', color: '#000', cursor: 'pointer', fontWeight: 700, opacity: generating ? 0.5 : 1 }}>
            {generating ? 'Generating…' : '✦ AI Draft'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#333', fontSize: '12px' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Structured sections */}
          {SECTIONS.map(sec => (
            <div key={sec.key} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '18px' }}>
              <div style={{ fontSize: '10px', color: '#444', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px' }}>{sec.label}</div>
              <textarea
                value={fields[sec.key as keyof typeof fields]}
                onChange={e => setFields(prev => ({ ...prev, [sec.key]: e.target.value }))}
                placeholder={sec.placeholder}
                rows={sec.key === 'focus' ? 3 : 4}
                style={S}
              />
            </div>
          ))}

          {/* Highlights */}
          <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '18px' }}>
            <div style={{ fontSize: '10px', color: '#444', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px' }}>HIGHLIGHTS (one per line)</div>
            <textarea
              value={fields.highlights}
              onChange={e => setFields(prev => ({ ...prev, highlights: e.target.value }))}
              placeholder={"Shipped feature X\nRan 5 days straight\nMet with Sarah"}
              rows={4}
              style={S}
            />
          </div>

          {/* Free notes */}
          <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '18px' }}>
            <div style={{ fontSize: '10px', color: '#444', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px' }}>FREE NOTES</div>
            <textarea
              value={fields.free_notes}
              onChange={e => setFields(prev => ({ ...prev, free_notes: e.target.value }))}
              placeholder="Anything else on your mind…"
              rows={4}
              style={S}
            />
          </div>

          {/* Past reviews */}
          {pastReviews.length > 1 && (
            <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '18px' }}>
              <div style={{ fontSize: '10px', color: '#444', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '14px' }}>Past Reviews</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {pastReviews.slice(1, 8).map((r, i) => (
                  <details key={r.id} style={{ borderBottom: i < Math.min(pastReviews.length - 2, 7) - 1 ? '1px solid #1a1a1a' : 'none' }}>
                    <summary style={{ fontSize: '12px', color: '#666', padding: '10px 0', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{format(new Date(r.week_start + 'T12:00:00'), 'MMM d')} — {format(new Date(r.week_end + 'T12:00:00'), 'MMM d, yyyy')}</span>
                      <span style={{ color: '#333' }}>▼</span>
                    </summary>
                    <div style={{ padding: '0 0 14px', fontSize: '12px', color: '#555', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                      {r.content}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
