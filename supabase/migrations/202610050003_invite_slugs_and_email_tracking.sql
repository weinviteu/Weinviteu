-- Readable, unique invite links (/invite/priya-and-rahul) and email delivery tracking.
BEGIN;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email_sent_to TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email_sent_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS last_email_error TEXT;

-- Backfill a slug for every existing order from the client name, oldest first, adding -2, -3… on repeats.
DO $$ DECLARE r RECORD; base TEXT; candidate TEXT; n INT; BEGIN
  FOR r IN SELECT id, client_name FROM public.orders WHERE slug IS NULL ORDER BY created_at LOOP
    base := regexp_replace(replace(lower(coalesce(r.client_name, '')), '&', ' and '), '[^a-z0-9]+', '-', 'g');
    base := trim(both '-' from left(trim(both '-' from base), 60));
    IF base = '' THEN base := 'invitation'; END IF;
    candidate := base; n := 1;
    WHILE EXISTS (SELECT 1 FROM public.orders WHERE slug = candidate) LOOP
      n := n + 1; candidate := base || '-' || n;
    END LOOP;
    UPDATE public.orders SET slug = candidate WHERE id = r.id;
  END LOOP;
END $$;

-- The database guarantees no two invitations ever share a link.
CREATE UNIQUE INDEX IF NOT EXISTS orders_slug_key ON public.orders (slug);
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_slug_format;
ALTER TABLE public.orders ADD CONSTRAINT orders_slug_format CHECK (slug IS NULL OR slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

CREATE OR REPLACE FUNCTION public.invitation_file_by_slug(invitation_slug TEXT) RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT published_file FROM public.orders WHERE slug = invitation_slug LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.invitation_file_by_slug(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invitation_file_by_slug(TEXT) TO anon, authenticated;

COMMIT;
