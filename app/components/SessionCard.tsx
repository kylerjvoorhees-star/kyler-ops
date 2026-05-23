'use client'

import { useState, useEffect, useRef } from 'react'
import Drawer from './Drawer'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

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
  const [showHistory, setShowHistory] = useState(false)
  const [historyData, setHistoryData] = useState<{ date: string; minutes: number }[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef<Date | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
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
    setSessionsToday(n => n + 1)
    setFocusMinutes(n => n + WORK_MINS)
    if (startedAtRef.current) {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          started_at: startedAtRef.current.toISOString(),
          ended_at: new Date().toISOString(),
          task, duration_minutes: WORK_MINS, type: 'work',
        }),
      }).catch(() => null)
    }
  }

  async function loadHistory() {
    const res = await fetch('/api/sessions/history').catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      setHistoryData(data.daily ?? [])
    }
    setShowHistory(true)
  }

  function handleStart() {
    if (!running) startedAtRef.current = new Date()
    setRunning(r => !r)
  }

  function handleReset() { setRunning(false); setMode('work'); setSecondsLeft(WORK_MINS * 60) }

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')
  const totalSecs = mode === 'work' ? WORK_MINS * 60 : BREAK_MINS * 60
  const progress = 1 - secondsLeft / totalSecs
  const r = 42, C = 2 * Math.PI * r

  return (
    <>
      <div style={{ background: '#071E30', borderRadius: '8px', padding: '18px', border: '0.5px solid #0A2840' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1D9E75' }} />
          <span style={{ fontSize: '9px', letterSpacing: '0.18em', color: '#378ADD', textTransform: 'uppercase' }}>Session</span>
          <span style={{
            marginLeft: '4px', fontSize: '9px', padding: '1px 6px',
            background: mode === 'work' ? '#0C3A2A' : '#0C2E50',
            color: mode === 'work' ? '#5DCAA5' : '#378ADD',
            borderRadius: '20px', letterSpacing: '0.1em',
          }}>{mode === 'work' ? 'FOCUS' : 'BREAK'}</span>
          <button onClick={loadHistory} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1E4060', cursor: 'pointer', fontSize: '12px' }}>↗</button>
        </div>

        {/* Timer ring + controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ position: 'relative', width: '96px', height: '96px', flexShrink: 0 }}>
            <svg width="96" height="96" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="48" cy="48" r={r} fill="none" stroke="#0A2840" strokeWidth="5" />
              <circle cx="48" cy="48" r={r} fill="none"
                stroke={mode === 'work' ? '#1D9E75' : '#378ADD'} strokeWidth="5"
                strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-geist-mono)', fontSize: '20px',
              fontWeight: 200, color: '#5DCAA5',
            }}>
              {mins}:{secs}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {editingTask ? (
              <input
                autoFocus value={task}
                onChange={e => setTask(e.target.value)}
                onBlur={() => setEditingTask(false)}
                onKeyDown={e => e.key === 'Enter' && setEditingTask(false)}
                placeholder="Current task…"
                style={{ background: '#040F1C', border: '0.5px solid #0A2840', borderRadius: '5px', padding: '6px 8px', fontSize: '11px', color: '#7AABCC', outline: 'none', width: '100%' }}
              />
            ) : (
              <button onClick={() => setEditingTask(true)} style={{ background: 'none', border: 'none', textAlign: 'left', fontSize: '12px', color: task ? '#7AABCC' : '#1E4060', cursor: 'pointer', padding: 0 }}>
                {task || 'Set task…'}
              </button>
            )}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handleStart} style={{ background: '#0F6E56', borderRadius: '5px', padding: '6px 14px', fontSize: '11px', color: '#9FE1CB', border: 'none', cursor: 'pointer' }}>
                {running ? '⏸ Pause' : '▶ Start'}
              </button>
              <button onClick={handleReset} style={{ background: 'transparent', border: '0.5px solid #0A2840', borderRadius: '5px', padding: '6px 10px', fontSize: '11px', color: '#1E4060', cursor: 'pointer' }}>
                ↺
              </button>
            </div>
          </div>
        </div>

        <div style={{ height: '0.5px', background: '#0A2840', margin: '14px 0' }} />

        {/* Stats */}
        <div style={{ display: 'flex', gap: '24px' }}>
          {[
            { val: sessionsToday, label: 'SESSIONS' },
            { val: `${focusMinutes}m`, label: 'FOCUS' },
          ].map(({ val, label }) => (
            <div key={label}>
              <div style={{ fontSize: '16px', fontWeight: 300, color: '#5DCAA5' }}>{val}</div>
              <div style={{ fontSize: '9px', letterSpacing: '0.08em', color: '#1E4060', textTransform: 'uppercase', marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <Drawer open={showHistory} onClose={() => setShowHistory(false)} title="Session History" dotColor="#1D9E75">
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '9px', letterSpacing: '0.08em', color: '#1E4060', textTransform: 'uppercase', marginBottom: '12px' }}>Daily Focus Minutes — Last 14 Days</div>
          <div style={{ height: '160px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#1E4060' }} tickFormatter={d => d.slice(5)} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#071E30', border: '0.5px solid #0A2840', borderRadius: '5px', fontSize: '11px' }}
                  labelStyle={{ color: '#378ADD' }} itemStyle={{ color: '#7AABCC' }}
                />
                <Bar dataKey="minutes" fill="#1D9E75" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ height: '0.5px', background: '#0A2840', marginBottom: '16px' }} />
        <div style={{ fontSize: '12px', color: '#1E4060' }}>
          {historyData.length === 0 ? 'No session data yet. Start your first Pomodoro to track focus.' : `Total sessions tracked across ${historyData.length} days.`}
        </div>
      </Drawer>
    </>
  )
}
