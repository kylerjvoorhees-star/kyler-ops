import { searchMemory } from '@/lib/memory'

export async function POST(request: Request) {
  const { query, limit } = await request.json()
  if (!query) return Response.json({ error: 'query required' }, { status: 400 })
  const results = await searchMemory(query, limit ?? 5)
  return Response.json({ results })
}
