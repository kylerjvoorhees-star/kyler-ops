import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'
import { format } from 'date-fns'

export async function POST() {
  const { data: tasks } = await supabaseAdmin
    .from('tasks')
    .select('id, title, description, priority, due_date, is_blocker, ai_priority_score, status')
    .in('status', ['pending', 'in_progress'])
    .order('ai_priority_score', { ascending: false, nullsFirst: false })
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(30)

  if (!tasks || tasks.length === 0) {
    return Response.json({ focus: [] })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const today = format(new Date(), 'yyyy-MM-dd')

  const message = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 400,
    system: `You are Kyler's daily focus coach. Given pending tasks, pick the top 1-3 he should focus on TODAY.
Prioritize: overdue tasks, blockers, high-priority items due soon.
Return ONLY valid JSON (no markdown):
{"focus": [{"id": "...", "title": "...", "reason": "brief reason why today"}]}
Max 3 items. Reason should be 1 short sentence.`,
    messages: [{
      role: 'user',
      content: `Today: ${today}\nTasks: ${JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title, priority: t.priority, due_date: t.due_date, is_blocker: t.is_blocker, ai_score: t.ai_priority_score, status: t.status })))}`,
    }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
  try {
    const result = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())
    return Response.json(result)
  } catch {
    return Response.json({ focus: [] })
  }
}
