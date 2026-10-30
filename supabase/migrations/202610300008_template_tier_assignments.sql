-- Studio collection tiers for uploaded designs (built-in designs are set in src/lib/bundled-templates.ts).
BEGIN;
UPDATE public.templates SET tier = 'luxury'
WHERE id IN (
  17, -- Baby naming ceremony
  18, -- Royal grand wedding (uploaded 14 Oct)
  20  -- Shubha Gruhapravesam
);
UPDATE public.templates SET tier = 'simple'
WHERE id IN (
  12, -- royal grand wedding (uploaded 5 Oct)
  13  -- corporate meeting
);
COMMIT;
