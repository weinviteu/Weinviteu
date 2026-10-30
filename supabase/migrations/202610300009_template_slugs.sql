-- Readable, permanent template links (/templates/luxury-wedding-invitation).
BEGIN;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE public.templates AS t SET slug = v.slug
FROM (VALUES
  (1, 'anniversary-glow-invitation'),
  (2, 'baby-shower-bloom-invitation'),
  (3, 'birthday-sparkle-invitation'),
  (4, 'red-and-gold-royale-birthday-invitation'),
  (5, 'griha-pravesh-traditional-invitation'),
  (6, 'classic-elegance-wedding-invitation'),
  (7, 'pooja-divine-traditional-invitation'),
  (8, 'corporate-summit-invitation'),
  (9, 'temple-cinematic-wedding-invitation'),
  (12, 'royal-grand-wedding-classic-invitation'),
  (13, 'corporate-meeting-invitation'),
  (17, 'baby-naming-ceremony-invitation'),
  (18, 'royal-grand-wedding-invitation'),
  (20, 'shubha-gruhapravesam-traditional-invitation')
) AS v(id, slug)
WHERE t.id = v.id AND t.slug IS NULL;

-- Any other row (hidden templates) gets a slug from its title, adding -2, -3… on repeats.
DO $$ DECLARE r RECORD; base TEXT; candidate TEXT; n INT; BEGIN
  FOR r IN SELECT id, title FROM public.templates WHERE slug IS NULL ORDER BY id LOOP
    base := regexp_replace(replace(lower(coalesce(r.title, '')), '&', ' and '), '[^a-z0-9]+', '-', 'g');
    base := trim(both '-' from left(trim(both '-' from base), 60));
    base := CASE WHEN base = '' THEN 'invitation' WHEN base ~ '(^|-)invitation(-|$)' THEN base ELSE base || '-invitation' END;
    candidate := base; n := 1;
    WHILE EXISTS (SELECT 1 FROM public.templates WHERE slug = candidate) LOOP
      n := n + 1; candidate := base || '-' || n;
    END LOOP;
    UPDATE public.templates SET slug = candidate WHERE id = r.id;
  END LOOP;
END $$;

-- The database guarantees no two templates ever share a link.
CREATE UNIQUE INDEX IF NOT EXISTS templates_slug_key ON public.templates (slug);
ALTER TABLE public.templates DROP CONSTRAINT IF EXISTS templates_slug_format;
ALTER TABLE public.templates ADD CONSTRAINT templates_slug_format CHECK (slug IS NULL OR slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
COMMIT;
