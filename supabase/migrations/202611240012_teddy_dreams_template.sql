-- Add the "Teddy Dreams" baby shower design (luxury tier) to databases that already ran 202610300010.
-- Safe to run more than once: skipped when the design is already in the table.
BEGIN;
SELECT setval(pg_get_serial_sequence('public.templates', 'id'), GREATEST((SELECT max(id) FROM public.templates), 1));

INSERT INTO public.templates (title, filename, category, category_id, badge, tier, price, original_price, enabled, slug, created_at)
SELECT 'Teddy Dreams', 'baby-shower-teddy-dreams.html', 'Baby Shower', c.id, 'TEDDY ENVELOPE', 'luxury', '3999', '', true,
  CASE WHEN EXISTS (SELECT 1 FROM public.templates t WHERE t.slug = 'teddy-dreams-baby-shower-invitation')
       THEN 'teddy-dreams-baby-shower-invitation-2' ELSE 'teddy-dreams-baby-shower-invitation' END,
  '2026-11-24T10:00:00.000Z'::timestamptz
FROM (SELECT 1) AS one
LEFT JOIN public.categories c ON lower(trim(c.name)) = 'baby shower'
WHERE NOT EXISTS (SELECT 1 FROM public.templates t WHERE t.filename = 'baby-shower-teddy-dreams.html');
COMMIT;
