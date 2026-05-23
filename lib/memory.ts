import { supabaseAdmin } from './supabase'

async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey === 'placeholder') {
    return new Array(1536).fill(0)
  }
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  })
  const data = await res.json()
  return data.data[0].embedding
}

export async function storeMemory(content: string, source: string, metadata = {}) {
  const embedding = await getEmbedding(content)
  const { error } = await supabaseAdmin.from('memory_chunks').insert({
    content,
    embedding: JSON.stringify(embedding),
    source,
    metadata,
  })
  if (error) throw error
}

export async function searchMemory(query: string, limit = 5) {
  const embedding = await getEmbedding(query)
  const { data, error } = await supabaseAdmin.rpc('match_memory_chunks', {
    query_embedding: JSON.stringify(embedding),
    match_count: limit,
  })
  if (error) throw error
  return data ?? []
}
