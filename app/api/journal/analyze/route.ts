import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  const { data } = await supabaseAdmin
    .from('journal_entries')
    .select('entry_date, content, mood, word_count')
    .order('entry_date', { ascending: false })
    .limit(14)

  if (!data || data.length === 0) {
    return Response.json({
      themes: [],
      impliedTasks: [],
      moodTrend: 'No entries to analyze yet.',
      energyPattern: '',
      insight: 'Start journaling to unlock pattern analysis.',
    })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 600,
    system: `You are analyzing Kyler's personal journal entries for patterns and insights.
Extract meaningful patterns from the last 14 entries.
Return ONLY valid JSON (no markdown, no code fences):
{
  "themes": ["string", ...],
  "impliedTasks": ["string", ...],
  "moodTrend": "string",
  "energyPattern": "string",
  "insight": "string"
}
- themes: 3-5 recurring topics or emotional themes
- impliedTasks: specific action items implied in writing ("call Sarah", "follow up on X") — max 5
- moodTrend: one sentence on mood trajectory (improving/declining/stable and why)
- energyPattern: one sentence on energy/motivation patterns across entries
- insight: 2-3 sentences of the most valuable overall observation`,
    messages: [{
      role: 'user',
      content: `Journal entries:\n${data.map(e => `[${e.entry_date}] mood:${e.mood ?? '?'}\n${e.content}`).join('\n\n---\n\n')}`,
    }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
  try {
    const result = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())
    return Response.json(result)
  } catch {
    return Response.json({ themes: [], impliedTasks: [], moodTrend: 'Analysis unavailable.', energyPattern: '', insight: raw })
  }
}
