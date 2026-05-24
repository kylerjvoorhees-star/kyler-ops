import { NextResponse } from "next/server"

export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || ""
  const chatId = process.env.TELEGRAM_CHAT_ID || ""
  const anthropicKey = process.env.ANTHROPIC_API_KEY || ""

  let telegramMe = null
  if (botToken) {
    try {
      const res = await fetch("https://api.telegram.org/bot" + botToken + "/getMe")
      telegramMe = await res.json()
    } catch (e) {
      telegramMe = { error: String(e) }
    }
  }

  return NextResponse.json({
    has_bot_token: !!botToken,
    bot_token_length: botToken.length,
    bot_token_prefix: botToken.slice(0, 10) + "...",
    has_chat_id: !!chatId,
    chat_id_masked: chatId ? chatId.slice(0, 4) + "****" + chatId.slice(-2) : "not set",
    has_anthropic_key: !!anthropicKey,
    anthropic_key_length: anthropicKey.length,
    telegram_me: telegramMe,
  })
}
