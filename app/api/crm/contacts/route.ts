import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('contacts')
    .select('*')
    .order('last_contact_date', { ascending: true, nullsFirst: true })

  if (error) return Response.json({ contacts: [] })

  const now = Date.now()
  const contacts = (data ?? []).map((c) => {
    const daysSince = c.last_contact_date
      ? Math.floor((now - new Date(c.last_contact_date).getTime()) / 86400000)
      : 999
    return {
      ...c,
      days_overdue: Math.max(0, daysSince - (c.contact_frequency_days ?? 30)),
    }
  })

  contacts.sort((a, b) => b.days_overdue - a.days_overdue)

  return Response.json({ contacts })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { name, relationship_type, contact_frequency_days, notes } = body
  if (!name) return Response.json({ error: 'name required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('contacts')
    .insert({ name, relationship_type, contact_frequency_days: contact_frequency_days ?? 30, notes })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ contact: data })
}
