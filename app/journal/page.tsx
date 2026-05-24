'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import Card from '@/app/components/Card'
import AIInsightButton from '@/app/components/AIInsightButton'

interface JournalEntry {
  id: string; entry_date: string; content: string; mood?: number; word_count?: number
}

interface AnalysisResult {
  themes: string[]
  impliedTasks: string[]
  moodTrend: string
  energyPattern: string
  insight: string
}

function MoodDots({ mood, onChange }: { mood: number; onChange?: (m: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange?.(n)} style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: n <= mood ? '#ffffff' : '#222',
          border: 'none', cursor: onChange ? 'pointer' : 'default', padding: 0,
          transition: 'background 0.15s',
        }} />
      ))}
    </div>
  )
}

const LABEL: React.CSSProperties = {
  fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: '#ffffff',
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [content, setContent] = useState('')
  const [mood, setMood] = useState(3)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [addingTask, setAddingTask] = useState<string | null>(null)
  const [addedTasks, setAddedTasks] = useState<Set<string>>(new Set())
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/journal').catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      const all: JournalEntry[] = data.entries ?? []
      setEntries(all)
      const todayEntry = all.find(e => e.entry_date === today)
      if (todayEntry) { setContent(todayEntry.content); setMood(todayEntry.mood ?? 3) }
    }
    setLoading(false)
  }

  function handleContentChange(val: string) {
    setContent(val)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(val, mood), 2000)
  }

  async function save(c = content, m = mood) {
    if (!c.trim()) return
    setSaving(true)
    await fetch('/api/journal', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: c, mood: m, word_count: c.split(/\s+/).filter(Boolean).length }),
    }).catch(() => null)
    setSaving(false)
    await load()
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
          if (text) {
            const next = content + (content ? '\n\n' : '') + text
            setContent(next)
            save(next, mood)
          }
        } catch { /* no voice */ }
        setTranscribing(false)
      }
      mr.start(); mediaRef.current = mr; setRecording(true)
    } catch { /* mic unavailable */ }
  }

  function stopRecording() { mediaRef.current?.stop(); setRecording(false) }

  async function analyze() {
    setAnalyzing(true)
    const res = await fetch('/api/journal/analyze', { method: 'POST' }).catch(() => null)
    if (res?.ok) setAnalysis(await res.json())
    setAnalyzing(false)
  }

  async function addImpliedTask(taskText: string) {
    setAddingTask(taskText)
    await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: taskText }),
    }).catch(() => null)
    setAddedTasks(prev => new Set([...prev, taskText]))
    setAddingTask(null)
  }

  const wordCount = content.split(/\s+/).filter(Boolean).length
  const todayEntry = entries.find(e => e.entry_date === today)
  const pastEntries = entries.filter(e => e.entry_date !== today)

  const inputStyle: React.CSSProperties = {
    background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#ffffff',
    borderRadius: '6px', padding: '8px 10px', fontSize: '11px', outline: 'none',
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 300, color: '#ffffff', margin: 0 }}>Journal</h1>
            <p style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <AIInsightButton context="Journal" data={{ entries: entries.slice(0, 7).map(e => ({ date: e.entry_date, mood: e.mood, words: e.word_count })) }} />
        </div>

        {/* Today's entry */}
        <Card style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9933A' }} />
            <span style={LABEL}>Today&apos;s Entry</span>
            <span style={{ fontSize: '10px', color: '#444', marginLeft: '4px' }}>{today}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
              {saving && <span style={{ fontSize: '10px', color: '#444' }}>saving…</span>}
              {wordCount > 0 && <span style={{ fontSize: '10px', color: '#555' }}>{wordCount}w</span>}
              <button
                onClick={recording ? stopRecording : startRecording}
                disabled={transcribing}
                style={{
                  background: recording ? '#ffffff' : 'transparent',
                  border: recording ? 'none' : '1px solid #222',
                  borderRadius: '4px', padding: '4px 8px',
                  color: recording ? '#000' : '#555', cursor: 'pointer', fontSize: '12px',
                }}
              >
                {transcribing ? '…' : recording ? '⏹' : '🎙'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <MoodDots mood={mood} onChange={m => { setMood(m); if (content.trim()) save(content, m) }} />
            <span style={{ fontSize: '10px', color: '#444' }}>mood</span>
          </div>

          {loading ? (
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Loading…</span>
          ) : (
            <>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => handleContentChange(e.target.value)}
                onKeyDown={e => { if (e.metaKey && e.key === 'Enter') { if (saveTimer.current) clearTimeout(saveTimer.current); save() } }}
                onBlur={() => { if (saveTimer.current) clearTimeout(saveTimer.current); if (content.trim()) save() }}
                placeholder="What's on your mind… (Cmd+Enter or blur to save)"
                rows={10}
                style={{
                  ...inputStyle, width: '100%', resize: 'vertical',
                  lineHeight: 1.8, fontSize: '13px',
                }}
              />
              <button
                onClick={() => save()}
                disabled={!content.trim() || saving}
                style={{
                  marginTop: '10px', background: '#ffffff', borderRadius: '6px',
                  padding: '7px 18px', fontSize: '11px', color: '#000',
                  border: 'none', cursor: 'pointer', fontWeight: 700,
                  opacity: (!content.trim() || saving) ? 0.3 : 1,
                }}
              >
                {saving ? 'Saving…' : todayEntry ? 'Update Entry' : 'Save Entry'}
              </button>
            </>
          )}
        </Card>

        {/* Past entries */}
        <Card style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9933A' }} />
            <span style={LABEL}>Entry History</span>
            <span style={{ fontSize: '10px', color: '#444', marginLeft: '4px' }}>{entries.length} entries</span>
          </div>

          {pastEntries.length === 0 ? (
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>No past entries yet.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {pastEntries.map((entry, i) => (
                <div key={entry.id} style={{ borderBottom: i < pastEntries.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                  <button
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    style={{
                      width: '100%', background: 'none', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 0', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', color: '#aaaaaa', marginBottom: '3px' }}>
                        {format(new Date(entry.entry_date + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
                      </div>
                      {expandedId !== entry.id && (
                        <div style={{ fontSize: '11px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '580px' }}>
                          {entry.content.slice(0, 80)}{entry.content.length > 80 ? '…' : ''}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: '12px' }}>
                      {entry.mood && <MoodDots mood={entry.mood} />}
                      {entry.word_count && <span style={{ fontSize: '10px', color: '#444' }}>{entry.word_count}w</span>}
                      <span style={{ fontSize: '10px', color: '#333' }}>{expandedId === entry.id ? '▲' : '▼'}</span>
                    </div>
                  </button>
                  {expandedId === entry.id && (
                    <div style={{ padding: '0 0 14px', fontSize: '12px', color: '#888', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
                      {entry.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* AI Pattern Analysis */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9933A' }} />
            <span style={LABEL}>AI Pattern Analysis</span>
            <button
              onClick={analyze}
              disabled={analyzing || entries.length === 0}
              style={{
                marginLeft: 'auto', background: '#C9933A', border: 'none',
                borderRadius: '6px', padding: '6px 14px', fontSize: '11px',
                color: '#000', cursor: 'pointer', fontWeight: 700,
                opacity: (analyzing || entries.length === 0) ? 0.5 : 1,
              }}
            >
              {analyzing ? 'Analyzing…' : '✦ Analyze Patterns'}
            </button>
          </div>

          {!analysis && !analyzing && (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
              Click above to analyze patterns across your last 14 journal entries.
            </p>
          )}

          {analyzing && (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Reading your entries…</p>
          )}

          {analysis && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Themes */}
              {analysis.themes.length > 0 && (
                <div>
                  <div style={{ fontSize: '10px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Recurring Themes</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {analysis.themes.map(theme => (
                      <span key={theme} style={{
                        background: 'rgba(201,147,58,0.12)', border: '1px solid rgba(201,147,58,0.3)',
                        borderRadius: '20px', padding: '3px 10px', fontSize: '11px', color: '#C9933A',
                      }}>{theme}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mood trend */}
              {analysis.moodTrend && (
                <div>
                  <div style={{ fontSize: '10px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Mood Trajectory</div>
                  <p style={{ fontSize: '12px', color: '#aaaaaa', lineHeight: 1.7, margin: 0 }}>{analysis.moodTrend}</p>
                </div>
              )}

              {/* Energy pattern */}
              {analysis.energyPattern && (
                <div>
                  <div style={{ fontSize: '10px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Energy Pattern</div>
                  <p style={{ fontSize: '12px', color: '#aaaaaa', lineHeight: 1.7, margin: 0 }}>{analysis.energyPattern}</p>
                </div>
              )}

              {/* Implied tasks */}
              {analysis.impliedTasks.length > 0 && (
                <div>
                  <div style={{ fontSize: '10px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Implied Tasks</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {analysis.impliedTasks.map(task => (
                      <div key={task} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', color: '#aaaaaa', flex: 1 }}>{task}</span>
                        <button
                          onClick={() => addImpliedTask(task)}
                          disabled={addingTask === task || addedTasks.has(task)}
                          style={{
                            background: addedTasks.has(task) ? '#1a1a1a' : 'transparent',
                            border: '1px solid #2a2a2a',
                            borderRadius: '5px', padding: '3px 10px',
                            fontSize: '10px', color: addedTasks.has(task) ? '#555' : '#aaa',
                            cursor: addedTasks.has(task) ? 'default' : 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          {addedTasks.has(task) ? '✓ Added' : addingTask === task ? '…' : 'Add to Tasks →'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overall insight */}
              {analysis.insight && (
                <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '9px', color: '#C9933A', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Pattern Insight</div>
                  <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.7, margin: 0 }}>{analysis.insight}</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
