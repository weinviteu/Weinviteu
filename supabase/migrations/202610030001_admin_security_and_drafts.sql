BEGIN;
CREATE TABLE IF NOT EXISTS public.templates (
  id SERIAL PRIMARY KEY, title TEXT NOT NULL, filename TEXT NOT NULL,
  category TEXT NOT NULL, badge TEXT NOT NULL DEFAULT '', bg TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true;
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), client_name TEXT NOT NULL,
  email TEXT NOT NULL, template_name TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'New Inquiry',
  price TEXT NOT NULL DEFAULT '₹0', message TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS template_filename TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS editor_state JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source_html TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS published_file TEXT;
-- Preserve links to invitations saved by the old implementation.
UPDATE public.orders o SET published_file = o.id::text || '.html'
WHERE published_file IS NULL AND EXISTS (
  SELECT 1 FROM storage.objects s WHERE s.bucket_id = 'custom-templates' AND s.name = o.id::text || '.html'
);
CREATE TABLE IF NOT EXISTS public.settings (
  id INTEGER PRIMARY KEY, studio_name TEXT NOT NULL, contact_email TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL, location TEXT NOT NULL,
  email_notifications BOOLEAN DEFAULT false, whatsapp_tracking BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.settings (id, studio_name, contact_email, whatsapp_number, location)
VALUES (1, 'WeInviteU Design Studio', 'hello@weinviteu.com', '+91 98765 43210', 'Bangalore, India') ON CONFLICT (id) DO NOTHING;

-- Only server-managed app_metadata may grant administrator privileges.
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN LANGUAGE sql STABLE
SET search_path = '' AS $$ SELECT coalesce(auth.jwt()->'app_metadata'->>'role' = 'admin', false) $$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Replace demo policies on this application's tables, preserving all rows.
DO $$ DECLARE policy RECORD; BEGIN
  FOR policy IN SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('templates','orders','settings','admins')
  LOOP EXECUTE format('DROP POLICY %I ON %I.%I', policy.policyname, policy.schemaname, policy.tablename); END LOOP;
  IF to_regclass('public.admins') IS NOT NULL THEN
    ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.admins FROM anon, authenticated;
  END IF;
END $$;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.templates, public.orders, public.settings FROM anon, authenticated;
GRANT SELECT ON public.templates TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.templates, public.orders, public.settings TO authenticated;
GRANT SELECT (id,studio_name,contact_email,whatsapp_number,location) ON public.settings TO anon;
GRANT INSERT (client_name,email,template_name,status,price,message) ON public.orders TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.templates_id_seq TO authenticated;
CREATE POLICY templates_read ON public.templates FOR SELECT USING (enabled OR public.is_admin());
CREATE POLICY templates_admin ON public.templates FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY orders_admin ON public.orders FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY orders_inquiry ON public.orders FOR INSERT TO anon WITH CHECK (
  status = 'New Inquiry' AND price = '₹0' AND length(client_name) BETWEEN 1 AND 200
  AND length(email) BETWEEN 3 AND 320 AND length(coalesce(message,'')) <= 10000
  AND source_html IS NULL AND editor_state IS NULL AND published_file IS NULL
);
CREATE POLICY settings_read ON public.settings FOR SELECT USING (true);
CREATE POLICY settings_admin ON public.settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO storage.buckets (id,name,public) VALUES ('custom-templates','custom-templates',true), ('base-templates','base-templates',true)
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS invitation_storage_read ON storage.objects;
DROP POLICY IF EXISTS invitation_storage_admin ON storage.objects;
CREATE POLICY invitation_storage_read ON storage.objects FOR SELECT USING (bucket_id IN ('custom-templates','base-templates'));
CREATE POLICY invitation_storage_admin ON storage.objects FOR ALL TO authenticated
USING (bucket_id IN ('custom-templates','base-templates') AND public.is_admin())
WITH CHECK (bucket_id IN ('custom-templates','base-templates') AND public.is_admin());
-- Restrictive policies also prevent older permissive storage policies from granting public writes to these buckets.
DROP POLICY IF EXISTS invitation_insert_guard ON storage.objects;
DROP POLICY IF EXISTS invitation_update_guard ON storage.objects;
DROP POLICY IF EXISTS invitation_delete_guard ON storage.objects;
CREATE POLICY invitation_insert_guard ON storage.objects AS RESTRICTIVE FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id NOT IN ('custom-templates','base-templates') OR public.is_admin());
CREATE POLICY invitation_update_guard ON storage.objects AS RESTRICTIVE FOR UPDATE TO anon, authenticated
USING (bucket_id NOT IN ('custom-templates','base-templates') OR public.is_admin())
WITH CHECK (bucket_id NOT IN ('custom-templates','base-templates') OR public.is_admin());
CREATE POLICY invitation_delete_guard ON storage.objects AS RESTRICTIVE FOR DELETE TO anon, authenticated
USING (bucket_id NOT IN ('custom-templates','base-templates') OR public.is_admin());

CREATE OR REPLACE FUNCTION public.invitation_file(invitation_id UUID) RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT published_file FROM public.orders WHERE id = invitation_id LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.invitation_file(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invitation_file(UUID) TO anon, authenticated;
COMMIT;
