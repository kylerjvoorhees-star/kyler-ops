'use client'

import { useState, useEffect, useRef } from 'react'
import Drawer from './Drawer'
import { format, subDays } from 'date-fns'

interface JournalEntry {
  id: string; entry_date: string; content: string; mood?: number; word_count?: number; ai_insight?: string
}

function MoodDots({ mood, onChange }: { mood: number; onChange?: (m: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange?.(n)} style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: n <= mood ? '#5DCAA5' : '#0A2840',
          border: 'none', cursor: onChange ? 'pointer' : 'default', padding: 0,
        }} />
      ))}
    </div>
  )
}

export default function JournalCard() {
  const [today, setToday] = useState<JournalEntry | null>(null)
  const [content, setContent] = useState('')
  const [mood, setMood] = useState(3)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [insight, setInsight] = useState('')
  const [loadingInsight, setLoadingInsight] = useState(false)
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { loadToday() }, [])

  async function loadToday() {
    setLoading(true)
    const res = await fetch('/api/journal').catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const todayEntry = (data.entries ?? []).find((e: JournalEntry) => e.entry_date === todayStr)
      if (todayEntry) { setToday(todayEntry); setContent(todayEntry.content); setMood(todayEntry.mood ?? 3) }
      setEntries(data.entries ?? [])
    }
    setLoading(false)
  }

  async function save(c = content, m = mood) {
    setSaving(true)
    await fetch('/api/journal', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: c, mood: m, word_count: c.split(/\s+/).filter(Boolean).length }),
    }).catch(() => null)
    setSaving(false)
    await loadToday()
  }

  function handleContentChange(val: string) {
    setContent(val)
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => save(val, mood), 2000)
  }

  async function handleInsight() {
    setLoadingInsight(true)
    const res = await fetch('/api/journal/insights', { method: 'POST' }).catch(() => null)
    if (res?.ok) setInsight((await res.json()).insight ?? '')
    setLoadingInsight(false)
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setTranscribing(true)
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const fd = new FormData(); fd.append('audio', blob, 'rec.webm')
        try {
          const res = await fetch('/api/voice/transcribe', { method: 'POST', body: fd })
          const { text } = await res.json()
          if (text) { setContent(p => p + (p ? '\n\n' : '') + text); save(content + (content ? '\n\n' : '') + text, mood) }
        } catch { /* no voice */ }
        setTranscribing(false)
      }
      mr.start(); mediaRef.current = mr; setRecording(true)
    } catch { /* mic unavailable */ }
  }

  function stopRecording() { mediaRef.current?.stop(); setRecording(false) }

  const recentDates = entries.slice(0, 3).map(e => e.entry_date)

  return (
    <>
      <div style={{ background: '#071E30', borderRadius: '8px', padding: '18px', border: '0.5px solid #0A2840' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#5DCAA5' }} />
          <span style={{ fontSize: '9px', letterSpacing: '0.18em', color: '#378ADD', textTransform: 'uppercase' }}>Journal</span>
          <span style={{ fontSize: '10px', color: '#1E4060', marginLeft: '4px' }}>
            {format(new Date(), 'MMM d')}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setShowHistory(true)} style={{ background: 'none', border: 'none', color: '#1E4060', cursor: 'pointer', fontSize: '12px' }}>↗</button>
            <button
              onClick={recording ? stopRecording : startRecording} disabled={transcribing}
              style={{ background: recording ? '#0C2E50' : 'transparent', border: recording ? '0.5px solid #185FA5' : 'none', borderRadius: '4px', padding: '3px 6px', color: recording ? '#378ADD' : '#1E4060', cursor: 'pointer', fontSize: '12px' }}
            >
              {transcribing ? '…' : recording ? '⏹' : '🎙'}
            </button>
          </div>
        </div>

        {loading ? (
          <span style={{ fontSize: '11px', color: '#1E4060' }}>Loading…</span>
        ) : today ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <MoodDots mood={mood} onChange={m => { setMood(m); save(content, m) }} />
              {today.word_count && <span style={{ fontSize: '10px', color: '#1E4060' }}>{today.word_count}w</span>}
              {saving && <span style={{ fontSize: '10px', color: '#1E4060' }}>saving…</span>}
            </div>
            <div style={{ fontSize: '12px', color: '#1E4060', lineHeight: 1.7 }}>
              {content.slice(0, 100)}{content.length > 100 ? '…' : ''}
            </div>
          </>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <MoodDots mood={mood} onChange={setMood} />
              <span style={{ fontSize: '10px', color: '#1E4060' }}>How's today?</span>
            </div>
            <textarea
              value={content} onChange={e => handleContentChange(e.target.value)}
              onKeyDown={e => { if (e.metaKey && e.key === 'Enter') save() }}
              placeholder="What's on your mind…"
              rows={4}
              style={{
                width: '100%', background: '#040F1C', border: '0.5px solid #0A2840',
                borderRadius: '5px', padding: '7px 10px', fontSize: '11px', color: '#7AABCC',
                outline: 'none', resize: 'none', lineHeight: 1.7,
              }}
            />
            <button onClick={() => save()} disabled={!content.trim() || saving}
              style={{ marginTop: '8px', background: '#0F6E56', borderRadius: '5px', padding: '6px 14px', fontSize: '11px', color: '#9FE1CB', border: 'none', cursor: 'pointer', opacity: (!content.trim() || saving) ? 0.5 : 1 }}>
              {saving ? 'Saving…' : 'Save Entry'}
            </button>
          </div>
        )}

        {recentDates.length > 0 && (
          <>
            <div style={{ height: '0.5px', background: '#0A2840', margin: '12px 0' }} />
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {recentDates.map(d => (
                <button key={d} onClick={() => { setViewEntry(entries.find(e => e.entry_date === d) ?? null); setShowHistory(true) }}
                  style={{ background: '#040F1C', border: '0.5px solid #0A2840', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', color: '#1E4060', cursor: 'pointer' }}>
                  {format(new Date(d + 'T12:00:00'), 'MMM d')}
                </button>
              ))}
            </div>
          </>
        )}

        <button onClick={handleInsight} disabled={loadingInsight}
          style={{ background: '#0C2E50', border: '0.5px solid #185FA5', borderRadius: '5px', padding: '5px 12px', fontSize: '11px', color: '#378ADD', cursor: 'pointer', opacity: loadingInsight ? 0.6 : 1 }}>
          {loadingInsight ? 'Analyzing…' : '✦ Insights'}
        </button>

        {insight && (
          <div style={{ marginTop: '10px', background: '#040F1C', border: '0.5px solid #0A2840', borderRadius: '5px', padding: '10px' }}>
            <div style={{ fontSize: '9px', color: '#378ADD', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px' }}>AI Pattern</div>
            <div style={{ fontSize: '11px', color: '#7AABCC', lineHeight: 1.7 }}>{insight}</div>
          </div>
        )}
      </div>

      <Drawer open={showHistory} onClose={() => { setShowHistory(false); setViewEntry(null) }} title="Journal History" dotColor="#5DCAA5">
        {viewEntry ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <button onClick={() => setViewEntry(null)} style={{ background: 'none', border: 'none', color: '#1E4060', cursor: 'pointer', fontSize: '12px' }}>← Back</button>
              <span style={{ fontSize: '12px', color: '#7AABCC' }}>{format(new Date(viewEntry.entry_date + 'T12:00:00'), 'MMMM d, yyyy')}</span>
              {viewEntry.mood && <MoodDots mood={viewEntry.mood} />}
            </div>
            <div style={{ fontSize: '12px', color: '#7AABCC', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{viewEntry.content}</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '9px', letterSpacing: '0.08em', color: '#1E4060', textTransform: 'uppercase', marginBottom: '12px' }}>All Entries</div>
            {entries.length === 0 ? (
              <span style={{ fontSize: '12px', color: '#1E4060' }}>No journal entries yet.</span>
            ) : entries.map((e, i) => (
              <button key={e.id} onClick={() => setViewEntry(e)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                borderBottom: i < entries.length - 1 ? '0.5px solid #0A2840' : 'none',
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#7AABCC', marginBottom: '3px' }}>
                    {format(new Date(e.entry_date + 'T12:00:00'), 'MMMM d, yyyy')}
                  </div>
                  <div style={{ fontSize: '11px', color: '#1E4060' }}>{e.word_count ?? 0}w</div>
                </div>
                {e.mood && <MoodDots mood={e.mood} />}
              </button>
            ))}
          </>
        )}
      </Drawer>
    </>
  )
}
