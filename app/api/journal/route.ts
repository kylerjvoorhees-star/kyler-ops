import { supabaseAdmin } from '@/lib/supabase'
import { format } from 'date-fns'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('journal_entries')
    .select('id, entry_date, content, mood, word_count, ai_insight, created_at')
    .order('entry_date', { ascending: false })
    .limit(30)

  if (error) return Response.json({ entries: [] })
  return Response.json({ entries: data ?? [] })
}

export async function POST(request: Request) {
  const { content, mood, word_count, voice_transcript } = await request.json()
  if (!content) return Response.json({ error: 'content required' }, { status: 400 })

  const today = format(new Date(), 'yyyy-MM-dd')

  // Upsert today's entry
  const { data, error } = await supabaseAdmin
    .from('journal_entries')
    .upsert({
      entry_date: today,
      content,
      mood: mood ?? 3,
      word_count: word_count ?? content.split(/\s+/).filter(Boolean).length,
      voice_transcript,
    }, { onConflict: 'entry_date' })
    .select().single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ entry: data })
}
