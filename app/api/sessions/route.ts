import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  const body = await request.json()
  const { started_at, ended_at, task, duration_minutes, type } = body

  const { data, error } = await supabaseAdmin
    .from('sessions')
    .insert({ started_at, ended_at, task, duration_minutes, type: type ?? 'work' })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ session: data })
}
