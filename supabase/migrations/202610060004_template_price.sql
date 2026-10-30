-- Add price and original_price columns to templates table
BEGIN;

ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS price TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS original_price TEXT;

COMMIT;
