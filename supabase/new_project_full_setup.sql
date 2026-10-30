-- WeInviteU: complete database setup for a NEW, EMPTY Supabase project.
-- Paste everything into Supabase → SQL Editor and click Run. Safe to run again.
--
-- BEFORE RUNNING: change NEW_PROJECT_REF on the first line after BEGIN to your new project's address.
-- If you forget, this file stops with a clear error and changes nothing.
--
-- Contains: all tables, security rules, functions and storage buckets, plus the
-- 8 categories, 26 visible templates and the public studio details.
-- Does NOT contain (they are private): orders, inquiries, hidden rows, or uploaded files.
-- Copy those afterwards with scripts/migrate-supabase.mjs.

BEGIN;
SELECT set_config('migration.new_url', 'https://dqlthuyuttbvskjdxqlu.supabase.co', true);

DO $$ BEGIN
  IF current_setting('migration.new_url') !~ '^https://[a-z0-9-]+\.supabase\.co$' OR current_setting('migration.new_url') LIKE '%NEW_PROJECT_REF%' THEN
    RAISE EXCEPTION 'Set your new project address on the first line after BEGIN, e.g. https://abcdefgh.supabase.co (nothing was changed)';
  END IF;
END $$;

-- ═══ 1. TABLES ═══
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  badge TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.templates (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  category TEXT NOT NULL,
  category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
  badge TEXT NOT NULL DEFAULT '',
  bg TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  price TEXT DEFAULT '1999',
  original_price TEXT DEFAULT '',
  tier TEXT NOT NULL DEFAULT 'premium',
  slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.templates DROP CONSTRAINT IF EXISTS templates_tier_check;
ALTER TABLE public.templates ADD CONSTRAINT templates_tier_check CHECK (tier IN ('simple', 'premium', 'luxury'));
ALTER TABLE public.templates DROP CONSTRAINT IF EXISTS templates_slug_format;
ALTER TABLE public.templates ADD CONSTRAINT templates_slug_format CHECK (slug IS NULL OR slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
CREATE UNIQUE INDEX IF NOT EXISTS templates_slug_key ON public.templates (slug);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT,
  client_name TEXT NOT NULL,
  email TEXT NOT NULL,
  template_name TEXT NOT NULL DEFAULT '',
  template_filename TEXT,
  status TEXT NOT NULL DEFAULT 'New Inquiry',
  price TEXT NOT NULL DEFAULT '₹0',
  message TEXT,
  editor_state JSONB,
  source_html TEXT,
  published_file TEXT,
  inquiry_id UUID,
  email_sent_at TIMESTAMPTZ,
  email_sent_to TEXT,
  email_sent_count INTEGER NOT NULL DEFAULT 0,
  last_email_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_slug_format;
ALTER TABLE public.orders ADD CONSTRAINT orders_slug_format CHECK (slug IS NULL OR slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
CREATE UNIQUE INDEX IF NOT EXISTS orders_slug_key ON public.orders (slug);

CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  category TEXT NOT NULL DEFAULT 'Wedding',
  category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
  template_name TEXT NOT NULL DEFAULT '',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'New Inquiry',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settings (
  id INTEGER PRIMARY KEY,
  studio_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  location TEXT NOT NULL,
  email_notifications BOOLEAN DEFAULT false,
  whatsapp_tracking BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══ 2. FUNCTIONS ═══
-- Only server-managed app_metadata may grant administrator privileges.
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN LANGUAGE sql STABLE
SET search_path = '' AS $$ SELECT coalesce(auth.jwt()->'app_metadata'->>'role' = 'admin', false) $$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Guests open /invite/... without being able to read the orders table.
CREATE OR REPLACE FUNCTION public.invitation_file(invitation_id UUID) RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT published_file FROM public.orders WHERE id = invitation_id LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.invitation_file(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invitation_file(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.invitation_file_by_slug(invitation_slug TEXT) RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT published_file FROM public.orders WHERE slug = invitation_slug LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.invitation_file_by_slug(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invitation_file_by_slug(TEXT) TO anon, authenticated;

-- ═══ 3. WHO CAN DO WHAT ═══
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.categories, public.templates, public.orders, public.inquiries, public.settings FROM anon, authenticated;
GRANT SELECT ON public.categories, public.templates TO anon;
GRANT SELECT (id, studio_name, contact_email, whatsapp_number, location) ON public.settings TO anon;
GRANT INSERT (client_name, email, phone, category, template_name, message, status) ON public.inquiries TO anon;
GRANT INSERT (client_name, email, template_name, status, price, message) ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories, public.templates, public.orders, public.inquiries, public.settings TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.categories_id_seq, public.templates_id_seq TO authenticated;

DROP POLICY IF EXISTS categories_read ON public.categories;
DROP POLICY IF EXISTS categories_admin ON public.categories;
DROP POLICY IF EXISTS templates_read ON public.templates;
DROP POLICY IF EXISTS templates_admin ON public.templates;
DROP POLICY IF EXISTS orders_admin ON public.orders;
DROP POLICY IF EXISTS orders_inquiry ON public.orders;
DROP POLICY IF EXISTS inquiries_insert_public ON public.inquiries;
DROP POLICY IF EXISTS inquiries_admin ON public.inquiries;
DROP POLICY IF EXISTS settings_read ON public.settings;
DROP POLICY IF EXISTS settings_admin ON public.settings;

CREATE POLICY categories_read ON public.categories FOR SELECT USING (is_active OR public.is_admin());
CREATE POLICY categories_admin ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY templates_read ON public.templates FOR SELECT USING (enabled OR public.is_admin());
CREATE POLICY templates_admin ON public.templates FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY orders_admin ON public.orders FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY orders_inquiry ON public.orders FOR INSERT TO anon WITH CHECK (
  status = 'New Inquiry' AND price = '₹0' AND length(client_name) BETWEEN 1 AND 200
  AND length(email) BETWEEN 3 AND 320 AND length(coalesce(message, '')) <= 10000
  AND source_html IS NULL AND editor_state IS NULL AND published_file IS NULL
);
CREATE POLICY inquiries_insert_public ON public.inquiries FOR INSERT TO anon WITH CHECK (
  status = 'New Inquiry' AND length(client_name) BETWEEN 1 AND 200
  AND length(email) BETWEEN 3 AND 320 AND length(coalesce(message, '')) <= 10000
);
CREATE POLICY inquiries_admin ON public.inquiries FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY settings_read ON public.settings FOR SELECT USING (true);
CREATE POLICY settings_admin ON public.settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ═══ 4. FILE STORAGE ═══
INSERT INTO storage.buckets (id, name, public) VALUES
  ('custom-templates', 'custom-templates', true),
  ('base-templates', 'base-templates', true)
ON CONFLICT (id) DO NOTHING;
-- Also set the global Storage upload limit in the dashboard; Free projects cap it at 50 MB.
UPDATE storage.buckets SET file_size_limit = 104857600 WHERE id = 'base-templates';

DROP POLICY IF EXISTS invitation_storage_read ON storage.objects;
DROP POLICY IF EXISTS invitation_storage_admin ON storage.objects;
DROP POLICY IF EXISTS invitation_insert_guard ON storage.objects;
DROP POLICY IF EXISTS invitation_update_guard ON storage.objects;
DROP POLICY IF EXISTS invitation_delete_guard ON storage.objects;
CREATE POLICY invitation_storage_read ON storage.objects FOR SELECT USING (bucket_id IN ('custom-templates', 'base-templates'));
CREATE POLICY invitation_storage_admin ON storage.objects FOR ALL TO authenticated
  USING (bucket_id IN ('custom-templates', 'base-templates') AND public.is_admin())
  WITH CHECK (bucket_id IN ('custom-templates', 'base-templates') AND public.is_admin());
-- Restrictive policies stop any other permissive policy from granting public writes to these buckets.
CREATE POLICY invitation_insert_guard ON storage.objects AS RESTRICTIVE FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id NOT IN ('custom-templates', 'base-templates') OR public.is_admin());
CREATE POLICY invitation_update_guard ON storage.objects AS RESTRICTIVE FOR UPDATE TO anon, authenticated
  USING (bucket_id NOT IN ('custom-templates', 'base-templates') OR public.is_admin())
  WITH CHECK (bucket_id NOT IN ('custom-templates', 'base-templates') OR public.is_admin());
CREATE POLICY invitation_delete_guard ON storage.objects AS RESTRICTIVE FOR DELETE TO anon, authenticated
  USING (bucket_id NOT IN ('custom-templates', 'base-templates') OR public.is_admin());

-- ═══ 5. YOUR DATA ═══
INSERT INTO public.categories (id, name, slug, badge, display_order, is_active, created_at) VALUES
  (1, 'Wedding', 'wedding', 'WEDDING', 1, true, '2026-10-05T12:14:25.694243+00:00'),
  (2, 'Birthday', 'birthday', 'BIRTHDAY', 2, true, '2026-10-05T12:14:25.694243+00:00'),
  (3, 'Anniversary', 'anniversary', 'ANNIVERSARY', 6, true, '2026-10-05T12:14:25.694243+00:00'),
  (4, 'Baby Shower', 'baby-shower', 'BABY SHOWER', 3, true, '2026-10-05T12:14:25.694243+00:00'),
  (5, 'Traditional', 'traditional', 'TRADITIONAL', 4, true, '2026-10-05T12:14:25.694243+00:00'),
  (6, 'Corporate', 'corporate', 'CORPORATE', 5, true, '2026-10-05T12:14:25.694243+00:00'),
  (39, 'Opening ceremony', 'opening-ceremony', 'OPENING CEREMONY', 7, true, '2026-10-12T13:26:32.641882+00:00'),
  (40, 'Baby Naming', 'baby-naming', 'BABY NAMING', 8, true, '2026-10-12T14:22:44.999869+00:00')
ON CONFLICT DO NOTHING;

INSERT INTO public.templates (id, title, filename, category, category_id, badge, bg, enabled, price, original_price, tier, slug, created_at) VALUES
  (1, 'Anniversary Glow', 'anniversary-invitation (1).html', 'Anniversary', 3, 'ANNIVERSARY', 'bgSage', true, '1999', '', 'premium', 'anniversary-glow-invitation', '2026-10-03T07:21:51.594567+00:00'),
  (2, 'Baby Shower Bloom', 'baby-shower-invitation.html', 'Baby Shower', 4, 'BABY SHOWER', 'bgCream', true, '1999', '', 'premium', 'baby-shower-bloom-invitation', '2026-10-03T07:21:51.594567+00:00'),
  (3, 'Birthday Sparkle', 'birthday-invitation.html', 'Birthday', 2, 'BIRTHDAY', 'bgRose', true, '1999', '', 'premium', 'birthday-sparkle-invitation', '2026-10-03T07:21:51.594567+00:00'),
  (4, 'Red & Gold Royale', 'birthday-red-gold.html', 'Birthday', 2, 'BIRTHDAY', 'bgPeach', true, '1999', '', 'premium', 'red-and-gold-royale-birthday-invitation', '2026-10-03T07:21:51.594567+00:00'),
  (5, 'Griha Pravesh', 'griha-pravesh-invitation.html', 'Traditional', 5, 'HOUSEWARMING', 'bgOlive', true, '1999', '', 'premium', 'griha-pravesh-traditional-invitation', '2026-10-03T07:21:51.594567+00:00'),
  (6, 'Classic Elegance', 'invitation (2).html', 'Wedding', 1, 'WEDDING', 'bgLinen', true, '1999', '', 'premium', 'classic-elegance-wedding-invitation', '2026-10-03T07:21:51.594567+00:00'),
  (7, 'Pooja Divine', 'pooja-invitation.html', 'Traditional', 5, 'POOJA', 'bgMustard', true, '1999', '', 'premium', 'pooja-divine-traditional-invitation', '2026-10-03T07:21:51.594567+00:00'),
  (8, 'Corporate Summit', 'summit-invitation.html', 'Corporate', 6, 'CORPORATE', 'bgSlate', true, '1999', '', 'premium', 'corporate-summit-invitation', '2026-10-03T07:21:51.594567+00:00'),
  (9, 'Temple Cinematic', 'temple-invitation.html', 'Wedding', 1, 'WEDDING', 'bgBlush', true, '1999', '', 'premium', 'temple-cinematic-wedding-invitation', '2026-10-03T07:21:51.594567+00:00'),
  (12, 'royal grand wedding', current_setting('migration.new_url') || '/storage/v1/object/public/base-templates/2e1171ae-aab1-4889-904d-8b5190d39f10.html', 'Wedding', 1, 'EXCLUSIVE', NULL, true, '1999', '', 'simple', 'royal-grand-wedding-classic-invitation', '2026-10-05T06:44:49.620877+00:00'),
  (13, 'corporate meeting', current_setting('migration.new_url') || '/storage/v1/object/public/base-templates/516de1c5-0060-4e76-8223-0c3f4ef239d1.html', 'Corporate', 6, 'EXCLUSIVE', NULL, true, '1999', '', 'simple', 'corporate-meeting-invitation', '2026-10-05T10:16:10.252472+00:00'),
  (17, 'Baby naming ceremony', current_setting('migration.new_url') || '/storage/v1/object/public/base-templates/ff132fd0-358a-4d33-a4b1-a36a97296ec1.html', 'Baby Naming', 40, 'BABY NAMING', NULL, true, '1999', '', 'luxury', 'baby-naming-ceremony-invitation', '2026-10-12T14:33:00.79287+00:00'),
  (18, 'Royal grand wedding', current_setting('migration.new_url') || '/storage/v1/object/public/base-templates/7000976f-027a-42b7-a947-4e4040a62f0b.html', 'Wedding', 1, 'Wedding', NULL, true, '1999', '', 'luxury', 'royal-grand-wedding-invitation', '2026-10-14T05:59:08.307445+00:00'),
  (20, 'Shubha Gruhapravesam', 'housewarming-invitation-bundled.html', 'Traditional', 5, 'HOUSEWARMING', 'bgRose', true, '1999', '', 'luxury', 'shubha-gruhapravesam-traditional-invitation', '2026-10-14T08:06:32.615296+00:00'),
  (21, 'The Golden Wish', 'birthday-golden-wish.html', 'Birthday', 2, 'GIFT REVEAL', NULL, true, '1999', '', 'simple', 'the-golden-wish-birthday-invitation', '2026-10-29T09:00:00+00:00'),
  (22, 'Moonlit Wishes', 'baby-shower-moonlit-wishes.html', 'Baby Shower', 4, 'CLOUD REVEAL', NULL, true, '1999', '', 'simple', 'moonlit-wishes-baby-shower-invitation', '2026-10-29T09:00:00+00:00'),
  (23, 'Gruhapravesham', 'gruhapravesham-premium.html', 'Traditional', 5, 'HOUSEWARMING', NULL, true, '1999', '', 'luxury', 'gruhapravesham-traditional-invitation', '2026-10-29T14:30:00+00:00'),
  (24, 'Sacred Beginnings', 'traditional-sacred-beginnings.html', 'Traditional', 5, 'TEMPLE ENTRANCE', NULL, true, '1999', '', 'simple', 'sacred-beginnings-traditional-invitation', '2026-10-29T09:00:00+00:00'),
  (25, 'The Next Chapter', 'corporate-the-next-chapter.html', 'Corporate', 6, 'STAGE REVEAL', NULL, true, '1999', '', 'simple', 'the-next-chapter-corporate-invitation', '2026-10-29T09:00:00+00:00'),
  (26, 'Still Us', 'anniversary-still-us.html', 'Anniversary', 3, 'ANNIVERSARY ALBUM', NULL, true, '1999', '', 'simple', 'still-us-anniversary-invitation', '2026-10-29T09:00:00+00:00'),
  (27, 'Luxury South Indian Wedding', 'wedding-luxury-south-indian.html', 'Wedding', 1, 'TRADITIONAL LUXURY', NULL, true, '1999', '', 'luxury', 'luxury-south-indian-wedding-invitation', '2026-10-29T14:30:00+00:00'),
  (28, 'Luxury Wedding', 'wedding-premium-cinematic.html', 'Wedding', 1, 'CINEMATIC WEDDING', NULL, true, '1999', '', 'luxury', 'luxury-wedding-invitation', '2026-10-29T14:30:00+00:00'),
  (29, 'Golden Vows', 'wedding-golden-vows.html', 'Wedding', 1, 'PALACE DOORS', NULL, true, '1999', '', 'simple', 'golden-vows-wedding-invitation', '2026-10-29T09:00:00+00:00'),
  (30, 'Grand Opening', 'grand-opening-premium.html', 'Opening ceremony', 39, 'SHOWROOM JOURNEY', NULL, true, '1999', '', 'luxury', 'grand-opening-ceremony-invitation', '2026-10-29T14:30:00+00:00'),
  (31, 'The Grand Reveal', 'opening-ceremony-the-grand-reveal.html', 'Opening ceremony', 39, 'RIBBON REVEAL', NULL, true, '1999', '', 'simple', 'the-grand-reveal-opening-ceremony-invitation', '2026-10-29T09:00:00+00:00'),
  (32, 'A Little Star', 'baby-naming-little-star.html', 'Baby Naming', 40, '3D KEEPSAKE', NULL, true, '1999', '', 'simple', 'a-little-star-baby-naming-invitation', '2026-10-29T09:00:00+00:00')
ON CONFLICT DO NOTHING;

INSERT INTO public.settings (id, studio_name, contact_email, whatsapp_number, location) VALUES
  (1, 'WeInviteU', 'office@rakvih.in', '+91 82963 92047', 'Attur Layout, Yelahanka, Bengaluru, Karnataka 560064')
ON CONFLICT DO NOTHING;

-- New rows start at 1001, leaving room for the hidden rows the copy script brings over with their old ids.
SELECT setval('public.categories_id_seq', GREATEST(1000, (SELECT max(id) FROM public.categories)));
SELECT setval('public.templates_id_seq', GREATEST(1000, (SELECT max(id) FROM public.templates)));
COMMIT;

-- ═══ 6. AFTER RUNNING ═══
-- Create your admin in Authentication → Users, then run this line by itself with your email:
--
--   UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb WHERE email = 'YOUR_ADMIN_EMAIL';
