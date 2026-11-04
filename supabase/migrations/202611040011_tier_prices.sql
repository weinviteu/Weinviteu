-- The collection tier sets the price: Simple ₹1,999, Premium ₹2,999, Luxury ₹3,999. 18% GST is added on the site.
BEGIN;
UPDATE public.templates SET price = CASE tier WHEN 'simple' THEN '1999' WHEN 'luxury' THEN '3999' ELSE '2999' END;
ALTER TABLE public.templates ALTER COLUMN price SET DEFAULT '2999';
COMMIT;
