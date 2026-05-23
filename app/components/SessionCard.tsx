'use client'

import { useState, useEffect, useRef } from 'react'
import { Timer, Play, Pause, RotateCcw, CheckCircle } from 'lucide-react'

const WORK_MINS = 25
const BREAK_MINS = 5

export default function SessionCard() {
  const [task, setTask] = useState('')
  const [editingTask, setEditingTask] = useState(false)
  const [mode, setMode] = useState<'work' | 'break'>('work')
  const [secondsLeft, setSecondsLeft] = useState(WORK_MINS * 60)
  const [running, setRunning] = useState(false)
  const [sessionsToday, setSessionsToday] = useState(0)
  const [focusMinutes, setFocusMinutes] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef<Date | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current!)
            setRunning(false)
            if (mode === 'work') {
              completeSession()
              setMode('break')
              setSecondsLeft(BREAK_MINS * 60)
            } else {
              setMode('work')
              setSecondsLeft(WORK_MINS * 60)
            }
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, mode])

  async function completeSession() {
    const duration = WORK_MINS
    setSessionsToday((n) => n + 1)
    setFocusMinutes((n) => n + duration)
    if (startedAtRef.current) {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          started_at: startedAtRef.current.toISOString(),
          ended_at: new Date().toISOString(),
          task,
          duration_minutes: duration,
          type: 'work',
        }),
      }).catch(() => null)
    }
  }

  function handleStart() {
    if (!running) startedAtRef.current = new Date()
    setRunning((r) => !r)
  }

  function handleReset() {
    setRunning(false)
    setMode('work')
    setSecondsLeft(WORK_MINS * 60)
  }

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')
  const totalSecs = mode === 'work' ? WORK_MINS * 60 : BREAK_MINS * 60
  const progress = 1 - secondsLeft / totalSecs
  const circumference = 2 * Math.PI * 42

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-5 flex flex-col gap-4 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-2">
        <Timer size={16} className="text-cyan-400" />
        <span className="text-xs font-semibold tracking-widest text-white/60 uppercase">Session</span>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${mode === 'work' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-green-500/20 text-green-400'}`}>
          {mode === 'work' ? 'FOCUS' : 'BREAK'}
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={mode === 'work' ? '#22d3ee' : '#4ade80'}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-mono text-xl font-bold">
            {mins}:{secs}
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {editingTask ? (
            <input
              autoFocus
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onBlur={() => setEditingTask(false)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingTask(false)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500/50"
              placeholder="What are you working on?"
            />
          ) : (
            <button
              onClick={() => setEditingTask(true)}
              className="text-sm text-white/60 hover:text-white transition-colors text-left"
            >
              {task || 'Set task…'}
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleStart}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm transition-colors"
            >
              {running ? <Pause size={14} /> : <Play size={14} />}
              {running ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-sm transition-colors"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-1 border-t border-white/5">
        <div className="text-center">
          <div className="text-lg font-bold text-cyan-400">{sessionsToday}</div>
          <div className="text-xs text-white/40">sessions today</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-cyan-400">{focusMinutes}m</div>
          <div className="text-xs text-white/40">focus time</div>
        </div>
        {task && sessionsToday > 0 && (
          <div className="ml-auto flex items-center gap-1 text-xs text-green-400">
            <CheckCircle size={12} /> In the zone
          </div>
        )}
      </div>
    </div>
  )
}
