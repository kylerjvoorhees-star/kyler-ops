import { routeOperatorCommand } from '@/lib/operatorRoute'

async function sendTelegram(chatId: string, text: string): Promise<void> {
  try {
    await fetch('https://api.telegram.org/bot' + process.env.TELEGRAM_BOT_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    })
  } catch (e) {
    console.error('sendTelegram failed:', e)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const message = body?.message
    if (!message?.text) return Response.json({ ok: true })

    const incomingChatId = message.chat.id.toString()
    const expectedChatId = process.env.TELEGRAM_CHAT_ID

    if (expectedChatId && incomingChatId !== expectedChatId) {
      await sendTelegram(incomingChatId,
        'KylerOps: unauthorized. Your chat ID is ' + incomingChatId +
        '. Update TELEGRAM_CHAT_ID in Netlify to this value.'
      )
      return Response.json({ ok: true })
    }

    const text = message.text as string

    if (text.trim().toLowerCase() === 'ping') {
      await sendTelegram(incomingChatId, 'pong - KylerOps is live')
      return Response.json({ ok: true })
    }

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('operator timeout')), 8000)
    )

    let replyText: string
    try {
      const result = await Promise.race([routeOperatorCommand(text), timeoutPromise])
      replyText = result.action === 'general_query' && result.answer
        ? result.answer
        : 'Done - ' + result.confirmation
      if (result.route && result.route !== 'null' && result.route !== null) {
        replyText += '\n\nHead to kylerops.com/' + (result.route === 'home' ? '' : result.route)
      }
    } catch (err) {
      console.error('routeOperatorCommand error:', err)
      replyText = 'KylerOps received your message but ran into an error. Try again?'
    }

    await sendTelegram(incomingChatId, replyText)
    return Response.json({ ok: true })
  } catch (err) {
    console.error('Telegram webhook error:', err)
    return Response.json({ ok: true })
  }
}
