import { supabaseAdmin } from '@/lib/supabase'
import { format, startOfWeek } from 'date-fns'

export async function GET() {
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const { data, error } = await supabaseAdmin
    .from('weekly_reviews')
    .select('*')
    .eq('week_start', weekStart)
    .single()

  if (error) return Response.json({ review: null })
  return Response.json({ review: data })
}
