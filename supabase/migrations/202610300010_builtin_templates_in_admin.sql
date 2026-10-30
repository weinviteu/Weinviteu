-- Bring the 12 built-in designs into the database so Admin → Templates can list, edit, hide and delete all of them.
-- Safe to run more than once: a design already in the table is skipped.
BEGIN;
SELECT setval(pg_get_serial_sequence('public.templates', 'id'), GREATEST((SELECT max(id) FROM public.templates), 1));

INSERT INTO public.templates (title, filename, category, category_id, badge, tier, price, original_price, enabled, slug, created_at)
SELECT d.title, d.filename, d.category, c.id, d.badge, d.tier, '1999', '', true,
  -- A hidden template could already hold this link, so never collide with it.
  CASE WHEN EXISTS (SELECT 1 FROM public.templates t WHERE t.slug = d.slug) THEN d.slug || '-2' ELSE d.slug END,
  d.created_at::timestamptz
FROM (VALUES
  ('A Little Star', 'baby-naming-little-star.html', 'Baby Naming', '3D KEEPSAKE', 'simple', 'a-little-star-baby-naming-invitation', '2026-10-29T09:00:00.000Z'),
  ('Golden Vows', 'wedding-golden-vows.html', 'Wedding', 'PALACE DOORS', 'simple', 'golden-vows-wedding-invitation', '2026-10-29T09:00:00.000Z'),
  ('The Golden Wish', 'birthday-golden-wish.html', 'Birthday', 'GIFT REVEAL', 'simple', 'the-golden-wish-birthday-invitation', '2026-10-29T09:00:00.000Z'),
  ('Moonlit Wishes', 'baby-shower-moonlit-wishes.html', 'Baby Shower', 'CLOUD REVEAL', 'simple', 'moonlit-wishes-baby-shower-invitation', '2026-10-29T09:00:00.000Z'),
  ('Sacred Beginnings', 'traditional-sacred-beginnings.html', 'Traditional', 'TEMPLE ENTRANCE', 'simple', 'sacred-beginnings-traditional-invitation', '2026-10-29T09:00:00.000Z'),
  ('The Next Chapter', 'corporate-the-next-chapter.html', 'Corporate', 'STAGE REVEAL', 'simple', 'the-next-chapter-corporate-invitation', '2026-10-29T09:00:00.000Z'),
  ('Still Us', 'anniversary-still-us.html', 'Anniversary', 'ANNIVERSARY ALBUM', 'simple', 'still-us-anniversary-invitation', '2026-10-29T09:00:00.000Z'),
  ('The Grand Reveal', 'opening-ceremony-the-grand-reveal.html', 'Opening ceremony', 'RIBBON REVEAL', 'simple', 'the-grand-reveal-opening-ceremony-invitation', '2026-10-29T09:00:00.000Z'),
  ('Luxury Wedding', 'wedding-premium-cinematic.html', 'Wedding', 'CINEMATIC WEDDING', 'luxury', 'luxury-wedding-invitation', '2026-10-29T14:30:00.000Z'),
  ('Luxury South Indian Wedding', 'wedding-luxury-south-indian.html', 'Wedding', 'TRADITIONAL LUXURY', 'luxury', 'luxury-south-indian-wedding-invitation', '2026-10-29T14:30:00.000Z'),
  ('Grand Opening', 'grand-opening-premium.html', 'Opening ceremony', 'SHOWROOM JOURNEY', 'luxury', 'grand-opening-ceremony-invitation', '2026-10-29T14:30:00.000Z'),
  ('Gruhapravesham', 'gruhapravesham-premium.html', 'Traditional', 'HOUSEWARMING', 'luxury', 'gruhapravesham-traditional-invitation', '2026-10-29T14:30:00.000Z')
) AS d(title, filename, category, badge, tier, slug, created_at)
LEFT JOIN public.categories c ON lower(trim(c.name)) = lower(d.category)
WHERE NOT EXISTS (SELECT 1 FROM public.templates t WHERE t.filename = d.filename);
COMMIT;
