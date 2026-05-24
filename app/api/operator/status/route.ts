export async function GET() {
  return Response.json({
    telegramConnected: !!process.env.TELEGRAM_BOT_TOKEN,
  })
}
