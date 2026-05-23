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
      return <span key={i} style={{ color: '#378ADD', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginTop: i > 0 ? '12px' : '0', marginBottom: '4px' }}>{part}</span>
    }
    return <span key={i} style={{ fontSize: '12px', color: '#7AABCC', lineHeight: 1.8 }}>{part}</span>
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
    <div style={{ background: '#071E30', borderRadius: '8px', padding: '18px', border: '0.5px solid #0A2840' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#378ADD' }} />
        <span style={{ fontSize: '9px', letterSpacing: '0.18em', color: '#378ADD', textTransform: 'uppercase' }}>Weekly Review</span>
        <span style={{ fontSize: '10px', color: '#1E4060', marginLeft: '4px' }}>
          {weekStart} — {weekEnd}
        </span>
        {review && (
          <button onClick={generate} disabled={generating}
            style={{ marginLeft: 'auto', background: '#0C2E50', border: '0.5px solid #185FA5', borderRadius: '5px', padding: '4px 10px', fontSize: '10px', color: '#378ADD', cursor: 'pointer', opacity: generating ? 0.6 : 1 }}>
            {generating ? 'Regenerating…' : '↺ Refresh'}
          </button>
        )}
      </div>

      {loading ? (
        <span style={{ fontSize: '11px', color: '#1E4060' }}>Loading…</span>
      ) : review ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div style={{ lineHeight: 1.8 }}>{formatReview(review.content)}</div>
          <div>
            {review.highlights && review.highlights.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.12em', color: '#1D9E75', textTransform: 'uppercase', marginBottom: '8px' }}>Highlights</div>
                {review.highlights.map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#1D9E75', marginTop: '5px', flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', color: '#7AABCC' }}>{h}</span>
                  </div>
                ))}
              </div>
            )}
            {review.focus_next_week && (
              <div style={{ background: '#040F1C', border: '0.5px solid #0A2840', borderRadius: '5px', padding: '12px' }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.12em', color: '#378ADD', textTransform: 'uppercase', marginBottom: '6px' }}>Next Week Focus</div>
                <div style={{ fontSize: '12px', color: '#7AABCC', lineHeight: 1.7 }}>{review.focus_next_week}</div>
              </div>
            )}
            <div style={{ marginTop: '12px', fontSize: '10px', color: '#0E2030' }}>
              Generated {format(new Date(review.generated_at), 'MMM d, h:mm a')}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#1E4060' }}>
            No review generated for this week yet. Claude will synthesize your habits, tasks, nutrition, finance, and journal data.
          </span>
          <button onClick={generate} disabled={generating}
            style={{ background: '#0C2E50', border: '0.5px solid #185FA5', borderRadius: '5px', padding: '7px 16px', fontSize: '11px', color: '#378ADD', cursor: 'pointer', opacity: generating ? 0.6 : 1 }}>
            {generating ? 'Generating — takes ~10 seconds…' : '✦ Generate This Week\'s Review'}
          </button>
        </div>
      )}
    </div>
  )
}
