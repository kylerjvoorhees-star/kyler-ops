import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  const body = await request.json()
  const { title, start_time, end_time, event_type, notes } = body

  if (!title || !start_time) {
    return Response.json({ error: 'title and start_time are required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('calendar_events')
    .insert({ title, start_time, end_time, event_type: event_type ?? 'personal', notes })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ event: data })
}
