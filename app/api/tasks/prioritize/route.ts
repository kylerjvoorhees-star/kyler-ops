import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'
import { format } from 'date-fns'

export async function POST() {
  const { data: tasks } = await supabaseAdmin
    .from('tasks')
    .select('id, title, description, priority, due_date, tags, created_at')
    .neq('status', 'done').neq('status', 'cancelled')

  if (!tasks || tasks.length === 0) return Response.json({ ok: true, updated: 0 })

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const today = format(new Date(), 'yyyy-MM-dd')

  const message = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 800,
    system: `You are Kyler's task prioritization engine. Given the list of tasks below, assign each a priority score from 0-10 (10 = most urgent/important). Consider: due dates, days overdue, task tags, and logical dependencies. Return ONLY valid JSON: [{"id": "...", "score": 9.2, "reason": "Due tomorrow, high impact"}]. No explanation outside the JSON.`,
    messages: [{
      role: 'user',
      content: `Today: ${today}\nTasks: ${JSON.stringify(tasks)}`,
    }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '[]'
  let scores: { id: string; score: number; reason: string }[]
  try {
    scores = JSON.parse(raw.replace(/```json\n?|\n?```/g, ''))
  } catch {
    return Response.json({ error: 'Claude returned invalid JSON' }, { status: 500 })
  }

  await Promise.all(
    scores.map(({ id, score, reason }) =>
      supabaseAdmin.from('tasks').update({
        ai_priority_score: score,
        ai_priority_reason: reason,
      }).eq('id', id)
    )
  )

  return Response.json({ ok: true, updated: scores.length })
}
