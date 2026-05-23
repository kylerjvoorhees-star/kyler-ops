import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('goals').select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: true })
  if (error) return Response.json({ goals: [] })
  return Response.json({ goals: data ?? [] })
}

export async function POST(request: Request) {
  const { title, description, category, target_date } = await request.json()
  if (!title) return Response.json({ error: 'title required' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('goals').insert({ title, description, category, target_date }).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ goal: data })
}
