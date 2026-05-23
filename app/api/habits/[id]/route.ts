import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(request: Request, ctx: RouteContext<'/api/habits/[id]'>) {
  const { id } = await ctx.params
  const body = await request.json()
  const { data, error } = await supabaseAdmin
    .from('habits').update(body).eq('id', id).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ habit: data })
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/habits/[id]'>) {
  const { id } = await ctx.params
  await supabaseAdmin.from('habits').delete().eq('id', id)
  return Response.json({ ok: true })
}
