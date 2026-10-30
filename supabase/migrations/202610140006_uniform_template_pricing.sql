-- Apply the studio's new catalogue prices, including disabled templates.
BEGIN;
UPDATE public.templates SET price = '2999', original_price = '3999';
ALTER TABLE public.templates ALTER COLUMN price SET DEFAULT '2999';
ALTER TABLE public.templates ALTER COLUMN original_price SET DEFAULT '3999';
COMMIT;
