import { it, expect } from 'vitest';
import { slugify, nextFreeSlug, inviteUrlPath, SLUG_PATTERN } from '../src/lib/slug';
it('turns client names into readable links', () => {
  expect(slugify('Priya & Rahul')).toBe('priya-and-rahul');
  expect(slugify('  José   Müller!! ')).toBe('jose-muller');
  expect(slugify('ஆனந்த்')).toBe('invitation');
  expect(slugify('a'.repeat(100))).toHaveLength(60);
  for (const name of ['Priya & Rahul', '--x--', 'A.B.C']) expect(slugify(name)).toMatch(SLUG_PATTERN);
});
it('picks the next unused suffix', () => {
  expect(nextFreeSlug('asha', [])).toBe('asha');
  expect(nextFreeSlug('asha', ['asha', 'asha-2', 'asha-4'])).toBe('asha-3');
});
it('falls back to the order ID for links saved before slugs existed', () => {
  expect(inviteUrlPath({ id: 'abc' })).toBe('/invite/abc');
  expect(inviteUrlPath({ id: 'abc', slug: 'asha' })).toBe('/invite/asha');
});
