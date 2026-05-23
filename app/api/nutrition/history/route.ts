import { supabaseAdmin } from '@/lib/supabase'
import { format, subDays, eachDayOfInterval } from 'date-fns'

export async function GET() {
  const since = subDays(new Date(), 6)
  const sinceStr = format(since, 'yyyy-MM-dd')

  const { data } = await supabaseAdmin
    .from('nutrition_logs')
    .select('log_date, calories, protein_g, carbs_g, fat_g')
    .gte('log_date', sinceStr)

  const days = eachDayOfInterval({ start: since, end: new Date() })
  const daily = days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const entries = (data ?? []).filter(n => n.log_date === dateStr)
    return {
      date: dateStr,
      calories: entries.reduce((s, n) => s + (n.calories ?? 0), 0),
      protein: entries.reduce((s, n) => s + Number(n.protein_g ?? 0), 0),
      carbs: entries.reduce((s, n) => s + Number(n.carbs_g ?? 0), 0),
      fat: entries.reduce((s, n) => s + Number(n.fat_g ?? 0), 0),
    }
  })

  return Response.json({ daily })
}
