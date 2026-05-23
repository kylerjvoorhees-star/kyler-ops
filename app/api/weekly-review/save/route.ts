import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  const { week_start, week_end, content, highlights, focus_next_week } = await request.json()
  if (!week_start || !week_end) return Response.json({ error: 'week_start and week_end required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('weekly_reviews')
    .upsert({
      week_start,
      week_end,
      content: content ?? '',
      highlights: highlights ?? [],
      focus_next_week: focus_next_week ?? '',
      generated_at: new Date().toISOString(),
    }, { onConflict: 'week_start' })
    .select().single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ review: data })
}
