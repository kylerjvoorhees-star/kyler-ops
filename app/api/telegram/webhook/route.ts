// KylerOps Telegram Webhook — routes messages to Operator
//
// Setup (run once after deploy):
//   curl -X POST "https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook" \
//     -H "Content-Type: application/json" \
//     -d '{"url": "https://YOUR_DOMAIN/api/telegram/webhook"}'
//
// Required env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

import { routeOperatorCommand } from '@/lib/operatorRoute'

async function sendTelegram(chatId: string, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const message = body?.message

    // Ignore messages from unknown senders
    if (!message || message.chat.id.toString() !== process.env.TELEGRAM_CHAT_ID) {
      return Response.json({ ok: true })
    }

    const text = message.text as string
    if (!text) return Response.json({ ok: true })

    // Route through Operator
    const result = await routeOperatorCommand(text)

    let replyText = `✅ ${result.confirmation}`

    // If general query, include the answer
    if (result.action === 'general_query' && result.answer) {
      replyText = result.answer
    }

    // If a page route is suggested, mention it
    if (result.route && result.route !== 'null' && result.route !== null) {
      replyText += `\n\n→ Head to kylerops.com/${result.route === 'home' ? '' : result.route}`
    }

    await sendTelegram(message.chat.id.toString(), replyText)

    return Response.json({ ok: true })
  } catch (err) {
    console.error('Telegram webhook error:', err)
    return Response.json({ ok: true }) // Always return 200 to Telegram
  }
}
