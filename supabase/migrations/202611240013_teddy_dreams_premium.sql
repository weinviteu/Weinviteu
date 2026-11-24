-- Move the "Teddy Dreams" baby shower design to the Premium collection (₹2,999).
-- Safe to run more than once.
UPDATE public.templates SET tier = 'premium', price = '2999' WHERE filename = 'baby-shower-teddy-dreams.html';
