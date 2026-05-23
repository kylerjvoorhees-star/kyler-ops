import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  const { description, meal = 'snack' } = await request.json()
  if (!description) return Response.json({ error: 'description required' }, { status: 400 })

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 200,
      system: 'You are a nutrition expert. Extract macros from food descriptions. Respond with JSON only: { "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "description": "cleaned description" }. Make reasonable estimates.',
      messages: [{ role: 'user', content: description }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const macros = JSON.parse(raw.replace(/```json\n?|\n?```/g, ''))

    return Response.json({
      entry: {
        meal,
        description: macros.description ?? description,
        calories: Math.round(macros.calories ?? 0),
        protein_g: Math.round(macros.protein_g ?? 0),
        carbs_g: Math.round(macros.carbs_g ?? 0),
        fat_g: Math.round(macros.fat_g ?? 0),
      },
    })
  } catch {
    return Response.json({ error: 'Could not parse nutrition data.' }, { status: 500 })
  }
}
