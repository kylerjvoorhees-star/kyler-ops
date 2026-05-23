import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'
import { format, addHours } from 'date-fns'

export async function GET() {
  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')
  const hour = now.getHours()
  const timeStr = format(now, 'h:mm a')

  try {
    const [habitsRes, completionsRes, sessionsRes, tasksRes, nutritionRes, calendarRes, journalRes] = await Promise.all([
      supabaseAdmin.from('habits').select('id'),
      supabaseAdmin.from('habit_completions').select('habit_id').eq('completed_date', today),
      supabaseAdmin.from('sessions').select('duration_minutes').gte('started_at', `${today}T00:00:00`).eq('type', 'work'),
      supabaseAdmin.from('tasks').select('id, status, due_date').neq('status', 'done').neq('status', 'cancelled'),
      supabaseAdmin.from('nutrition_logs').select('calories').eq('log_date', today),
      supabaseAdmin.from('calendar_events').select('title, start_time').gte('start_time', now.toISOString()).lte('start_time', addHours(now, 4).toISOString()).order('start_time', { ascending: true }).limit(3),
      supabaseAdmin.from('journal_entries').select('mood').eq('entry_date', format(new Date(now.getTime() - 86400000), 'yyyy-MM-dd')).single(),
    ])

    const totalHabits = habitsRes.data?.length ?? 0
    const doneHabits = completionsRes.data?.length ?? 0
    const focusMinutes = (sessionsRes.data ?? []).reduce((s, r) => s + (r.duration_minutes ?? 0), 0)
    const sessionCount = sessionsRes.data?.length ?? 0
    const allTasks = tasksRes.data ?? []
    const pendingTasks = allTasks.length
    const overdueTasks = allTasks.filter(t => t.due_date && new Date(t.due_date + 'T23:59:59') < now).length
    const loggedCals = (nutritionRes.data ?? []).reduce((s, n) => s + (n.calories ?? 0), 0)
    const upcomingEvents = (calendarRes.data ?? []).map(e => `${e.title} at ${format(new Date(e.start_time), 'h:mm a')}`).join(', ')
    const yesterdayMood = journalRes.data?.mood ?? null

    const prompt = `You are Kyler's Personal AI Operator. Generate a concise morning briefing (max 120 words) using this real data:

Current time: ${timeStr}
Habits: ${doneHabits}/${totalHabits} done today
Tasks: ${pendingTasks} pending, ${overdueTasks} overdue
Focus: ${sessionCount} sessions, ${focusMinutes}m today
Nutrition: ${loggedCals}/2200 kcal logged
Upcoming: ${upcomingEvents || 'nothing in the next 4 hours'}
Journal mood yesterday: ${yesterdayMood ? `${yesterdayMood}/5` : 'no entry'}

Include:
1. Time-appropriate greeting (use actual time of day: ${timeStr})
2. Most important thing to do right now (based on tasks/calendar)
3. One honest observation about trends (habits, nutrition, or tasks)
4. One short energizing line to close

Tone: direct, warm, like a trusted advisor — not a chatbot. No bullet points. Plain text only.`

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const briefing = message.content[0].type === 'text' ? message.content[0].text : ''
    return Response.json({ briefing })
  } catch {
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    return Response.json({ briefing: `${greeting}, Kyler. Let's make today count.` })
  }
}
