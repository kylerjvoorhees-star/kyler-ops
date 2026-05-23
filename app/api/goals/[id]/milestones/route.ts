import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_req: Request, ctx: RouteContext<'/api/goals/[id]/milestones'>) {
  const { id } = await ctx.params
  const { data, error } = await supabaseAdmin
    .from('goal_milestones').select('*').eq('goal_id', id)
    .order('created_at', { ascending: true })
  if (error) return Response.json({ milestones: [] })
  return Response.json({ milestones: data ?? [] })
}

export async function POST(request: Request, ctx: RouteContext<'/api/goals/[id]/milestones'>) {
  const { id } = await ctx.params
  const { title, due_date } = await request.json()
  if (!title) return Response.json({ error: 'title required' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('goal_milestones').insert({ goal_id: id, title, due_date }).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ milestone: data })
}
