import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  const { data: entries } = await supabaseAdmin
    .from('journal_entries')
    .select('entry_date, content, mood, word_count')
    .order('entry_date', { ascending: false })
    .limit(14)

  if (!entries || entries.length === 0) {
    return Response.json({ insight: 'Not enough journal entries yet. Write a few more and I\'ll spot patterns.' })
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 150,
      system: `You are Kyler's personal AI. Based on his last 14 journal entries below, identify 2-3 specific patterns or insights about his mood, energy, recurring themes, or areas of growth. Be direct, warm, and specific — not generic. Max 60 words.`,
      messages: [{ role: 'user', content: JSON.stringify(entries) }],
    })

    const insight = message.content[0].type === 'text' ? message.content[0].text : ''
    return Response.json({ insight })
  } catch {
    return Response.json({ insight: 'Could not generate insights right now.' })
  }
}
