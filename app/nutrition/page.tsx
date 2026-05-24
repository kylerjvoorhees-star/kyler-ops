'use client'

import { useState, useEffect } from 'react'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import Card from '@/app/components/Card'
import AIInsightButton from '@/app/components/AIInsightButton'

const GOALS = { calories: 2200, protein: 180, carbs: 200, fat: 70 }

interface NutritionLog {
  id?: string; meal?: string; description?: string; calories?: number
  protein_g?: number; carbs_g?: number; fat_g?: number; log_date?: string
}

interface DayTotals { date: string; calories: number; protein: number; carbs: number; fat: number }
interface Totals { calories: number; protein: number; carbs: number; fat: number }

const LABEL: React.CSSProperties = {
  fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: '#ffffff',
}

const inputStyle: React.CSSProperties = {
  background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#ffffff',
  borderRadius: '6px', padding: '8px 10px', fontSize: '11px', outline: 'none',
}

function MacroBar({ value, max, label, color = '#C9933A' }: { value: number; max: number; label: string; color?: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', color: '#aaaaaa' }}>{label}</span>
        <span style={{ fontSize: '11px', color: '#555' }}>{Math.round(value)}<span style={{ color: '#333' }}>/{max}</span></span>
      </div>
      <div style={{ height: '4px', background: '#1a1a1a', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width 0.4s' }} />
      </div>
    </div>
  )
}

// Simple inline SVG bar chart
function CalorieChart({ data }: { data: DayTotals[] }) {
  const max = Math.max(...data.map(d => d.calories), GOALS.calories)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '80px' }}>
      {data.map(d => {
        const h = max > 0 ? (d.calories / max) * 80 : 0
        const isToday = d.date === format(new Date(), 'yyyy-MM-dd')
        return (
          <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '8px', color: '#333' }}>{d.calories > 0 ? d.calories : ''}</span>
            <div style={{ width: '100%', height: `${Math.max(h, 2)}px`, background: isToday ? '#C9933A' : '#333', borderRadius: '2px 2px 0 0' }} />
            <span style={{ fontSize: '8px', color: isToday ? '#C9933A' : '#333' }}>{format(new Date(d.date + 'T12:00:00'), 'EEE')}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function NutritionPage() {
  const [totals, setTotals] = useState<Totals>({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [weekData, setWeekData] = useState<DayTotals[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ meal: 'lunch', description: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' })
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [totalsRes, histRes] = await Promise.all([
      fetch('/api/nutrition').catch(() => null),
      fetch('/api/nutrition/history').catch(() => null),
    ])
    if (totalsRes?.ok) setTotals((await totalsRes.json()).totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 })
    if (histRes?.ok) setWeekData((await histRes.json()).daily ?? [])
    setLoading(false)
  }

  async function saveMeal(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/nutrition', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meal: form.meal,
        description: form.description || undefined,
        calories: form.calories ? Number(form.calories) : undefined,
        protein_g: form.protein_g ? Number(form.protein_g) : undefined,
        carbs_g: form.carbs_g ? Number(form.carbs_g) : undefined,
        fat_g: form.fat_g ? Number(form.fat_g) : undefined,
      }),
    }).catch(() => null)
    setForm({ meal: 'lunch', description: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' })
    setShowForm(false); setSaving(false)
    await load()
  }

  const weekAvgCal = weekData.length > 0
    ? Math.round(weekData.reduce((s, d) => s + d.calories, 0) / weekData.filter(d => d.calories > 0).length || 0)
    : 0

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 300, color: '#ffffff', margin: 0 }}>Nutrition</h1>
            <p style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>{format(new Date(), 'EEEE, MMMM d')}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AIInsightButton context="Nutrition" data={{ totals, goals: GOALS, weekAvgCal }} />
            <button
              onClick={() => setShowForm(v => !v)}
              style={{ background: '#ffffff', borderRadius: '6px', padding: '7px 14px', fontSize: '11px', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              + Log Meal
            </button>
          </div>
        </div>

        {/* Today's macros */}
        <Card style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9933A' }} />
            <span style={LABEL}>Today</span>
            <span style={{ marginLeft: 'auto', fontSize: '22px', fontWeight: 300, color: '#ffffff' }}>
              {Math.round(totals.calories)}<span style={{ fontSize: '12px', color: '#444' }}> / {GOALS.calories} kcal</span>
            </span>
          </div>

          {loading ? (
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Loading…</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <MacroBar value={totals.calories} max={GOALS.calories} label="Calories" />
              <MacroBar value={totals.protein} max={GOALS.protein} label="Protein (g)" color="#888" />
              <MacroBar value={totals.carbs} max={GOALS.carbs} label="Carbs (g)" color="#666" />
              <MacroBar value={totals.fat} max={GOALS.fat} label="Fat (g)" color="#555" />
            </div>
          )}
        </Card>

        {/* Add meal form */}
        {showForm && (
          <Card style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9933A' }} />
              <span style={LABEL}>Log Meal</span>
            </div>
            <form onSubmit={saveMeal} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select value={form.meal} onChange={e => setForm(f => ({ ...f, meal: e.target.value }))}
                  style={{ ...inputStyle, width: '120px' }}>
                  {['breakfast', 'lunch', 'dinner', 'snack'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input
                  autoFocus value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description (optional)"
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {(['calories', 'protein_g', 'carbs_g', 'fat_g'] as const).map(field => (
                  <div key={field}>
                    <div style={{ fontSize: '9px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {field === 'calories' ? 'kcal' : field.replace('_g', 'g')}
                    </div>
                    <input
                      type="number" min="0" value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      placeholder="0"
                      style={{ ...inputStyle, width: '100%' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" disabled={saving}
                  style={{ background: '#C9933A', borderRadius: '6px', padding: '7px 18px', fontSize: '11px', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, opacity: saving ? 0.5 : 1 }}>
                  {saving ? 'Logging…' : 'Log Meal'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ background: 'transparent', border: '1px solid #222', borderRadius: '6px', padding: '7px 14px', fontSize: '11px', color: '#555', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Weekly view */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9933A' }} />
            <span style={LABEL}>7-Day Calories</span>
            {weekAvgCal > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#555' }}>avg {weekAvgCal} kcal/day</span>
            )}
          </div>

          {weekData.length > 0 && <CalorieChart data={weekData} />}

          <div style={{ height: '1px', background: '#1a1a1a', margin: '18px 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { label: 'Avg Calories', val: weekData.length > 0 ? Math.round(weekData.reduce((s, d) => s + d.calories, 0) / weekData.filter(d => d.calories > 0).length || 0) : 0 },
              { label: 'Avg Protein', val: weekData.length > 0 ? Math.round(weekData.reduce((s, d) => s + d.protein, 0) / weekData.filter(d => d.protein > 0).length || 0) : 0 },
              { label: 'Avg Carbs', val: weekData.length > 0 ? Math.round(weekData.reduce((s, d) => s + d.carbs, 0) / weekData.filter(d => d.carbs > 0).length || 0) : 0 },
              { label: 'Avg Fat', val: weekData.length > 0 ? Math.round(weekData.reduce((s, d) => s + d.fat, 0) / weekData.filter(d => d.fat > 0).length || 0) : 0 },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: '18px', fontWeight: 300, color: '#ffffff' }}>{s.val}</div>
                <div style={{ fontSize: '9px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
