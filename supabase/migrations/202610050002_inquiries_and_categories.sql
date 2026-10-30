-- Migration: Separate inquiries and orders, create categories table
BEGIN;

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  badge TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default categories
INSERT INTO public.categories (name, slug, badge, display_order) VALUES
  ('Wedding', 'wedding', 'WEDDING', 1),
  ('Birthday', 'birthday', 'BIRTHDAY', 2),
  ('Baby Shower', 'baby-shower', 'BABY SHOWER', 3),
  ('Traditional', 'traditional', 'TRADITIONAL', 4),
  ('Corporate', 'corporate', 'CORPORATE', 5),
  ('Anniversary', 'anniversary', 'ANNIVERSARY', 6)
ON CONFLICT (slug) DO NOTHING;

-- 2. Create inquiries table
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  category TEXT NOT NULL DEFAULT 'Wedding',
  template_name TEXT NOT NULL DEFAULT '',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'New Inquiry',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Ensure category_id columns exist on both templates and inquiries
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL;

-- 4. Link orders to inquiries (conversion tracking)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS inquiry_id UUID;

-- 5. Backfill templates category_id from existing category text
UPDATE public.templates t
SET category_id = c.id
FROM public.categories c
WHERE lower(trim(t.category)) = lower(trim(c.name))
  AND t.category_id IS NULL;

-- 6. Migrate existing inquiry rows from orders to inquiries
INSERT INTO public.inquiries (id, client_name, email, category, category_id, template_name, message, status, created_at)
SELECT 
  o.id, 
  o.client_name, 
  o.email, 
  CASE 
    WHEN o.template_name ILIKE '%wedding%' THEN 'Wedding'
    WHEN o.template_name ILIKE '%birthday%' THEN 'Birthday'
    WHEN o.template_name ILIKE '%anniversary%' THEN 'Anniversary'
    WHEN o.template_name ILIKE '%shower%' THEN 'Baby Shower'
    WHEN o.template_name ILIKE '%corporate%' THEN 'Corporate'
    WHEN o.template_name ILIKE '%traditional%' THEN 'Traditional'
    ELSE 'Wedding'
  END AS category,
  coalesce(o.template_name, ''),
  o.message, 
  coalesce(o.status, 'New Inquiry'), 
  o.created_at
FROM public.orders o
WHERE (o.status IN ('New Inquiry', 'Contacted') OR o.published_file IS NULL)
  AND o.source_html IS NULL 
  AND o.editor_state IS NULL
ON CONFLICT (id) DO NOTHING;

-- Clean up pure inquiry records from orders table
DELETE FROM public.orders
WHERE (status IN ('New Inquiry', 'Contacted') OR published_file IS NULL)
  AND source_html IS NULL 
  AND editor_state IS NULL;

-- 5. Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 6. Permissions and Policies
REVOKE ALL ON public.categories, public.inquiries FROM anon, authenticated;

-- Categories permissions
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.categories_id_seq TO authenticated;

DROP POLICY IF EXISTS categories_read ON public.categories;
DROP POLICY IF EXISTS categories_admin ON public.categories;
CREATE POLICY categories_read ON public.categories FOR SELECT USING (is_active OR public.is_admin());
CREATE POLICY categories_admin ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Inquiries permissions
GRANT INSERT (client_name, email, phone, category, template_name, message, status) ON public.inquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiries TO authenticated;

DROP POLICY IF EXISTS inquiries_insert_public ON public.inquiries;
DROP POLICY IF EXISTS inquiries_admin ON public.inquiries;
CREATE POLICY inquiries_insert_public ON public.inquiries FOR INSERT TO anon WITH CHECK (
  status = 'New Inquiry'
  AND length(client_name) BETWEEN 1 AND 200
  AND length(email) BETWEEN 3 AND 320
  AND length(coalesce(message, '')) <= 10000
);
CREATE POLICY inquiries_admin ON public.inquiries FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

COMMIT;
