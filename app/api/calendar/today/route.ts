import { supabaseAdmin } from '@/lib/supabase'
import { format, startOfDay, endOfDay, addHours } from 'date-fns'

export async function GET() {
  const now = new Date()
  const dayStart = startOfDay(now).toISOString()
  const dayEnd = endOfDay(now).toISOString()

  const { data, error } = await supabaseAdmin
    .from('calendar_events')
    .select('*')
    .gte('start_time', dayStart)
    .lte('start_time', dayEnd)
    .order('start_time', { ascending: true })

  if (error) return Response.json({ events: [] })

  // Seed mock events if none exist
  if (!data || data.length === 0) {
    const mockEvents = [
      { title: 'Team standup', start_time: addHours(startOfDay(now), 9).toISOString(), event_type: 'work' },
      { title: 'Deep work block', start_time: addHours(startOfDay(now), 10).toISOString(), end_time: addHours(startOfDay(now), 12).toISOString(), event_type: 'work' },
      { title: 'Lunch', start_time: addHours(startOfDay(now), 12).toISOString(), event_type: 'personal' },
      { title: 'Gym', start_time: addHours(startOfDay(now), 17).toISOString(), event_type: 'health' },
    ].map((e) => ({ ...e, id: crypto.randomUUID() }))
    return Response.json({ events: mockEvents })
  }

  return Response.json({ events: data })
}
