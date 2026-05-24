import { createDAVClient } from 'tsdav'
import { supabaseAdmin } from '@/lib/supabase'

// To register webhook after deploy, run:
// curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook" \
//   -H "Content-Type: application/json" \
//   -d '{"url": "https://kylerops.com/api/telegram/webhook"}'

function randomUID(): string {
  return crypto.randomUUID()
}

function formatICalDate(dateStr: string, timeStr?: string, allDay?: boolean): string {
  if (allDay) {
    return dateStr.replace(/-/g, '')
  }
  const combined = `${dateStr}T${timeStr ?? '09:00'}:00`
  // Convert to UTC-ish (Denver is UTC-7 standard, UTC-6 MDT)
  // We'll use the ISO string directly for simplicity
  return combined.replace(/[-:]/g, '').replace('T', 'T')
}

export async function POST(request: Request) {
  try {
    const { title, startDate, startTime, endTime, notes, allDay } = await request.json()

    if (!title || !startDate) {
      return Response.json({ error: 'Title and startDate required' }, { status: 400 })
    }

    const uid = randomUID()
    const endDate = startDate // same day for simplicity

    let icalContent: string
    if (allDay) {
      icalContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//KylerOps//EN',
        'BEGIN:VEVENT',
        `UID:${uid}@kylerops.com`,
        `DTSTART;VALUE=DATE:${startDate.replace(/-/g, '')}`,
        `DTEND;VALUE=DATE:${endDate.replace(/-/g, '')}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${notes ?? ''}`,
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n')
    } else {
      const dtStart = `${startDate.replace(/-/g, '')}T${(startTime ?? '09:00').replace(':', '')}00`
      const dtEnd = `${endDate.replace(/-/g, '')}T${(endTime ?? startTime ?? '10:00').replace(':', '')}00`
      icalContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//KylerOps//EN',
        'BEGIN:VEVENT',
        `UID:${uid}@kylerops.com`,
        `DTSTART;TZID=America/Denver:${dtStart}`,
        `DTEND;TZID=America/Denver:${dtEnd}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${notes ?? ''}`,
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n')
    }

    let caldavSuccess = false

    // Try iCloud CalDAV if credentials are set
    if (process.env.APPLE_CALDAV_USERNAME && process.env.APPLE_CALDAV_APP_PASSWORD) {
      try {
        const client = await createDAVClient({
          serverUrl: 'https://caldav.icloud.com',
          credentials: {
            username: process.env.APPLE_CALDAV_USERNAME,
            password: process.env.APPLE_CALDAV_APP_PASSWORD,
          },
          authMethod: 'Basic',
          defaultAccountType: 'caldav',
        })

        const calendars = await client.fetchCalendars()
        if (calendars.length > 0) {
          await client.createCalendarObject({
            calendar: calendars[0],
            filename: `${uid}.ics`,
            iCalString: icalContent,
          })
          caldavSuccess = true
        }
      } catch (caldavErr) {
        console.error('CalDAV write failed:', caldavErr)
      }
    }

    // Always also write to Supabase calendar_events as fallback/record
    const startTimestamp = allDay
      ? `${startDate}T00:00:00`
      : `${startDate}T${startTime ?? '09:00'}:00`
    const endTimestamp = allDay
      ? `${startDate}T23:59:59`
      : `${startDate}T${endTime ?? startTime ?? '10:00'}:00`

    const { data, error } = await supabaseAdmin
      .from('calendar_events')
      .insert({
        title,
        start_time: startTimestamp,
        end_time: endTimestamp,
        event_type: allDay ? 'personal' : 'personal',
        description: notes ?? null,
      })
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, uid, caldavSynced: caldavSuccess, event: data })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
