import { supabaseAdmin } from '@/lib/supabase'
import { format } from 'date-fns'

export async function GET() {
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: habits, error } = await supabaseAdmin
    .from('habits')
    .select('id, name, icon, created_at')
    .order('created_at', { ascending: true })

  if (error) return Response.json({ habits: [] })

  const { data: completions } = await supabaseAdmin
    .from('habit_completions')
    .select('habit_id, completed_date')
    .in('habit_id', habits.map((h) => h.id))

  const completedToday = new Set(
    (completions ?? []).filter((c) => c.completed_date === today).map((c) => c.habit_id)
  )

  const streakMap: Record<string, number> = {}
  for (const h of habits) {
    const dates = (completions ?? [])
      .filter((c) => c.habit_id === h.id)
      .map((c) => c.completed_date)
      .sort()
      .reverse()

    let streak = 0
    let check = new Date()
    for (const d of dates) {
      const checkStr = format(check, 'yyyy-MM-dd')
      if (d === checkStr) {
        streak++
        check = new Date(check.getTime() - 86400000)
      } else {
        break
      }
    }
    streakMap[h.id] = streak
  }

  const result = habits.map((h) => ({
    ...h,
    streak: streakMap[h.id] ?? 0,
    completedToday: completedToday.has(h.id),
  }))

  return Response.json({ habits: result })
}

export async function POST(request: Request) {
  const { name, icon } = await request.json()
  if (!name) return Response.json({ error: 'name is required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('habits')
    .insert({ name, icon })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ habit: data })
}
