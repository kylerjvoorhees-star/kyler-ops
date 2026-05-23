'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek } from 'date-fns'

interface Review {
  id: string; week_start: string; week_end: string; content: string; highlights: string[]; focus_next_week: string; generated_at: string
}

function formatReview(content: string) {
  const sections = ['WINS', 'MISSES', 'PATTERNS', 'NEXT WEEK FOCUS']
  let result = content
  sections.forEach(s => {
    result = result.replace(new RegExp(`(${s}:?)`, 'g'), `§§${s}§§`)
  })
  return result.split('§§').map((part, i) => {
    if (sections.includes(part)) {
      return <span key={i} style={{ color: '#ffffff', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', display: 'block', marginTop: i > 0 ? '12px' : '0', marginBottom: '4px', fontWeight: 700 }}>{part}</span>
    }
    return <span key={i} style={{ fontSize: '12px', color: '#888', lineHeight: 1.8 }}>{part}</span>
  })
}

export default function WeeklyReviewCard() {
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d, yyyy')

  useEffect(() => { loadReview() }, [])

  async function loadReview() {
    setLoading(true)
    const res = await fetch('/api/weekly-review').catch(() => null)
    if (res?.ok) setReview((await res.json()).review ?? null)
    setLoading(false)
  }

  async function generate() {
    setGenerating(true)
    const res = await fetch('/api/weekly-review/generate', { method: 'POST' }).catch(() => null)
    if (res?.ok) setReview((await res.json()).review ?? null)
    setGenerating(false)
  }

  return (
    <div style={{ background: '#111111', borderRadius: '10px', padding: '18px', border: '1px solid #1a1a1a' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ffffff' }} />
        <span style={{ fontSize: '10px', letterSpacing: '0.14em', color: '#ffffff', textTransform: 'uppercase', fontWeight: 700 }}>Weekly Review</span>
        <span style={{ fontSize: '10px', color: '#444', marginLeft: '4px' }}>
          {weekStart} — {weekEnd}
        </span>
        {review && (
          <button onClick={generate} disabled={generating}
            style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid #222', borderRadius: '6px', padding: '4px 10px', fontSize: '10px', color: '#555', cursor: 'pointer', fontWeight: 600, opacity: generating ? 0.5 : 1 }}>
            {generating ? 'Regenerating…' : '↺ Refresh'}
          </button>
        )}
      </div>

      {loading ? (
        <span style={{ fontSize: '11px', color: '#333' }}>Loading…</span>
      ) : review ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div style={{ lineHeight: 1.8 }}>{formatReview(review.content)}</div>
          <div>
            {review.highlights && review.highlights.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.14em', color: '#ffffff', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Highlights</div>
                {review.highlights.map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#444', marginTop: '5px', flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', color: '#888' }}>{h}</span>
                  </div>
                ))}
              </div>
            )}
            {review.focus_next_week && (
              <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '7px', padding: '12px' }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.14em', color: '#ffffff', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>Next Week Focus</div>
                <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.7 }}>{review.focus_next_week}</div>
              </div>
            )}
            <div style={{ marginTop: '12px', fontSize: '10px', color: '#333' }}>
              Generated {format(new Date(review.generated_at), 'MMM d, h:mm a')}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#444' }}>
            No review for this week yet. Claude synthesizes your habits, tasks, nutrition, finance, and journal data.
          </span>
          <button onClick={generate} disabled={generating}
            style={{ background: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontSize: '11px', color: '#000', cursor: 'pointer', fontWeight: 700, opacity: generating ? 0.5 : 1 }}>
            {generating ? 'Generating — ~10 seconds…' : "✦ Generate This Week's Review"}
          </button>
        </div>
      )}
    </div>
  )
}
