import { supabaseAdmin } from '@/lib/supabase'
import { format, subDays, eachDayOfInterval } from 'date-fns'

export async function GET() {
  const since = subDays(new Date(), 13)
  const sinceStr = format(since, 'yyyy-MM-dd')

  const { data } = await supabaseAdmin
    .from('sessions')
    .select('started_at, duration_minutes, type')
    .gte('started_at', `${sinceStr}T00:00:00`)
    .eq('type', 'work')

  const days = eachDayOfInterval({ start: since, end: new Date() })
  const daily = days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayMinutes = (data ?? [])
      .filter(s => s.started_at.startsWith(dateStr))
      .reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0)
    return { date: dateStr, minutes: dayMinutes }
  })

  return Response.json({ daily })
}
