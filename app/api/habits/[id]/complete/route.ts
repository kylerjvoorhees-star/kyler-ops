import { supabaseAdmin } from '@/lib/supabase'
import { format } from 'date-fns'

export async function PATCH(_req: Request, ctx: RouteContext<'/api/habits/[id]/complete'>) {
  const { id } = await ctx.params
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: existing } = await supabaseAdmin
    .from('habit_completions')
    .select('id')
    .eq('habit_id', id)
    .eq('completed_date', today)
    .single()

  if (existing) {
    await supabaseAdmin.from('habit_completions').delete().eq('id', existing.id)
    return Response.json({ completed: false })
  } else {
    await supabaseAdmin.from('habit_completions').insert({ habit_id: id, completed_date: today })
    return Response.json({ completed: true })
  }
}
