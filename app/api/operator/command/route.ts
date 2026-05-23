import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { command } = await request.json()
    if (!command) return Response.json({ result: 'No command provided.' }, { status: 400 })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const systemPrompt = `You are Kyler's Personal AI Operator. Parse natural language commands and route them to the correct module. Respond with a JSON object: { "module": "habits|crm|nutrition|calendar|finance|general", "action": "...", "data": {...}, "response": "confirmation message to user" }.

Examples:
- "add habit: meditate 10min" → { module: "habits", action: "create", data: { name: "Meditate 10min" }, response: "Added habit: Meditate 10min" }
- "log lunch: chicken rice veggies" → { module: "nutrition", action: "log", data: { description: "chicken rice veggies", meal: "lunch" }, response: "Logged your lunch." }
- "I talked to Sarah today" → { module: "crm", action: "log_interaction", data: { name: "Sarah" }, response: "Logged interaction with Sarah." }
- "remind me to call John at 3pm" → { module: "calendar", action: "create", data: { title: "Call John", time: "15:00", type: "personal" }, response: "Added: Call John at 3pm." }

Always respond with valid JSON only.`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: command }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '{}'
    let parsed: { module: string; action: string; data: Record<string, unknown>; response: string }

    try {
      parsed = JSON.parse(rawText.replace(/```json\n?|\n?```/g, ''))
    } catch {
      return Response.json({ result: rawText })
    }

    // Execute the routed action
    if (parsed.module === 'habits' && parsed.action === 'create') {
      await supabaseAdmin.from('habits').insert({ name: parsed.data.name })
    } else if (parsed.module === 'nutrition' && parsed.action === 'log') {
      const parseRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXTAUTH_URL ?? '' : ''}/api/nutrition/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: parsed.data.description, meal: parsed.data.meal }),
      }).catch(() => null)
      if (parseRes?.ok) {
        const { entry } = await parseRes.json()
        if (entry) await supabaseAdmin.from('nutrition_logs').insert(entry)
      }
    } else if (parsed.module === 'calendar' && parsed.action === 'create' && parsed.data.time) {
      const today = new Date().toISOString().split('T')[0]
      await supabaseAdmin.from('calendar_events').insert({
        title: parsed.data.title,
        start_time: `${today}T${parsed.data.time}:00`,
        event_type: parsed.data.type ?? 'personal',
      })
    }

    return Response.json({ result: parsed.response ?? 'Done.' })
  } catch (err) {
    return Response.json({ result: 'Command processed.' })
  }
}
