import type { Template } from './models';

/** Studio-selected examples supplied for the Home banner; new uploads are the fallback. */
const featuredFiles: Record<string, string> = {
  wedding: '7000976f-027a-42b7-a947-4e4040a62f0b.html',
  'baby shower': 'baby-shower-invitation.html',
  birthday: 'birthday-red-gold.html',
  traditional: 'housewarming-invitation-bundled.html',
  'house warming': 'housewarming-invitation-bundled.html',
  housewarming: 'housewarming-invitation-bundled.html',
  'opening ceremony': 'grand-opening-maroon-curtains-fixed 2.html',
  'baby naming': 'ff132fd0-358a-4d33-a4b1-a36a97296ec1.html',
};
function basename(filename: string) {
  try { return decodeURIComponent(filename.split('/').pop()!.split('?')[0]); }
  catch { return filename; }
}
export function selectHeroTemplate(templates: Template[], category: string): Template | undefined {
  const key = category.trim().toLowerCase();
  const matches = templates.filter(item => item.category.trim().toLowerCase() === key && item.enabled !== false);
  const preferred = featuredFiles[key];
  return matches.find(item => basename(item.filename) === preferred) || matches[0];
}

/** Show the newest design first, followed by the selected example when different. */
export function selectHeroTemplates(templates: Template[], category: string): Template[] {
  const matches = templates.filter(item => item.category.trim().toLowerCase() === category.trim().toLowerCase() && item.enabled !== false);
  const newest = matches[0];
  const featured = selectHeroTemplate(templates, category);
  if (!newest) return [];
  return featured && basename(featured.filename) !== basename(newest.filename) ? [newest, featured] : [newest];
}
