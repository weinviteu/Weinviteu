import { it, expect } from 'vitest';
import { templateIsVisible } from '../src/lib/template-visibility';
import type { Category, Template } from '../src/lib/models';
const template: Template = { id: 1, title: 'Wedding', filename: 'wedding.html', category: 'Wedding', badge: '', enabled: true };
const categories: Category[] = [{ id: 1, name: 'Wedding', slug: 'wedding', badge: '', display_order: 1, is_active: true }, { id: 2, name: 'Birthday', slug: 'birthday', badge: '', display_order: 2, is_active: false }];
it('hides templates when all categories are disabled or removed', () => {
  expect(templateIsVisible(template, [])).toBe(false);
  expect(templateIsVisible(template, categories.map(c => ({ ...c, is_active: false })))).toBe(false);
});
it('does not bypass a disabled linked category using an active category name', () => {
  expect(templateIsVisible({ ...template, category_id: 2 }, categories)).toBe(false);
  expect(templateIsVisible({ ...template, category_id: 1 }, categories)).toBe(true);
});
it('supports older templates without category IDs and hides disabled templates', () => {
  expect(templateIsVisible(template, categories)).toBe(true);
  expect(templateIsVisible({ ...template, enabled: false }, categories)).toBe(false);
});
