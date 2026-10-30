// Readable invite links: "Priya & Rahul" -> "priya-and-rahul". Kept in sync with the SQL backfill.
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(name: string) {
  const slug = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return slug || 'invitation';
}

export function nextFreeSlug(base: string, taken: Iterable<string>) {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) if (!used.has(`${base}-${n}`)) return `${base}-${n}`;
}

/** Keyword-rich template link: "Still Us" + "Anniversary" -> "still-us-anniversary-invitation". */
export function templateSlug(title: string, category?: string | null) {
  // "invitation" always reads last, so a title ending in it doesn't push the occasion behind it.
  const name = slugify(title).replace(/(^|-)invitation$/, '');
  const words = new Set(name.split('-'));
  // Only the occasion words the title doesn't already say, so nothing repeats in the link.
  const occasion = category?.trim() ? slugify(category).split('-').filter(word => !words.has(word) && word !== 'invitation') : [];
  return [...(name ? [name] : []), ...occasion, ...(words.has('invitation') ? [] : ['invitation'])].join('-');
}

export function inviteUrlPath(order: { id: string; slug?: string | null }) {
  return `/invite/${order.slug || order.id}`;
}
