import { describe, expect, it } from 'vitest';
import { bundledTemplates, withBundledTemplates } from '../src/lib/bundled-templates';
import { templateSlug, SLUG_PATTERN } from '../src/lib/slug';
import { categoryPath, templatePath, templatePreviewPath } from '../src/lib/template-url';
import { findTemplate } from '../src/lib/template-catalogue';
import type { Template } from '../src/lib/models';

const row = (id: number, title: string, category: string, slug?: string): Template => ({ id, title, category, slug, filename: `${id}.html`, badge: '', enabled: true });

describe('readable template links', () => {
  it.each([
    ['Luxury Wedding', 'Wedding', 'luxury-wedding-invitation'],
    ['Still Us', 'Anniversary', 'still-us-anniversary-invitation'],
    ['Grand Opening', 'Opening ceremony', 'grand-opening-ceremony-invitation'],
    ['Red & Gold Royale', 'Birthday', 'red-and-gold-royale-birthday-invitation'],
    ['Baby naming ceremony', 'Baby Naming', 'baby-naming-ceremony-invitation'],
    ['Wedding Invitation', 'Wedding', 'wedding-invitation'],
    ['New invitation', 'Wedding', 'new-wedding-invitation'],
    ['Invitation', 'Birthday', 'birthday-invitation'],
    ['ನಮಸ್ಕಾರ', 'Wedding', 'wedding-invitation'],
  ])('%s (%s) -> %s', (title, category, expected) => {
    expect(templateSlug(title, category)).toBe(expected);
  });
  it('gives every bundled design a valid, unique slug', () => {
    const slugs = withBundledTemplates([], []).map(t => t.slug!);
    expect(slugs).toHaveLength(bundledTemplates.length);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(SLUG_PATTERN);
  });
  it('gives every bundled design its own id, so one design never opens another', () => {
    const ids = bundledTemplates.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('keeps stored slugs and separates uploads that share a title', () => {
    const list = withBundledTemplates([row(12, 'royal grand wedding', 'Wedding'), row(18, 'Royal grand wedding', 'Wedding'), row(20, 'Renamed', 'Wedding', 'kept-invitation')], []);
    const slug = (id: number) => list.find(t => t.id === id)!.slug;
    expect(slug(18)).toBe('royal-grand-wedding-invitation');
    expect(slug(12)).toBe('royal-grand-wedding-invitation-2');
    expect(slug(20)).toBe('kept-invitation');
  });
  it('resolves new and older links to the same template', () => {
    const list = withBundledTemplates([row(12, 'Unique Name', 'Wedding', 'stored-invitation')], []);
    for (const key of ['stored-invitation', '12', '12.html', 'unique-name']) expect(findTemplate(list, key)?.id).toBe(12);
    expect(findTemplate(list, 'missing')).toBeNull();
    const seeded = [{ ...bundledTemplates[8], id: 30 }];
    expect(findTemplate(seeded, String(bundledTemplates[8].id))?.id).toBe(30);
  });
  it('builds clean paths', () => {
    const t = { id: -1, slug: 'a-b-invitation', title: 'A B' };
    expect(templatePath(t)).toBe('/templates/a-b-invitation');
    expect(templatePreviewPath(t)).toBe('/templates/a-b-invitation/preview');
    expect(categoryPath('Baby Shower')).toBe('/templates?category=baby-shower');
  });
});
