import type { Category, Template } from "./models";
import { DEFAULT_TEMPLATE_PRICE } from "./template-pricing";
import { nextFreeSlug, templateSlug } from "./slug";

/** Source-controlled designs ship with the app; uploaded rows override matching files. */
export const bundledTemplates: Template[] = [
  {
    "id": -8100,
    "category": "Baby Naming",
    "title": "A Little Star",
    "filename": "baby-naming-little-star.html",
    "badge": "3D KEEPSAKE",
    "enabled": true,
    "created_at": "2026-10-29T09:00:00.000Z",
    "price": "1999",
    "original_price": "",
    "tier": "simple"
  },
  {
    "id": -8101,
    "category": "Wedding",
    "title": "Golden Vows",
    "filename": "wedding-golden-vows.html",
    "badge": "PALACE DOORS",
    "enabled": true,
    "created_at": "2026-10-29T09:00:00.000Z",
    "price": "1999",
    "original_price": "",
    "tier": "simple"
  },
  {
    "id": -8102,
    "category": "Birthday",
    "title": "The Golden Wish",
    "filename": "birthday-golden-wish.html",
    "badge": "GIFT REVEAL",
    "enabled": true,
    "created_at": "2026-10-29T09:00:00.000Z",
    "price": "1999",
    "original_price": "",
    "tier": "simple"
  },
  {
    "id": -8103,
    "category": "Baby Shower",
    "title": "Moonlit Wishes",
    "filename": "baby-shower-moonlit-wishes.html",
    "badge": "CLOUD REVEAL",
    "enabled": true,
    "created_at": "2026-10-29T09:00:00.000Z",
    "price": "1999",
    "original_price": "",
    "tier": "simple"
  },
  {
    "id": -8104,
    "category": "Traditional",
    "title": "Sacred Beginnings",
    "filename": "traditional-sacred-beginnings.html",
    "badge": "TEMPLE ENTRANCE",
    "enabled": true,
    "created_at": "2026-10-29T09:00:00.000Z",
    "price": "1999",
    "original_price": "",
    "tier": "simple"
  },
  {
    "id": -8105,
    "category": "Corporate",
    "title": "The Next Chapter",
    "filename": "corporate-the-next-chapter.html",
    "badge": "STAGE REVEAL",
    "enabled": true,
    "created_at": "2026-10-29T09:00:00.000Z",
    "price": "1999",
    "original_price": "",
    "tier": "simple"
  },
  {
    "id": -8106,
    "category": "Anniversary",
    "title": "Still Us",
    "filename": "anniversary-still-us.html",
    "badge": "ANNIVERSARY ALBUM",
    "enabled": true,
    "created_at": "2026-10-29T09:00:00.000Z",
    "price": "1999",
    "original_price": "",
    "tier": "simple"
  },
  {
    "id": -8107,
    "category": "Opening ceremony",
    "title": "The Grand Reveal",
    "filename": "opening-ceremony-the-grand-reveal.html",
    "badge": "RIBBON REVEAL",
    "enabled": true,
    "created_at": "2026-10-29T09:00:00.000Z",
    "price": "1999",
    "original_price": "",
    "tier": "simple"
  },
  {
    "id": -8108,
    "category": "Wedding",
    "title": "Luxury Wedding",
    "filename": "wedding-premium-cinematic.html",
    "badge": "CINEMATIC WEDDING",
    "enabled": true,
    "created_at": "2026-10-29T14:30:00.000Z",
    "price": "3999",
    "original_price": "",
    "tier": "luxury"
  },
  {
    "id": -8109,
    "category": "Wedding",
    "title": "Luxury South Indian Wedding",
    "filename": "wedding-luxury-south-indian.html",
    "badge": "TRADITIONAL LUXURY",
    "enabled": true,
    "created_at": "2026-10-29T14:30:00.000Z",
    "price": "3999",
    "original_price": "",
    "tier": "luxury"
  },
  {
    "id": -8110,
    "category": "Opening ceremony",
    "title": "Grand Opening",
    "filename": "grand-opening-premium.html",
    "badge": "SHOWROOM JOURNEY",
    "enabled": true,
    "created_at": "2026-10-29T14:30:00.000Z",
    "price": "3999",
    "original_price": "",
    "tier": "luxury"
  },
  {
    "id": -8111,
    "category": "Traditional",
    "title": "Gruhapravesham",
    "filename": "gruhapravesham-premium.html",
    "badge": "HOUSEWARMING",
    "enabled": true,
    "created_at": "2026-10-29T14:30:00.000Z",
    "price": "3999",
    "original_price": "",
    "tier": "luxury"
  }
];

export function withBundledTemplates(templates: Template[], categories: Category[]): Template[] {
  const registered = new Set(templates.map(item => item.filename.split("/").pop()));
  // Once the built-in designs are database rows (migration 202610300010) the table alone decides what shows.
  // Visitors can't read hidden rows, so falling back to this list would bring a hidden design straight back.
  const seeded = bundledTemplates.some(item => registered.has(item.filename));
  const bundled = (seeded ? [] : bundledTemplates).filter(item => !registered.has(item.filename)).map(item => {
    const category = categories.find(cat => cat.name.trim().toLowerCase() === item.category.toLowerCase());
    return { ...item, category_id: category?.id, price: DEFAULT_TEMPLATE_PRICE };
  });
  const all = [...bundled, ...templates];
  const taken = new Set(templates.flatMap(item => item.slug ? [item.slug] : []));
  // Newest first, so if two uploads share a title before they have stored slugs, the older one takes the -2.
  const slugs = new Map<number, string>();
  for (const item of [...all].sort((a, b) => b.id - a.id)) {
    const slug = item.slug || nextFreeSlug(templateSlug(item.title, item.category), taken);
    taken.add(slug);
    slugs.set(item.id, slug);
  }
  return all.map(item => ({ ...item, slug: slugs.get(item.id) })).sort((a, b) => {
    const aTime = Date.parse(a.created_at || '') || 0;
    const bTime = Date.parse(b.created_at || '') || 0;
    return bTime - aTime;
  });
}
