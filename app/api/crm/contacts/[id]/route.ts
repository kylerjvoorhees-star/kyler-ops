import { supabaseAdmin } from '@/lib/supabase'
import { format } from 'date-fns'

export async function PATCH(request: Request, ctx: RouteContext<'/api/crm/contacts/[id]'>) {
  const { id } = await ctx.params
  const body = await request.json()
  const { action, notes, ...fields } = body

  if (action === 'log_interaction') {
    const today = format(new Date(), 'yyyy-MM-dd')
    await supabaseAdmin.from('contact_interactions').insert({ contact_id: id, interaction_date: today, notes })
    await supabaseAdmin.from('contacts').update({ last_contact_date: today }).eq('id', id)
    return Response.json({ ok: true })
  }

  const { data, error } = await supabaseAdmin
    .from('contacts')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ contact: data })
}
