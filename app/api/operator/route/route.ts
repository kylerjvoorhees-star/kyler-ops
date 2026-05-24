import { routeOperatorCommand } from '@/lib/operatorRoute'

export async function POST(request: Request) {
  try {
    const { input } = await request.json()
    if (!input?.trim()) return Response.json({ error: 'No input provided' }, { status: 400 })
    const result = await routeOperatorCommand(input)
    return Response.json(result)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
