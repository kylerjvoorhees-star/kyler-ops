import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(request: Request, ctx: RouteContext<'/api/tasks/[id]'>) {
  const { id } = await ctx.params
  const body = await request.json()

  const updates: Record<string, unknown> = { ...body }
  if (body.status === 'done') updates.completed_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('tasks').update(updates).eq('id', id).select().single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ task: data })
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/tasks/[id]'>) {
  const { id } = await ctx.params
  await supabaseAdmin.from('tasks').delete().eq('id', id)
  return Response.json({ ok: true })
}
