/** Read literal content fields without executing uploaded template JavaScript. */
export interface TemplateField {
  id: string; label: string; group: string; value: string | number;
  kind: 'text' | 'number' | 'image' | 'url' | 'date'; start: number; end: number;
}
const roots = ['CFG', 'INVITE', 'EVENTS', 'PHOTOS', 'STORY', 'RSVP', 'INFO', 'THANKS'];
const names: Record<string, string> = {
  CFG: '', INVITE: '', EVENTS: 'Event', PHOTOS: 'Gallery photo', STORY: 'Story', RSVP: 'RSVP', INFO: 'Guest information', THANKS: 'Thank you',
  name: 'Name', full: 'Full name', first: 'First name', nick: 'Nickname', hosts: 'Hosts', host: 'Host',
  bride: 'Bride', groom: 'Groom', brideFamily: 'Bride’s family', groomFamily: 'Groom’s family',
  parents: 'Parents', names: 'Names', age: 'Age', years: 'Years together', married: 'Wedding date label',
  date: 'Event date & time (with timezone)', weddingAt: 'Wedding date & time (with timezone)', dateText: 'Displayed date', timeText: 'Displayed time',
  WEDDING_ISO: 'Wedding date & time (with timezone)', EVENT_ISO: 'Event date & time (with timezone)',
  PHOTO_BRIDE: 'Bride portrait', PHOTO_GROOM: 'Groom portrait',
  time: 'Time', venue: 'Venue', address: 'Address', map: 'Map link', line1: 'Address line 1', line2: 'Address line 2',
  rsvp: 'RSVP', by: 'Reply deadline', whatsapp: 'WhatsApp number', contacts: 'Contact', phone: 'Phone number',
  photo: 'Portrait', couplePhoto: 'Couple portrait', then: 'Then portrait', now: 'Now portrait', logo: 'Company logo',
  src: 'Photo', cap: 'Caption', speakers: 'Speaker', company: 'Company', event: 'Event name', title: 'Title',
  hi: 'Hindi text', lineAbove: 'Line above names', lineBelow: 'Line below names', thanks: 'Thank-you message',
};
function describe(id: string, value: string | number): Pick<TemplateField, 'label' | 'group' | 'kind'> {
  const parts = id.split('.');
  const leaf = parts.at(-1)!;
  const label = parts.map(p => /^\d+$/.test(p) ? String(Number(p) + 1) : names[p] ?? p.replace(/([a-z])([A-Z])/g, '$1 $2')).filter(Boolean).join(' · ');
  const kind = typeof value === 'number' ? 'number' : /^(photo|couplePhoto|then|now|logo)$/i.test(leaf) || /^PHOTO_/i.test(leaf) || (parts[0] === 'PHOTOS' && leaf === 'src') ? 'image' : /^(map|feedback)$/i.test(leaf) ? 'url' : /^(date|weddingAt)$/i.test(leaf) || /_ISO$/i.test(leaf) || (/^\d{4}-/.test(String(value))) ? 'date' : 'text';
  let group = 'Opening & event details';
  if (/venue|address|place|map/i.test(id)) group = 'Venue & directions';
  else if (/rsvp|contacts|phone|email|deadline/i.test(id)) group = 'RSVP & contacts';
  else if (/THANKS|thanks/i.test(id)) group = 'Closing & thank you';
  else if (/EVENTS|programme|schedule|agenda/i.test(id)) group = 'Events & programme';
  else if (/PHOTOS|STORY|speakers|photos|^PHOTO_/i.test(id)) group = 'Photos, story & speakers';
  else if (/INFO|parking|dress|notes|gifts|favours|access|tiers/i.test(id)) group = 'Guest information';
  else if (/date|weddingAt|time|muhurat|cake|_ISO/i.test(id)) group = 'Date & time';
  return { label, group, kind };
}
export function templateFields(source: string): TemplateField[] {
  const fields: TemplateField[] = [];
  // Inspect script bodies only, never apparent declarations in HTML attributes.
  const scripts = source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi);
  for (const script of scripts) {
    const body = script[1]; const offset = script.index! + script[0].indexOf('>') + 1;
    for (const root of roots) {
      const declaration = new RegExp(`\\bconst\\s+${root}\\s*=\\s*([\\[{])`).exec(body);
      if (!declaration) continue;
      let i = declaration.index + declaration[0].length - 1;
      function space() {
        for (;;) {
          while (/\s/.test(body[i] || '') && i < body.length) i++;
          if (body.slice(i, i + 2) === '//') { const end = body.indexOf('\n', i); i = end < 0 ? body.length : end + 1; }
          else if (body.slice(i, i + 2) === '/*') { const end = body.indexOf('*/', i + 2); i = end < 0 ? body.length : end + 2; }
          else break;
        }
      }
      function string() {
        const quote = body[i++]; let result = '';
        while (i < body.length) {
          const ch = body[i++];
          if (ch === quote) return result;
          if (ch !== '\\') { result += ch; continue; }
          const escaped = body[i++];
          const replacements: Record<string, string> = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', '0': '\0' };
          if (escaped === 'u' || escaped === 'x') {
            const length = escaped === 'u' ? 4 : 2;
            const digits = body.slice(i, i + length);
            if (!new RegExp(`^[0-9a-f]{${length}}$`, 'i').test(digits)) throw new Error('Unsupported escape');
            result += String.fromCharCode(parseInt(digits, 16)); i += length;
          } else result += replacements[escaped] ?? escaped;
        }
        throw new Error('Unterminated string');
      }
      function value(path: string) {
        space(); const start = i;
        if (body[i] === '{') {
          i++; space();
          while (i < body.length && body[i] !== '}') {
            space();
            const quoted = body[i] === '"' || body[i] === "'";
            const key = quoted ? string() : /^[\w$]+/.exec(body.slice(i))?.[0];
            if (!key) throw new Error('Unsupported key');
            if (!quoted) i += key.length;
            space(); if (body[i++] !== ':') throw new Error('Expected colon');
            value(`${path}.${key}`); space();
            if (body[i] === ',') { i++; space(); } else if (body[i] !== '}') throw new Error('Unsupported expression');
          }
          i++; return;
        }
        if (body[i] === '[') {
          i++; space(); let index = 0;
          while (i < body.length && body[i] !== ']') {
            value(`${path}.${index++}`); space();
            if (body[i] === ',') { i++; space(); } else if (body[i] !== ']') throw new Error('Unsupported expression');
          }
          i++; return;
        }
        let parsed: string | number | undefined;
        if (body[i] === '"' || body[i] === "'") parsed = string();
        else {
          const number = /^-?\d+(?:\.\d+)?\b/.exec(body.slice(i));
          if (number) { parsed = Number(number[0]); i += number[0].length; }
          else { while (i < body.length && !/[,}\]]/.test(body[i])) i++; }
        }
        if (parsed !== undefined) {
          const info = describe(path, parsed);
          // Exclude layout, theme constants, guest counters and technical keys.
          if (!/\.(key|size|pos|photo)$/.test(path) || info.kind === 'image') {
            if (!/\.(palette|votes|names)\.\d+\./.test(path) && !/\.(palette|votes)(\.|$)/.test(path)) fields.push({ id: path, value: parsed, ...info, start: offset + start, end: offset + i });
          }
        }
      }
      const checkpoint = fields.length;
      try { value(root); } catch { fields.splice(checkpoint); }
    }

    // Inspect standalone top-level config declarations like WEDDING_ISO, EVENT_ISO, PHOTO_BRIDE, PHOTO_GROOM
    const topDeclRegex = /\b(?:const|let|var)\s+([^;]+);/g;
    let topMatch: RegExpExecArray | null;
    while ((topMatch = topDeclRegex.exec(body)) !== null) {
      const decl = topMatch[1];
      const declOffset = topMatch.index + topMatch[0].indexOf(decl);
      const varRegex = /([A-Za-z0-9_$]+)\s*=\s*(['\"][^'\"]*['\"]|\d+(?:\.\d+)?)/g;
      let varMatch: RegExpExecArray | null;
      while ((varMatch = varRegex.exec(decl)) !== null) {
        const varName = varMatch[1];
        if (!/^(PHOTO_[A-Za-z0-9_$]+|[A-Za-z0-9_$]+_ISO|INVITE_[A-Za-z0-9_$]+)$/i.test(varName)) continue;
        const rawVal = varMatch[2];
        const valStart = offset + declOffset + varMatch.index + varMatch[0].indexOf(rawVal);
        const valEnd = valStart + rawVal.length;
        const parsedVal = rawVal.startsWith('"') || rawVal.startsWith("'") ? rawVal.slice(1, -1) : Number(rawVal);
        const info = describe(varName, parsedVal);
        if (!fields.some(f => f.id === varName)) {
          fields.push({ id: varName, value: parsedVal, ...info, start: valStart, end: valEnd });
        }
      }
    }
  }
  return fields;
}
export function replaceTemplateFields(source: string, values: Record<string, string | number>) {
  let result = source;
  for (const field of templateFields(source).sort((a, b) => b.start - a.start)) {
    const value = values[field.id];
    if (value === undefined || typeof value !== typeof field.value) continue;
    const literal = JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    result = result.slice(0, field.start) + literal + result.slice(field.end);
  }
  return result;
}

