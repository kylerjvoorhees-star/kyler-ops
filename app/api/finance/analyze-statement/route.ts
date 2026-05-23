import Anthropic from '@anthropic-ai/sdk'
import * as pdfParseModule from 'pdf-parse'
// pdf-parse uses CJS default export; handle both module shapes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfParse: (buffer: Buffer) => Promise<{ text: string; numpages: number }> = (pdfParseModule as any).default ?? pdfParseModule

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('pdf') as File | null
    if (!file) return Response.json({ error: 'No PDF provided' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const parsed = await pdfParse(buffer)
    const text = parsed.text.slice(0, 12000) // cap to ~12k chars

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are analyzing a bank/credit card statement for a personal finance dashboard. Extract and summarize:

1. Total income/credits (deposits, transfers in)
2. Total expenses/debits
3. Top 5 spending categories with amounts
4. Any recurring subscriptions detected
5. One key insight or anomaly
6. Net cashflow for this period

Statement text:
${text}

Respond as JSON with this shape:
{
  "period": "month/period detected",
  "income": number,
  "expenses": number,
  "net": number,
  "categories": [{"name": string, "amount": number}],
  "subscriptions": [{"name": string, "amount": number}],
  "insight": "one sentence insight",
  "raw_summary": "2-3 sentence plain English summary"
}`
      }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw_summary: content }

    return Response.json({ analysis, pages: parsed.numpages })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
