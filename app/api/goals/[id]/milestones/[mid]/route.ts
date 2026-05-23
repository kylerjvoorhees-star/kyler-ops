import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(request: Request, ctx: RouteContext<'/api/goals/[id]/milestones/[mid]'>) {
  const { id, mid } = await ctx.params
  const body = await request.json()

  if (body.toggle) {
    const { data: existing } = await supabaseAdmin
      .from('goal_milestones').select('completed').eq('id', mid).single()
    const completed = !existing?.completed
    const { data, error } = await supabaseAdmin
      .from('goal_milestones')
      .update({ completed, completed_at: completed ? new Date().toISOString() : null })
      .eq('id', mid).select().single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ milestone: data })
  }

  const { data, error } = await supabaseAdmin
    .from('goal_milestones').update(body).eq('id', mid).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ milestone: data })
}
