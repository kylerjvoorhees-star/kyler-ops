import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('finance_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: false })
    .limit(24)
  if (error) return Response.json({ snapshots: [] })
  return Response.json({ snapshots: data ?? [] })
}

export async function POST(request: Request) {
  const { net_worth, assets, liabilities, notes } = await request.json()
  if (net_worth == null) return Response.json({ error: 'net_worth required' }, { status: 400 })

  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabaseAdmin
    .from('finance_snapshots')
    .upsert({
      snapshot_date: today,
      net_worth,
      assets: assets ?? {},
      liabilities: liabilities ?? {},
      notes,
    }, { onConflict: 'snapshot_date' })
    .select().single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ snapshot: data })
}
