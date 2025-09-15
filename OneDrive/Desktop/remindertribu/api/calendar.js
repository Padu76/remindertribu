// api/calendar.js
import { google } from 'googleapis';

function getEnv(name, fallback = '') {
  const v = process.env[name];
  return (typeof v === 'string' && v.length) ? v : fallback;
}

async function getCalendarClient() {
  const saJson = getEnv('GOOGLE_CALENDAR_SA_JSON');
  const calendarId = getEnv('GOOGLE_CALENDAR_ID');
  if (!saJson) throw Object.assign(new Error('Missing GOOGLE_CALENDAR_SA_JSON'), { code: 401 });
  if (!calendarId) throw Object.assign(new Error('Missing GOOGLE_CALENDAR_ID'), { code: 400 });

  const creds = JSON.parse(saJson);
  const auth = new google.auth.JWT(
    creds.client_email,
    undefined,
    creds.private_key,
    ['https://www.googleapis.com/auth/calendar.readonly']
  );
  await auth.authorize();
  const cal = google.calendar({ version: 'v3', auth });
  return { cal, calendarId };
}

function parseRange(qs) {
  const tz = getEnv('CALENDAR_TZ', 'Europe/Rome');
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();

  const defStart = new Date(y, m, 1);
  const defEnd = new Date(y, m + 1, 1);

  const from = (qs.from && /^\d{4}-\d{2}-\d{2}$/.test(qs.from))
    ? new Date(qs.from + 'T00:00:00')
    : defStart;
  const to = (qs.to && /^\d{4}-\d{2}-\d{2}$/.test(qs.to))
    ? new Date(qs.to + 'T00:00:00')
    : defEnd;

  return {
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    tz
  };
}

function normalizeEvents(items) {
  const out = [];
  for (const e of (items || [])) {
    const start = e.start?.dateTime || e.start?.date || null;
    const end = e.end?.dateTime || e.end?.date || null;
    if (!start || !end) continue;

    const allDay = !!e.start?.date && !!e.end?.date;
    const title = e.summary || '(Senza titolo)';

    out.push({
      id: e.id,
      title,
      start,
      end,
      allDay,
      location: e.location || '',
      attendees: Array.isArray(e.attendees) ? e.attendees.length : 0,
      htmlLink: e.htmlLink || ''
    });
  }
  return out;
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

    const { cal, calendarId } = await getCalendarClient();
    const { timeMin, timeMax, tz } = parseRange(req.query);

    const { data } = await cal.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      timeZone: tz,
      maxResults: 2500
    });

    const events = normalizeEvents(data.items);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ ok: true, count: events.length, events });

  } catch (err) {
    const code = err.code || 500;
    console.error('GCAL API error:', err);
    return res.status(code).json({ ok: false, error: err.message || 'Internal error' });
  }
}
