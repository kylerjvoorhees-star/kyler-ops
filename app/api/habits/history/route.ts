import { supabaseAdmin } from '@/lib/supabase'
import { format, subDays } from 'date-fns'

export async function GET() {
  const since = format(subDays(new Date(), 29), 'yyyy-MM-dd')
  const { data, error } = await supabaseAdmin
    .from('habit_completions')
    .select('habit_id, completed_date')
    .gte('completed_date', since)
  if (error) return Response.json({ completions: [] })
  return Response.json({ completions: (data ?? []).map(c => ({ habit_id: c.habit_id, date: c.completed_date })) })
}