/** Validate fields that drive countdowns and clickable destinations before saving. */
export function templateFieldError(source: string, values: Record<string, string | number> = {}): string | undefined {
  for (const field of templateFields(source)) {
    const value = values[field.id];
    if (value === undefined) continue;
    if (typeof value !== typeof field.value) return `${field.label}: enter a ${typeof field.value === 'number' ? 'number' : 'text value'}.`;
    if (typeof value === 'number' && (!Number.isFinite(value) || value < 0 || value > 1000000)) return `${field.label}: enter a number between 0 and 1,000,000.`;
    if (typeof value !== 'string') continue;
    if (/[<>\u0000]/.test(value)) return `${field.label}: use plain text without HTML brackets.`;
    if (field.kind === 'date' && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value)))) return `${field.label}: enter a valid date and timezone, for example 2027-02-14T18:00:00+05:30.`;
    if (field.kind === 'url') {
      try { const url = new URL(value); if (!['https:', 'http:'].includes(url.protocol) || /["'\s]/.test(value)) throw new Error(); }
      catch { return `${field.label}: enter a full https:// or http:// link.`; }
    }
    if (/\.(phone|whatsapp)$/.test(field.id) && !/^\+?[\d ()-]{7,25}$/.test(value)) return `${field.label}: enter a phone number with country code.`;
  }
}
