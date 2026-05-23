import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  const body = await request.json()
  const { description, amount, category, type } = body

  if (!amount || !type) {
    return Response.json({ error: 'amount and type are required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('finance_entries')
    .insert({ description, amount, category, type })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ entry: data })
}
