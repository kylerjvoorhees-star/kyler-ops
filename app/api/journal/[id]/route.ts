import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_req: Request, ctx: RouteContext<'/api/journal/[id]'>) {
  const { id } = await ctx.params
  const { data, error } = await supabaseAdmin
    .from('journal_entries').select('*').eq('id', id).single()
  if (error) return Response.json({ error: error.message }, { status: 404 })
  return Response.json({ entry: data })
}

export async function PATCH(request: Request, ctx: RouteContext<'/api/journal/[id]'>) {
  const { id } = await ctx.params
  const body = await request.json()
  const { data, error } = await supabaseAdmin
    .from('journal_entries').update(body).eq('id', id).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ entry: data })
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/journal/[id]'>) {
  const { id } = await ctx.params
  await supabaseAdmin.from('journal_entries').delete().eq('id', id)
  return Response.json({ ok: true })
}
