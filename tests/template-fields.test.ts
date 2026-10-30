// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { templateFields, replaceTemplateFields } from '../src/lib/template-fields';
import { renderInvitation, portraitSlots } from '../src/lib/invitation';
import { bundledTemplates } from '../src/lib/bundled-templates';
import { emptyEditor } from '../src/lib/models';

describe('template content customization', () => {
  it('extracts and round-trips shared details for every bundled template', () => {
    for (const filename of bundledTemplates.map(template => template.filename)) {
      const source = readFileSync(`public/templates/${filename}`, 'utf8');
      const fields = templateFields(source);
      expect(fields.length, filename).toBeGreaterThan(0);
      const text = fields.find(f => f.kind === 'text')!;
      const edited = replaceTemplateFields(source, { [text.id]: "Test O'Brien & family" });
      expect(templateFields(edited).find(f => f.id === text.id)?.value).toBe("Test O'Brien & family");
      expect(templateFields(edited).length).toBe(fields.length);
    }
  }, 15000);
  it('updates separate speaker and gallery portraits without overwriting another slot', () => {
    const source = '<script>const CFG={speakers:[{photo:"one.jpg"},{photo:"two.jpg"}]}; const PHOTOS=[{src:"gallery.jpg"}];</script>';
    expect(portraitSlots(source).map(f => f.id)).toEqual(['CFG.speakers.0.photo', 'CFG.speakers.1.photo', 'PHOTOS.0.src']);
    const html = renderInvitation(source, { ...emptyEditor(), images: { 'CFG.speakers.1.photo': 'data:image/png;base64,YQ==' } });
    const values = Object.fromEntries(templateFields(html).map(f => [f.id, f.value]));
    expect(values['CFG.speakers.0.photo']).toBe('one.jpg');
    expect(values['CFG.speakers.1.photo']).toBe('data:image/png;base64,YQ==');
    expect(values['PHOTOS.0.src']).toBe('gallery.jpg');
  });
  it('preserves quoted keys and safely quotes edited JavaScript literals', () => {
    const source = '<script>const CFG={"name":"Old", date:"2027-01-01T12:00:00+05:30", years:25};</script>';
    const result = replaceTemplateFields(source, { 'CFG.name': '</script> $& " \\', 'CFG.years': 30 });
    expect(result.match(/<\/script>/g)).toHaveLength(1);
    expect(templateFields(result).find(f => f.id === 'CFG.name')?.value).toBe('</script> $& " \\');
    expect(templateFields(result).find(f => f.id === 'CFG.years')?.value).toBe(30);
  });
});

it('rejects invalid dates and unsafe link destinations before publishing', async () => {
  const { templateFieldError } = await import('../src/lib/template-fields');
  const source = '<script>const CFG={date:"2027-01-01T12:00:00+05:30",venue:{map:"https://maps.google.com"}};</script>';
  expect(templateFieldError(source, { 'CFG.date': 'tomorrow' })).toContain('valid date');
  expect(templateFieldError(source, { 'CFG.venue.map': 'javascript:alert(1)' })).toContain('full https://');
  expect(templateFieldError(source, { 'CFG.date': '2027-02-14T18:00:00+05:30', 'CFG.venue.map': 'https://maps.google.com/?q=Chennai' })).toBeUndefined();
});

it('updates names repeated in the browser title without injecting markup', () => {
  const source = '<title>Anniversary · Arjun &amp; Meera</title><script>const CFG={names:["Arjun","Meera"]};</script>';
  const html = renderInvitation(source, { ...emptyEditor(), config: { 'CFG.names.0': 'Aarav', 'CFG.names.1': 'Diya & family' } });
  expect(html).toContain('<title>Anniversary · Aarav &amp; Diya &amp; family</title>');
});

it('detects and round-trips top-level config declarations like WEDDING_ISO, PHOTO_BRIDE, PHOTO_GROOM', () => {
  const source = `<script>
const WEDDING_ISO="";
const PHOTO_BRIDE="", PHOTO_GROOM="";
</script>`;
  const fields = templateFields(source);
  expect(fields.map(f => f.id)).toEqual(['WEDDING_ISO', 'PHOTO_BRIDE', 'PHOTO_GROOM']);
  expect(fields.find(f => f.id === 'PHOTO_BRIDE')?.kind).toBe('image');
  expect(fields.find(f => f.id === 'WEDDING_ISO')?.kind).toBe('date');

  const replaced = replaceTemplateFields(source, {
    WEDDING_ISO: '2027-02-14T10:30:00+05:30',
    PHOTO_BRIDE: 'https://example.com/b.jpg',
    PHOTO_GROOM: 'https://example.com/g.jpg'
  });
  expect(replaced).toContain('const WEDDING_ISO="2027-02-14T10:30:00+05:30";');
  expect(replaced).toContain('const PHOTO_BRIDE="https://example.com/b.jpg", PHOTO_GROOM="https://example.com/g.jpg";');
});

