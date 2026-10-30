import { readFileSync, existsSync } from 'node:fs';
import { Script } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { bundledTemplates, withBundledTemplates } from '../src/lib/bundled-templates';
import { templateIsVisible } from '../src/lib/template-visibility';
import { getTemplatePoster } from '../src/lib/template-posters';
import { templateFields } from '../src/lib/template-fields';
import { templateSlug } from '../src/lib/slug';
import type { Category } from '../src/lib/models';
const categories: Category[] = bundledTemplates.map((item, i) => ({ id: i + 1, name: item.category, slug: item.category.toLowerCase(), badge: '', display_order: i, is_active: true }));
describe('bundled 3D invitation collection', () => {
  it('shows the built-in collection only until its designs are in the database', () => {
    expect(new Set(bundledTemplates.map(t => t.category)).size).toBe(8);
    const uploaded = { ...bundledTemplates[0], id: 7, filename: 'uploaded.html' };
    const unseeded = withBundledTemplates([uploaded], categories);
    expect(unseeded).toHaveLength(bundledTemplates.length + 1);
    expect(unseeded.filter(t => templateIsVisible(t, categories))).toHaveLength(bundledTemplates.length + 1);
    expect(unseeded.filter(t => templateIsVisible(t, []))).toHaveLength(0);
  });
  it('keeps a hidden or deleted built-in design away once they are database rows', () => {
    // Visitors never receive hidden rows, so this list is what the public site sees with design 0 hidden.
    const rows = bundledTemplates.slice(1).map((t, i) => ({ ...t, id: i + 100 }));
    const merged = withBundledTemplates(rows, categories);
    expect(merged).toHaveLength(bundledTemplates.length - 1);
    expect(merged.some(t => t.filename === bundledTemplates[0].filename)).toBe(false);
    expect(merged.every(t => t.id >= 100)).toBe(true);
  });
  it('adds every built-in design to the admin migration with its current tier and link', () => {
    const sql = readFileSync('supabase/migrations/202610300010_builtin_templates_in_admin.sql', 'utf8');
    for (const t of bundledTemplates) {
      expect(sql).toContain(`('${t.title}', '${t.filename}', '${t.category}', '${t.badge}', '${t.tier}', '${templateSlug(t.title, t.category)}', '${t.created_at}')`);
    }
  });
  it('ships every HTML file and cover, with parseable scripts and editable event details', () => {
    for (const template of bundledTemplates.slice(0, 8)) {
      const source = readFileSync(`public/templates/${template.filename}`, 'utf8');
      for (const script of source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)) expect(() => new Script(script[1])).not.toThrow();
      expect(templateFields(source).some(field => field.id === 'CFG.venue')).toBe(true);
      const poster = getTemplatePoster(template.filename);
      expect(poster).toBeTruthy();
      expect(existsSync(`public${decodeURIComponent(poster!)}`)).toBe(true);
    }
  });
  it('gives each non-naming category a separate entrance structure', () => {
    const entrances = ['scene w-poster', 'scene b-age-scene', 'scene bs-cloud-scene', 'scene tr-card-scene', 'scene c-intro', 'scene a-letter-scene', 'scene g-card-scene'];
    bundledTemplates.slice(1, 8).forEach((template, index) => {
      const source = readFileSync(`public/templates/${template.filename}`, 'utf8');
      expect(source).toContain(`id="open"`);
      expect(source).toContain(entrances[index]);
      expect(source).not.toContain('class="book" id="book"');
    });
  });

});
