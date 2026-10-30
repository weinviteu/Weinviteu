// @vitest-environment node
import { readFileSync, existsSync } from 'node:fs';
import { Script } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { bundledTemplates } from '../src/lib/bundled-templates';
import { getTemplatePoster } from '../src/lib/template-posters';
import { templateFields, replaceTemplateFields } from '../src/lib/template-fields';

const designs = [
  ['wedding-premium-cinematic.html', 'INVITE.couple.groom.first'],
  ['wedding-luxury-south-indian.html', 'CFG.brideName'],
  ['grand-opening-premium.html', 'CFG.company'],
  ['gruhapravesham-premium.html', 'CFG.family'],
];
describe('imported premium invitations', () => {
  it.each(designs)('registers %s with its media, cover and editable details', (filename, fieldId) => {
    expect(bundledTemplates.filter(t => t.filename === filename)).toHaveLength(1);
    const source = readFileSync(`public/templates/${filename}`, 'utf8');
    expect(source.length).toBeLessThan(600_000);
    for (const script of source.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (script[1].includes('application/json')) JSON.parse(script[2]);
      else expect(() => new Script(script[2])).not.toThrow();
    }
    const assets = [...source.matchAll(/\/template-assets\/premium\/[\w.-]+/g)];
    expect(assets.length).toBeGreaterThan(0);
    for (const asset of assets) expect(existsSync(`public${asset[0]}`), asset[0]).toBe(true);
    const poster = getTemplatePoster(filename);
    expect(poster).toBeTruthy();
    expect(existsSync(`public${poster}`)).toBe(true);
    const edited = replaceTemplateFields(source, { [fieldId]: "O'Brien & Family" });
    expect(templateFields(edited).find(f => f.id === fieldId)?.value).toBe("O'Brien & Family");
  });
});
