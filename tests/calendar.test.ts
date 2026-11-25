// @vitest-environment node
import { it, expect } from 'vitest';
import { GET } from '../src/app/api/calendar/route';

const start = Date.UTC(2026, 11, 3, 5, 15);
const url = (params: Record<string, string>) => new Request(`https://site.test/api/calendar?${new URLSearchParams(params)}`);

it('returns an event the phone calendar can add', async () => {
  const res = GET(url({ title: 'Baby Shower — Hari & Sushma', start: String(start), end: String(start + 3 * 3600_000), location: '#238, 2nd Main; Yelahanka', details: 'Lunch after 12:30 PM.' }));
  expect(res.status).toBe(200);
  expect(res.headers.get('Content-Type')).toContain('text/calendar');
  const ics = await res.text();
  expect(ics).toContain('DTSTART:20261203T051500Z');
  expect(ics).toContain('DTEND:20261203T081500Z');
  expect(ics).toContain('SUMMARY:Baby Shower — Hari & Sushma');
  expect(ics).toContain('LOCATION:#238\\, 2nd Main\\; Yelahanka');
});

it('refuses missing, reversed or overlong events', () => {
  expect(GET(url({ start: String(start), end: String(start + 1000) })).status).toBe(400);
  expect(GET(url({ title: 'x', start: String(start), end: String(start - 1000) })).status).toBe(400);
  expect(GET(url({ title: 'x'.repeat(151), start: String(start), end: String(start + 1000) })).status).toBe(400);
});
