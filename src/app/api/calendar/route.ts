import { z } from 'zod';

// Invitations run in a sandbox that cannot download files, so their "Add to calendar" button opens
// this address instead. On iPhone, iPad and Mac it opens the Calendar app's "Add event" screen.
const plain = (max: number) => z.string().trim().max(max).regex(/^[^\u0000-\u0008\u000b-\u001f]*$/).default('');
const query = z.object({
  title: plain(150).pipe(z.string().min(1)),
  start: z.coerce.number().int().positive(),
  end: z.coerce.number().int().positive(),
  location: plain(300),
  details: plain(600),
}).refine(q => q.end > q.start && q.end - q.start <= 7 * 24 * 3600_000);

const icsText = (text: string) => text.replace(/[\\;,]/g, ch => `\\${ch}`).replace(/\r?\n/g, '\\n');
const icsDate = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

export function GET(request: Request) {
  const parsed = query.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return new Response('Invalid calendar event.', { status: 400 });
  const { title, start, end, location, details } = parsed.data;
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//WeInviteU//Invitation//EN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${start}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}@weinviteu.in`,
    `DTSTAMP:${icsDate(Date.now())}`, `DTSTART:${icsDate(start)}`, `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(title)}`,
    ...(location ? [`LOCATION:${icsText(location)}`] : []),
    ...(details ? [`DESCRIPTION:${icsText(details)}`] : []),
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  return new Response(ics, { headers: {
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': 'inline; filename="invitation.ics"',
    'Cache-Control': 'public, max-age=3600',
    'X-Robots-Tag': 'noindex',
    'X-Content-Type-Options': 'nosniff',
  } });
}
