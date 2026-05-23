import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(_req: Request, ctx: RouteContext<'/api/captures/[id]'>) {
  const { id } = await ctx.params
  await supabaseAdmin.from('captures').delete().eq('id', id)
  return Response.json({ ok: true })
}

export async function PATCH(request: Request, ctx: RouteContext<'/api/captures/[id]'>) {
  const { id } = await ctx.params
  const body = await request.json()
  const { data, error } = await supabaseAdmin.from('captures').update(body).eq('id', id).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ capture: data })
}
