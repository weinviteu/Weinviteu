import { expect, it } from 'vitest';
import { selectHeroTemplate, selectHeroTemplates } from '../src/lib/hero-templates';
import { withBundledTemplates } from '../src/lib/bundled-templates';
import type { Template } from '../src/lib/models';
const row = (filename: string, category = 'Wedding', extra = {}): Template => ({ id: 1, filename, category, title: 'Preview', badge: '', enabled: true, ...extra });
it('uses the requested reference even when a bundled design comes first', () => {
  const reference = row('https://example.com/base-templates/7000976f-027a-42b7-a947-4e4040a62f0b.html');
  expect(selectHeroTemplate([row('wedding-golden-vows.html'), reference], 'Wedding')).toBe(reference);
});
it('handles encoded reference filenames and excludes disabled or other-category rows', () => {
  const reference = row('grand-opening-maroon-curtains-fixed%202.html', 'Opening ceremony');
  expect(selectHeroTemplate([row('new.html', 'Opening ceremony'), reference], 'Opening ceremony')).toBe(reference);
  expect(selectHeroTemplate([row('new.html'), row('birthday-red-gold.html', 'Birthday', { enabled: false })], 'Birthday')).toBeUndefined();
});
it('falls back to the newest available category design and sorts newer uploads before bundles', () => {
  const newest = row('new.html', 'Corporate', { created_at: '2026-11-01T00:00:00Z' });
  expect(withBundledTemplates([newest], [])[0]).toMatchObject(newest);
  expect(selectHeroTemplate([newest, row('old.html', 'Corporate')], 'Corporate')).toBe(newest);
});

it('includes the latest design and the requested favourite without duplicate slides', () => {
  const newest = row('wedding-golden-vows.html');
  const reference = row('7000976f-027a-42b7-a947-4e4040a62f0b.html');
  expect(selectHeroTemplates([newest, reference], 'Wedding')).toEqual([newest, reference]);
  expect(selectHeroTemplates([reference], 'Wedding')).toEqual([reference]);
});
