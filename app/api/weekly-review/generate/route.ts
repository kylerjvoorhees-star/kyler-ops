import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns'

export async function POST() {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd')
  const sevenDaysAgo = format(subDays(now, 7), 'yyyy-MM-dd')

  // Gather all data from the past 7 days
  const [habitsRes, completionsRes, sessionsRes, tasksRes, nutritionRes, financeRes, journalRes] = await Promise.all([
    supabaseAdmin.from('habits').select('id, name'),
    supabaseAdmin.from('habit_completions').select('habit_id, completed_date').gte('completed_date', sevenDaysAgo),
    supabaseAdmin.from('sessions').select('task, duration_minutes, type, started_at').gte('started_at', `${sevenDaysAgo}T00:00:00`),
    supabaseAdmin.from('tasks').select('title, status, priority, completed_at').gte('created_at', `${sevenDaysAgo}T00:00:00`),
    supabaseAdmin.from('nutrition_logs').select('log_date, calories, protein_g, carbs_g').gte('log_date', sevenDaysAgo),
    supabaseAdmin.from('finance_entries').select('entry_date, amount, type, category').gte('entry_date', sevenDaysAgo),
    supabaseAdmin.from('journal_entries').select('entry_date, content, mood, word_count').gte('entry_date', sevenDaysAgo),
  ])

  const habits = habitsRes.data ?? []
  const completions = completionsRes.data ?? []
  const habitRate = habits.length > 0 ? Math.round((completions.length / (habits.length * 7)) * 100) : 0

  const sessions = sessionsRes.data ?? []
  const totalFocusMin = sessions.reduce((s, r) => s + (r.duration_minutes ?? 0), 0)

  const tasks = tasksRes.data ?? []
  const doneTasks = tasks.filter(t => t.status === 'done')

  const nutrition = nutritionRes.data ?? []
  const avgCals = nutrition.length > 0 ? Math.round(nutrition.reduce((s, n) => s + (n.calories ?? 0), 0) / nutrition.length) : 0

  const finance = financeRes.data ?? []
  const income = finance.filter(f => f.type === 'income').reduce((s, f) => s + Number(f.amount), 0)
  const expenses = finance.filter(f => f.type === 'expense').reduce((s, f) => s + Number(f.amount), 0)

  const journal = journalRes.data ?? []
  const avgMood = journal.length > 0 ? (journal.reduce((s, j) => s + (j.mood ?? 3), 0) / journal.length).toFixed(1) : 'N/A'

  const aggregated = {
    habits: { completion_rate: `${habitRate}%`, total_completions: completions.length, total_habits: habits.length },
    focus: { total_minutes: totalFocusMin, sessions: sessions.length },
    tasks: { completed: doneTasks.length, total: tasks.length, done_titles: doneTasks.slice(0, 5).map(t => t.title) },
    nutrition: { avg_calories: avgCals, days_logged: nutrition.length },
    finance: { income, expenses, net: income - expenses },
    journal: { entries: journal.length, avg_mood: avgMood },
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 400,
    system: `You are Kyler's Personal AI Operator writing his weekly review. Synthesize the data below into a brief, direct weekly summary. Structure your response with these exact section headers on their own lines:
WINS
MISSES
PATTERNS
NEXT WEEK FOCUS

Keep the entire review under 200 words. Tone: direct, warm, like a trusted advisor. No fluff. No bullet symbols.`,
    messages: [{
      role: 'user',
      content: `Week: ${format(weekStart, 'MMM d')} — ${format(weekEnd, 'MMM d, yyyy')}\nData: ${JSON.stringify(aggregated)}`,
    }],
  })

  const content = message.content[0].type === 'text' ? message.content[0].text : ''

  // Extract highlights from WINS section
  const winsMatch = content.match(/WINS\s*\n([\s\S]*?)(?:\n(?:MISSES|PATTERNS|NEXT WEEK FOCUS)|$)/)
  const highlights = winsMatch
    ? winsMatch[1].split('\n').map(l => l.trim()).filter(Boolean).slice(0, 3)
    : []

  const focusMatch = content.match(/NEXT WEEK FOCUS\s*\n([\s\S]*)$/)
  const focus_next_week = focusMatch ? focusMatch[1].trim() : ''

  const { data, error } = await supabaseAdmin
    .from('weekly_reviews')
    .upsert({
      week_start: weekStartStr,
      week_end: weekEndStr,
      content,
      highlights,
      focus_next_week,
      habits_summary: aggregated.habits,
      tasks_summary: aggregated.tasks,
      nutrition_summary: aggregated.nutrition,
      finance_summary: aggregated.finance,
      session_summary: aggregated.focus,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'week_start' })
    .select().single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ review: data })
}
