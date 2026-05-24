import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from './supabase'

const SYSTEM_PROMPT = `You are Operator, the AI brain of KylerOps — a personal productivity dashboard for Kyler Voorhees.

Your job is to parse natural language commands and route them to the correct section of the dashboard.

Respond ONLY with valid JSON in this exact shape:
{
  "action": "one of: add_task | add_habit_log | add_nutrition | add_journal | add_capture | add_crm_person | add_crm_task | add_review_note | add_finance_snapshot | general_query",
  "payload": { ...relevant fields for the action },
  "confirmation": "A short, friendly 1-sentence confirmation of what you're doing",
  "route": "optional: which page to navigate to — home | crm | finance | review | null"
}

Action payload shapes:
- add_task: { title, description?, priority?, due_date?, temperature?, is_blocker? }
- add_habit_log: { habit_name, completed, note? }
- add_nutrition: { meal, calories?, protein?, carbs?, fat?, note? }
- add_journal: { content, mood? }
- add_capture: { content, tags? }
- add_crm_person: { name, company?, temperature?, notes? }
- add_crm_task: { title, person_name?, temperature?, due_date? }
- add_review_note: { section, content }
- add_finance_snapshot: { net_worth, notes? }
- general_query: { question, answer }

For general_query, answer the question directly in the "answer" field of payload.

Examples:
- "Add a task to call John tomorrow" → add_task
- "I did my morning workout" → add_habit_log
- "Had a protein shake for breakfast, 300 calories" → add_nutrition
- "Feeling really motivated today" → add_journal
- "Remember to follow up with Sarah at Acme Corp" → add_capture or add_crm_person
- "My net worth is $45,000" → add_finance_snapshot
- "What should I focus on today?" → general_query`

export interface OperatorResult {
  action: string
  payload: Record<string, unknown>
  confirmation: string
  route: string | null
  answer?: string
}

export async function routeOperatorCommand(input: string): Promise<OperatorResult> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: input }],
  })

  const rawText = message.content[0].type === 'text' ? message.content[0].text : '{}'
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  const parsed: OperatorResult = jsonMatch
    ? JSON.parse(jsonMatch[0])
    : { action: 'general_query', payload: { answer: rawText }, confirmation: rawText, route: null }

  await executeAction(parsed)
  return parsed
}

async function executeAction(result: OperatorResult): Promise<void> {
  const { action, payload } = result
  try {
    switch (action) {
      case 'add_task':
        await supabaseAdmin.from('tasks').insert({
          title: payload.title,
          description: payload.description ?? null,
          priority: payload.priority ?? 3,
          due_date: payload.due_date ?? null,
          temperature: payload.temperature ?? null,
          is_blocker: payload.is_blocker ?? false,
        })
        break

      case 'add_habit_log': {
        const { data: habits } = await supabaseAdmin
          .from('habits')
          .select('id, name')
          .ilike('name', `%${payload.habit_name}%`)
          .limit(1)
        if (habits && habits.length > 0) {
          await supabaseAdmin.from('habit_completions').upsert(
            {
              habit_id: habits[0].id,
              completed_date: new Date().toISOString().split('T')[0],
            },
            { onConflict: 'habit_id,completed_date', ignoreDuplicates: true }
          )
        }
        break
      }

      case 'add_nutrition':
        await supabaseAdmin.from('nutrition_logs').insert({
          meal: payload.meal ?? 'snack',
          calories: payload.calories ?? null,
          protein: payload.protein ?? null,
          carbs: payload.carbs ?? null,
          fat: payload.fat ?? null,
          note: payload.note ?? null,
        })
        break

      case 'add_journal':
        await supabaseAdmin.from('journal_entries').insert({
          content: payload.content,
          mood: payload.mood ?? null,
        })
        break

      case 'add_capture':
        await supabaseAdmin.from('captures').insert({
          content: payload.content,
          tags: payload.tags ?? [],
        })
        break

      case 'add_crm_person':
        await supabaseAdmin.from('people').insert({
          name: payload.name,
          company: payload.company ?? null,
          temperature: payload.temperature ?? null,
          notes: payload.notes ?? null,
        })
        break

      case 'add_crm_task': {
        let personId: string | null = null
        if (payload.person_name) {
          const { data: people } = await supabaseAdmin
            .from('people')
            .select('id')
            .ilike('name', `%${payload.person_name}%`)
            .limit(1)
          if (people && people.length > 0) personId = people[0].id
        }
        await supabaseAdmin.from('tasks').insert({
          title: payload.title,
          temperature: payload.temperature ?? null,
          due_date: payload.due_date ?? null,
          ...(personId ? { person_id: personId } : {}),
        })
        break
      }

      case 'add_review_note': {
        const d = new Date()
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1)
        const weekStart = new Date(d.setDate(diff)).toISOString().split('T')[0]
        await supabaseAdmin.from('review_entries').insert({
          week_start: weekStart,
          section: payload.section,
          content: payload.content,
        })
        break
      }

      case 'add_finance_snapshot':
        await supabaseAdmin.from('finance_snapshots').upsert(
          {
            net_worth: payload.net_worth,
            notes: payload.notes ?? null,
            snapshot_date: new Date().toISOString().split('T')[0],
          },
          { onConflict: 'snapshot_date' }
        )
        break

      case 'general_query':
        result.answer = payload.answer as string
        break
    }
  } catch (err) {
    console.error('Operator execute error:', err)
  }
}
