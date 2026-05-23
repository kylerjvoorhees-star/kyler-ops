import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const isBlocker = url.searchParams.get('is_blocker')
  const parentId = url.searchParams.get('parent_id')

  let query = supabaseAdmin.from('tasks').select('*')

  if (status === 'done') {
    query = query.eq('status', 'done').order('completed_at', { ascending: false }).limit(50)
  } else {
    query = query.neq('status', 'done').neq('status', 'cancelled')
      .order('ai_priority_score', { ascending: false, nullsFirst: false })
      .order('due_date', { ascending: true, nullsFirst: false })
  }

  if (isBlocker === 'true') query = query.eq('is_blocker', true)
  if (parentId) query = query.eq('parent_task_id', parentId)

  const { data, error } = await query
  if (error) return Response.json({ tasks: [] })
  return Response.json({ tasks: data ?? [] })
}

export async function POST(request: Request) {
  const { title, description, priority, due_date, tags, is_blocker, temperature, parent_task_id } = await request.json()
  if (!title) return Response.json({ error: 'title required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .insert({ title, description, priority: priority ?? 3, due_date, tags, is_blocker, temperature, parent_task_id })
    .select().single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ task: data })
}
