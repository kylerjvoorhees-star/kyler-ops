import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('captures')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return Response.json({ captures: [] })
  return Response.json({ captures: data ?? [] })
}

export async function POST(request: Request) {
  const { content, source, tags } = await request.json()
  if (!content) return Response.json({ error: 'content required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('captures')
    .insert({ content, source: source ?? 'manual', tags: tags ?? [] })
    .select().single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ capture: data })
}
