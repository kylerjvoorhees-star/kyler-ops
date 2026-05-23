import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('contact_interactions')
    .select('*')
    .order('interaction_date', { ascending: false })
    .limit(50)
  if (error) return Response.json({ interactions: [] })
  return Response.json({ interactions: data ?? [] })
}
