'use client'

import { useState, useEffect, useRef } from 'react'
import { Utensils, Mic, MicOff, Loader2, Plus } from 'lucide-react'

const GOALS = { calories: 2200, protein: 180, carbs: 200, fat: 70 }

interface MacroTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

function Ring({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = Math.min(value / max, 1)
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 68 68">
          <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
            strokeLinecap="round" className="transition-all duration-500" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
          {Math.round(pct * 100)}%
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs font-semibold">{value}<span className="text-white/30">/{max}</span></div>
        <div className="text-[10px] text-white/40">{label}</div>
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
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => { loadTotals() }, [])

  async function loadTotals() {
    setLoading(true)
    const res = await fetch('/api/nutrition').catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      setTotals(data.totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 })
    }
    setLoading(false)
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => chunksRef.current.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setTranscribing(true)
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const fd = new FormData()
        fd.append('audio', blob, 'recording.webm')
        try {
          const res = await fetch('/api/voice/transcribe', { method: 'POST', body: fd })
          const { text } = await res.json()
          if (text) await parseAndLog(text)
        } catch {
          // voice not available
        }
        setTranscribing(false)
      }
      mr.start()
      mediaRef.current = mr
      setRecording(true)
    } catch {
      setShowManual(true)
    }
  }

  function stopRecording() {
    mediaRef.current?.stop()
    setRecording(false)
  }

  async function parseAndLog(description: string) {
    setSaving(true)
    const res = await fetch('/api/nutrition/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    })
    const data = await res.json()
    if (data.entry) {
      await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.entry),
      })
      await loadTotals()
    }
    setSaving(false)
  }

  async function saveManual(e: React.FormEvent) {
    e.preventDefault()
    if (!manualDesc.trim()) return
    setSaving(true)
    await parseAndLog(manualDesc)
    setManualDesc('')
    setShowManual(false)
    setSaving(false)
  }

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-5 flex flex-col gap-4 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-2">
        <Utensils size={16} className="text-pink-400" />
        <span className="text-xs font-semibold tracking-widest text-white/60 uppercase">Nutrition</span>
        <div className="ml-auto flex gap-1">
          <button onClick={() => setShowManual((v) => !v)} className="p-1 hover:bg-white/10 rounded-md transition-colors">
            <Plus size={14} className="text-white/40" />
          </button>
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={transcribing || saving}
            className={`p-1.5 rounded-md transition-colors ${recording ? 'bg-red-500/30 text-red-400' : 'hover:bg-white/10 text-white/40'}`}
          >
            {transcribing || saving ? <Loader2 size={14} className="animate-spin" /> : recording ? <MicOff size={14} /> : <Mic size={14} />}
          </button>
        </div>
      </div>

      {showManual && (
        <form onSubmit={saveManual} className="space-y-2">
          <input
            autoFocus type="text" value={manualDesc}
            onChange={(e) => setManualDesc(e.target.value)}
            placeholder="e.g. 2 eggs, avocado toast, coffee"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-pink-500/50"
          />
          <div className="flex gap-2">
            <select value={manualMeal} onChange={(e) => setManualMeal(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm focus:outline-none flex-1">
              {['breakfast','lunch','dinner','snack'].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <button type="submit" disabled={saving}
              className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 rounded-lg text-sm transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : 'Log'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-white/30 text-sm">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </div>
      ) : (
        <div className="flex justify-around">
          <Ring value={totals.calories} max={GOALS.calories} label="kcal" color="#f472b6" />
          <Ring value={totals.protein} max={GOALS.protein} label="protein g" color="#818cf8" />
          <Ring value={totals.carbs} max={GOALS.carbs} label="carbs g" color="#34d399" />
          <Ring value={totals.fat} max={GOALS.fat} label="fat g" color="#fbbf24" />
        </div>
      )}

      {recording && (
        <div className="flex items-center gap-2 text-red-400 text-sm animate-pulse">
          <div className="w-2 h-2 bg-red-400 rounded-full" />
          Recording… tap mic to stop
        </div>
      )}
    </div>
  )
}
