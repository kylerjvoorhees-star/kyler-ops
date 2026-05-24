import { createDAVClient } from 'tsdav'
import { supabaseAdmin } from '@/lib/supabase'

function randomUID(): string {
  return crypto.randomUUID()
}

export async function POST(request: Request) {
  try {
    const { title, startDate, startTime, endTime, notes, allDay } = await request.json()
    if (!title || !startDate) {
      return Response.json({ error: 'Title and startDate required' }, { status: 400 })
    }
    const uid = randomUID()
    const endDate = startDate
    let icalContent: string
    if (allDay) {
      icalContent = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KylerOps//EN',
        'BEGIN:VEVENT',
        'UID:' + uid + '@kylerops.com',
        'DTSTART;VALUE=DATE:' + startDate.replace(/-/g, ''),
        'DTEND;VALUE=DATE:' + endDate.replace(/-/g, ''),
        'SUMMARY:' + title,
        'DESCRIPTION:' + (notes ?? ''),
        'END:VEVENT', 'END:VCALENDAR',
      ].join('\r\n')
    } else {
      const dtStart = startDate.replace(/-/g, '') + 'T' + (startTime ?? '09:00').replace(':', '') + '00'
      const dtEnd = endDate.replace(/-/g, '') + 'T' + (endTime ?? startTime ?? '10:00').replace(':', '') + '00'
      icalContent = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KylerOps//EN',
        'BEGIN:VEVENT',
        'UID:' + uid + '@kylerops.com',
        'DTSTART;TZID=America/Denver:' + dtStart,
        'DTEND;TZID=America/Denver:' + dtEnd,
        'SUMMARY:' + title,
        'DESCRIPTION:' + (notes ?? ''),
        'END:VEVENT', 'END:VCALENDAR',
      ].join('\r\n')
    }
    let caldavSuccess = false
    if (process.env.APPLE_CALDAV_USERNAME && process.env.APPLE_CALDAV_APP_PASSWORD) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('CalDAV timeout')), 5000)
        )
        const caldavPromise = (async () => {
          const client = await createDAVClient({
            serverUrl: 'https://caldav.icloud.com',
            credentials: {
              username: process.env.APPLE_CALDAV_USERNAME!,
              password: process.env.APPLE_CALDAV_APP_PASSWORD!,
            },
            authMethod: 'Basic',
            defaultAccountType: 'caldav',
          })
          const calendars = await client.fetchCalendars()
          if (calendars.length > 0) {
            await client.createCalendarObject({
              calendar: calendars[0],
              filename: uid + '.ics',
              iCalString: icalContent,
            })
            return true
          }
          return false
        })()
        caldavSuccess = await Promise.race([caldavPromise, timeoutPromise])
      } catch (caldavErr) {
        console.error('CalDAV write failed:', caldavErr)
      }
    }
    const startTimestamp = allDay ? startDate + 'T00:00:00' : startDate + 'T' + (startTime ?? '09:00') + ':00'
    const endTimestamp = allDay ? startDate + 'T23:59:59' : startDate + 'T' + (endTime ?? startTime ?? '10:00') + ':00'
    const { data, error } = await supabaseAdmin
      .from('calendar_events')
      .insert({ title, start_time: startTimestamp, end_time: endTimestamp, event_type: 'personal', description: notes ?? null })
      .select()
      .single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true, uid, caldavSynced: caldavSuccess, event: data })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
