import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('weekly_reviews')
    .select('*')
    .order('week_start', { ascending: false })
    .limit(12)
  if (error) return Response.json({ reviews: [] })
  return Response.json({ reviews: data ?? [] })
}
