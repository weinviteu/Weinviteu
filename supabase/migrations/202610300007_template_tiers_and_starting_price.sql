-- Collection tiers (Simple / Premium / Luxury) and the new ₹1,999 starting price for every template.
BEGIN;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'premium';
ALTER TABLE public.templates DROP CONSTRAINT IF EXISTS templates_tier_check;
ALTER TABLE public.templates ADD CONSTRAINT templates_tier_check CHECK (tier IN ('simple', 'premium', 'luxury'));
UPDATE public.templates SET price = '1999', original_price = '';
ALTER TABLE public.templates ALTER COLUMN price SET DEFAULT '1999';
ALTER TABLE public.templates ALTER COLUMN original_price SET DEFAULT '';
COMMIT;
