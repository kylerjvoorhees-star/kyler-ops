import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  try {
    const { context, data } = await request.json()

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      system: `You are an AI analyst for KylerOps, a personal dashboard for Kyler Voorhees. Given data from a specific section, provide a SHORT (2-4 sentence) actionable insight. Be direct, specific, and helpful. Speak to Kyler directly. No fluff.`,
      messages: [{
        role: 'user',
        content: `Section: ${context}\n\nData: ${JSON.stringify(data, null, 2)}`,
      }],
    })

    const insight = message.content[0].type === 'text' ? message.content[0].text : 'No insight available.'
    return Response.json({ insight })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
