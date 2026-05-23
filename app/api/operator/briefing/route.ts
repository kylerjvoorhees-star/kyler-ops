import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'
import { format } from 'date-fns'

export async function GET() {
  try {
    const today = format(new Date(), 'yyyy-MM-dd')
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

    const [habitsRes, contactsRes] = await Promise.all([
      supabaseAdmin.from('habits').select('id, name'),
      supabaseAdmin
        .from('contacts')
        .select('name, last_contact_date, contact_frequency_days')
        .order('last_contact_date', { ascending: true })
        .limit(10),
    ])

    const habits = habitsRes.data ?? []
    const completionsRes = await supabaseAdmin
      .from('habit_completions')
      .select('habit_id')
      .eq('completed_date', today)

    const completedIds = new Set((completionsRes.data ?? []).map((c) => c.habit_id))
    const doneCount = habits.filter((h) => completedIds.has(h.id)).length

    const contacts = contactsRes.data ?? []
    const overdue = contacts.filter((c) => {
      if (!c.last_contact_date) return true
      const daysSince = Math.floor((Date.now() - new Date(c.last_contact_date).getTime()) / 86400000)
      return daysSince > (c.contact_frequency_days ?? 30)
    })

    const prompt = `You are Kyler's Personal AI Operator. Generate a concise morning briefing (max 150 words) that includes:
1. ${greeting}, Kyler greeting with the current time
2. Today's habit completion status: ${doneCount}/${habits.length} done
3. ${overdue.length > 0 ? `Overdue contacts to reach out to: ${overdue.map((c) => c.name).join(', ')}` : 'All contacts are up to date'}
4. A motivating one-liner based on recent progress

Keep the tone direct, warm, and energizing. Format as plain text, no markdown. Today is ${format(new Date(), 'EEEE, MMMM d')}.`

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const briefing = message.content[0].type === 'text' ? message.content[0].text : ''
    return Response.json({ briefing })
  } catch (err) {
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    return Response.json({ briefing: `${greeting}, Kyler. Your AI operator is warming up. Let's have a great day.` })
  }
}
