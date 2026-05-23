'use client'

import { useState, useEffect, useRef } from 'react'
import Drawer from './Drawer'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const GOALS = { calories: 2200, protein: 180, carbs: 200, fat: 70 }

interface MacroTotals { calories: number; protein: number; carbs: number; fat: number }

function Ring({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min(value / max, 1)
  const r = 24, C = 2 * Math.PI * r
  const over = pct >= 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ position: 'relative', width: '60px', height: '60px' }}>
        <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="30" cy="30" r={r} fill="none" stroke="#1a1a1a" strokeWidth="4" />
          <circle cx="30" cy="30" r={r} fill="none" stroke={over ? '#ffffff' : '#555555'} strokeWidth="4"
            strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(pct, 1))}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: over ? '#ffffff' : '#666' }}>
          {Math.round(pct * 100)}%
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '11px', fontWeight: 300, color: '#aaa' }}>{value}<span style={{ color: '#333' }}>/{max}</span></div>
        <div style={{ fontSize: '9px', letterSpacing: '0.1em', color: '#444', textTransform: 'uppercase' }}>{label}</div>
      </div>
    </div>
  )
}

export default function NutritionCard() {
  const [totals, setTotals] = useState<MacroTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [loading, setLoading] = useState(true)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [manualDesc, setManualDesc] = useState('')
  const [manualMeal, setManualMeal] = useState('lunch')
  const [saving, setSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [historyData, setHistoryData] = useState<{ date: string; calories: number; protein: number; carbs: number; fat: number }[]>([])
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => { loadTotals() }, [])

  async function loadTotals() {
    setLoading(true)
    const res = await fetch('/api/nutrition').catch(() => null)
    if (res?.ok) setTotals((await res.json()).totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 })
    setLoading(false)
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
          if (text) await parseAndLog(text)
        } catch { /* no voice */ }
        setTranscribing(false)
      }
      mr.start(); mediaRef.current = mr; setRecording(true)
    } catch { setShowManual(true) }
  }

  function stopRecording() { mediaRef.current?.stop(); setRecording(false) }

  async function parseAndLog(description: string) {
    setSaving(true)
    const res = await fetch('/api/nutrition/parse', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    })
    const data = await res.json()
    if (data.entry) {
      await fetch('/api/nutrition', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data.entry) })
      await loadTotals()
    }
    setSaving(false)
  }

  async function saveManual(e: React.FormEvent) {
    e.preventDefault(); if (!manualDesc.trim()) return
    setSaving(true); await parseAndLog(manualDesc)
    setManualDesc(''); setShowManual(false); setSaving(false)
  }

  async function loadHistory() {
    const res = await fetch('/api/nutrition/history').catch(() => null)
    if (res?.ok) setHistoryData((await res.json()).daily ?? [])
    setShowHistory(true)
  }

  return (
    <>
      <div style={{ background: '#111111', borderRadius: '10px', padding: '18px', border: '1px solid #1a1a1a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ffffff' }} />
          <span style={{ fontSize: '10px', letterSpacing: '0.14em', color: '#ffffff', textTransform: 'uppercase', fontWeight: 700 }}>Nutrition</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={loadHistory} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '13px' }}>↗</button>
            <button onClick={() => setShowManual(v => !v)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>+</button>
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={transcribing || saving}
              style={{
                background: recording ? '#ffffff' : 'transparent',
                border: recording ? 'none' : '1px solid #222',
                borderRadius: '4px', padding: '3px 7px',
                color: recording ? '#000' : '#555', cursor: 'pointer', fontSize: '12px',
              }}
            >
              {transcribing || saving ? '…' : recording ? '⏹' : '🎙'}
            </button>
          </div>
        </div>

        {showManual && (
          <form onSubmit={saveManual} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            <input
              autoFocus value={manualDesc} onChange={e => setManualDesc(e.target.value)}
              placeholder="e.g. 2 eggs, avocado toast, coffee"
              style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '6px', padding: '7px 10px', fontSize: '11px', color: '#ffffff', outline: 'none', width: '100%' }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <select value={manualMeal} onChange={e => setManualMeal(e.target.value)}
                style={{ flex: 1, background: '#0a0a0a', border: '1px solid #222', borderRadius: '6px', padding: '7px 8px', fontSize: '11px', color: '#ffffff', outline: 'none' }}>
                {['breakfast', 'lunch', 'dinner', 'snack'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <button type="submit" disabled={saving}
                style={{ background: '#ffffff', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, opacity: saving ? 0.5 : 1 }}>
                {saving ? '…' : 'Log'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <span style={{ fontSize: '11px', color: '#333' }}>Loading…</span>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Ring value={totals.calories} max={GOALS.calories} label="kcal" />
            <Ring value={totals.protein} max={GOALS.protein} label="protein" />
            <Ring value={totals.carbs} max={GOALS.carbs} label="carbs" />
            <Ring value={totals.fat} max={GOALS.fat} label="fat" />
          </div>
        )}
      </div>

      <Drawer open={showHistory} onClose={() => setShowHistory(false)} title="Nutrition History" dotColor="#ffffff">
        <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: '#444', textTransform: 'uppercase', marginBottom: '12px' }}>7-Day Macro Trends</div>
        <div style={{ height: '160px', marginBottom: '16px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#444' }} tickFormatter={d => d.slice(5)} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: '6px', fontSize: '11px' }}
                labelStyle={{ color: '#fff' }} />
              <Line type="monotone" dataKey="calories" stroke="#ffffff" strokeWidth={1.5} dot={false} name="kcal" />
              <Line type="monotone" dataKey="protein" stroke="#888" strokeWidth={1.5} dot={false} name="protein" />
              <Line type="monotone" dataKey="carbs" stroke="#555" strokeWidth={1.5} dot={false} name="carbs" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {[{ key: 'calories', label: 'Avg kcal' }, { key: 'protein', label: 'Avg protein' }, { key: 'carbs', label: 'Avg carbs' }].map(({ key, label }) => {
            const avg = historyData.length > 0 ? Math.round(historyData.reduce((s, d) => s + (d[key as keyof typeof d] as number), 0) / historyData.length) : 0
            return (
              <div key={key}>
                <div style={{ fontSize: '16px', fontWeight: 300, color: '#ffffff' }}>{avg}</div>
                <div style={{ fontSize: '9px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
              </div>
            )
          })}
        </div>
      </Drawer>
    </>
  )
}
