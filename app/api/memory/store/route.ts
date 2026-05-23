import { storeMemory } from '@/lib/memory'

export async function POST(request: Request) {
  const { content, source, metadata } = await request.json()
  if (!content) return Response.json({ error: 'content required' }, { status: 400 })
  await storeMemory(content, source ?? 'manual', metadata)
  return Response.json({ ok: true })
}
