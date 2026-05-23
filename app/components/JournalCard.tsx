'use client'

import { useState, useEffect, useRef } from 'react'
import Drawer from './Drawer'
import { format } from 'date-fns'

interface JournalEntry {
  id: string; entry_date: string; content: string; mood?: number; word_count?: number; ai_insight?: string
}

function MoodDots({ mood, onChange }: { mood: number; onChange?: (m: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange?.(n)} style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: n <= mood ? '#ffffff' : '#222',
          border: 'none', cursor: onChange ? 'pointer' : 'default', padding: 0,
          transition: 'background 0.15s',
        }} />
      ))}
    </div>
  )
}

export default function JournalCard() {
  const [todayEntry, setTodayEntry] = useState<JournalEntry | null>(null)
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
      const entry = (data.entries ?? []).find((e: JournalEntry) => e.entry_date === todayStr)
      if (entry) { setTodayEntry(entry); setContent(entry.content); setMood(entry.mood ?? 3) }
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
          if (text) { const next = content + (content ? '\n\n' : '') + text; setContent(next); save(next, mood) }
        } catch { /* no voice */ }
        setTranscribing(false)
      }
      mr.start(); mediaRef.current = mr; setRecording(true)
    } catch { /* mic unavailable */ }
  }

  function stopRecording() { mediaRef.current?.stop(); setRecording(false) }

  return (
    <>
      <div style={{ background: '#111111', borderRadius: '10px', padding: '18px', border: '1px solid #1a1a1a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ffffff' }} />
          <span style={{ fontSize: '10px', letterSpacing: '0.14em', color: '#ffffff', textTransform: 'uppercase', fontWeight: 700 }}>Journal</span>
          <span style={{ fontSize: '10px', color: '#444', marginLeft: '4px' }}>{format(new Date(), 'MMM d')}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setShowHistory(true)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '13px' }}>↗</button>
            <button
              onClick={recording ? stopRecording : startRecording} disabled={transcribing}
              style={{ background: recording ? '#ffffff' : 'transparent', border: recording ? 'none' : '1px solid #222', borderRadius: '4px', padding: '3px 7px', color: recording ? '#000' : '#555', cursor: 'pointer', fontSize: '12px' }}
            >
              {transcribing ? '…' : recording ? '⏹' : '🎙'}
            </button>
          </div>
        </div>

        {loading ? (
          <span style={{ fontSize: '11px', color: '#333' }}>Loading…</span>
        ) : todayEntry ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <MoodDots mood={mood} onChange={m => { setMood(m); save(content, m) }} />
              {todayEntry.word_count && <span style={{ fontSize: '10px', color: '#444' }}>{todayEntry.word_count}w</span>}
              {saving && <span style={{ fontSize: '10px', color: '#444' }}>saving…</span>}
            </div>
            <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.7 }}>
              {content.slice(0, 120)}{content.length > 120 ? '…' : ''}
            </div>
          </>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <MoodDots mood={mood} onChange={setMood} />
              <span style={{ fontSize: '10px', color: '#444' }}>How's today?</span>
            </div>
            <textarea
              value={content} onChange={e => handleContentChange(e.target.value)}
              onKeyDown={e => { if (e.metaKey && e.key === 'Enter') save() }}
              placeholder="What's on your mind…"
              rows={4}
              style={{
                width: '100%', background: '#0a0a0a', border: '1px solid #222',
                borderRadius: '6px', padding: '8px 10px', fontSize: '11px', color: '#aaaaaa',
                outline: 'none', resize: 'none', lineHeight: 1.7,
              }}
            />
            <button onClick={() => save()} disabled={!content.trim() || saving}
              style={{ marginTop: '8px', background: '#ffffff', borderRadius: '6px', padding: '6px 14px', fontSize: '11px', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, opacity: (!content.trim() || saving) ? 0.3 : 1 }}>
              {saving ? 'Saving…' : 'Save Entry'}
            </button>
          </div>
        )}

        <div style={{ height: '1px', background: '#1a1a1a', margin: '12px 0' }} />

        <button onClick={handleInsight} disabled={loadingInsight}
          style={{ background: 'transparent', border: '1px solid #222', borderRadius: '6px', padding: '5px 12px', fontSize: '10px', color: '#555', cursor: 'pointer', fontWeight: 600, letterSpacing: '0.05em', opacity: loadingInsight ? 0.5 : 1 }}>
          {loadingInsight ? 'Analyzing…' : '✦ Insights'}
        </button>

        {insight && (
          <div style={{ marginTop: '10px', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '10px' }}>
            <div style={{ fontSize: '9px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '5px' }}>AI Pattern</div>
            <div style={{ fontSize: '11px', color: '#888', lineHeight: 1.7 }}>{insight}</div>
          </div>
        )}
      </div>

      <Drawer open={showHistory} onClose={() => { setShowHistory(false); setViewEntry(null) }} title="Journal History" dotColor="#ffffff">
        {viewEntry ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <button onClick={() => setViewEntry(null)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '12px' }}>← Back</button>
              <span style={{ fontSize: '12px', color: '#aaa' }}>{format(new Date(viewEntry.entry_date + 'T12:00:00'), 'MMMM d, yyyy')}</span>
              {viewEntry.mood && <MoodDots mood={viewEntry.mood} />}
            </div>
            <div style={{ fontSize: '12px', color: '#aaa', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{viewEntry.content}</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: '#444', textTransform: 'uppercase', marginBottom: '12px' }}>All Entries</div>
            {entries.length === 0 ? (
              <span style={{ fontSize: '12px', color: '#333' }}>No journal entries yet.</span>
            ) : entries.map((e, i) => (
              <button key={e.id} onClick={() => setViewEntry(e)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                borderBottom: i < entries.length - 1 ? '1px solid #1a1a1a' : 'none',
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '3px' }}>
                    {format(new Date(e.entry_date + 'T12:00:00'), 'MMMM d, yyyy')}
                  </div>
                  <div style={{ fontSize: '11px', color: '#444' }}>{e.word_count ?? 0}w</div>
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
